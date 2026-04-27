import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

const FAL_KEY = process.env.FAL_KEY!
fal.config({ credentials: FAL_KEY })

const TIMEOUT_MINUTES = 10

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: render } = await supabase
    .from('renders').select('*').eq('id', params.id).eq('user_id', session.user.id).single()

  if (!render) return NextResponse.json({ error: 'Render não encontrado.' }, { status: 404 })

  if (render.status === 'completed' || render.status === 'failed') {
    return NextResponse.json(render)
  }

  if (render.status === 'processing' && render.fal_request_id && render.modelo_usado) {
    const createdAt = new Date(render.created_at).getTime()
    const ageMinutes = (Date.now() - createdAt) / 60000
    if (ageMinutes > TIMEOUT_MINUTES) {
      console.warn(`Render ${render.id} stuck for ${ageMinutes.toFixed(1)} min — marking failed`)
      await supabase.from('renders').update({ status: 'failed' }).eq('id', render.id)
      await devolverCreditos(supabase, session.user.id, render.creditos_gastos)
      return NextResponse.json({ ...render, status: 'failed' })
    }

    try {
      const baseModel = render.modelo_usado.split('/').slice(0, 2).join('/')
      const statusUrl = `https://queue.fal.run/${baseModel}/requests/${render.fal_request_id}/status`
      console.log('Checking render status:', statusUrl)

      const statusRes = await fetch(statusUrl, {
        headers: { Authorization: `Key ${FAL_KEY}` },
      })

      if (!statusRes.ok) {
        const errText = await statusRes.text()
        console.error(`Render status HTTP ${statusRes.status}:`, errText)
        if (statusRes.status === 404) {
          await supabase.from('renders').update({ status: 'failed' }).eq('id', render.id)
          await devolverCreditos(supabase, session.user.id, render.creditos_gastos)
          return NextResponse.json({ ...render, status: 'failed' })
        }
        return NextResponse.json({ ...render, status: 'processing' })
      }

      const statusData = await statusRes.json() as { status: string }
      console.log('Fal render status:', statusData.status)

      if (statusData.status === 'COMPLETED') {
        console.log('Fetching render result via SDK for model:', render.modelo_usado)
        const result = await fal.queue.result(render.modelo_usado, {
          requestId: render.fal_request_id,
        })
        const anyResult = result as Record<string, unknown>

        // Extract image URL from various possible result shapes
        const falImageUrl =
          (anyResult?.images as Array<{ url: string }>)?.[0]?.url ||
          (anyResult?.image as { url?: string })?.url ||
          ((anyResult?.data as Record<string, unknown>)?.images as Array<{ url: string }>)?.[0]?.url ||
          (anyResult?.image_url as string) ||
          null

        console.log('Fal render image URL:', falImageUrl)

        if (!falImageUrl) {
          console.error('No image URL in render result:', JSON.stringify(anyResult).substring(0, 500))
          await supabase.from('renders').update({ status: 'failed' }).eq('id', render.id)
          await devolverCreditos(supabase, session.user.id, render.creditos_gastos)
          return NextResponse.json({ ...render, status: 'failed' })
        }

        // Download and store in Supabase Storage
        let finalRenderUrl = falImageUrl
        try {
          console.log('Downloading render image from fal.ai...')
          const imgRes = await fetch(falImageUrl)
          if (imgRes.ok) {
            const imgBuffer = await imgRes.arrayBuffer()
            const ext = falImageUrl.includes('.png') ? 'png' : 'jpg'
            const fileName = `${session.user.id}/${render.id}.${ext}`
            const serviceClient = getServiceClient()
            const { error: uploadError } = await serviceClient.storage
              .from('renders')
              .upload(fileName, imgBuffer, {
                contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
                upsert: true,
              })
            if (uploadError) {
              console.error('Render storage upload error:', uploadError.message)
            } else {
              const { data: publicData } = serviceClient.storage
                .from('renders')
                .getPublicUrl(fileName)
              finalRenderUrl = publicData.publicUrl
              console.log('Render stored in Supabase Storage:', finalRenderUrl)
            }
          }
        } catch (storageErr) {
          console.error('Render storage error (using fal URL as fallback):', storageErr)
        }

        await supabase.from('renders').update({ render_url: finalRenderUrl, status: 'completed' }).eq('id', render.id)
        return NextResponse.json({ ...render, status: 'completed', render_url: finalRenderUrl })
      }

      if (statusData.status === 'FAILED' || statusData.status === 'ERROR') {
        console.error('Fal render job failed:', statusData)
        await supabase.from('renders').update({ status: 'failed' }).eq('id', render.id)
        await devolverCreditos(supabase, session.user.id, render.creditos_gastos)
        return NextResponse.json({ ...render, status: 'failed' })
      }

      return NextResponse.json({ ...render, status: 'processing' })

    } catch (err) {
      console.error('Render status/result error:', err)
      return NextResponse.json({ ...render, status: 'processing' })
    }
  }

  return NextResponse.json(render)
}

async function devolverCreditos(supabase: ReturnType<typeof createServerClient>, userId: string, creditos: number) {
  const { data: profile } = await supabase.from('profiles').select('creditos').eq('id', userId).single()
  if (profile) {
    await supabase.from('profiles').update({ creditos: profile.creditos + creditos }).eq('id', userId)
  }
}
