import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
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
}

function emailHtml(nome: string): string {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://imorender.pt'}/dashboard`
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo ao ImoRender</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#00D4AA 0%,#00B894 100%);padding:36px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">ImoRender</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px;">imorender.pt</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 8px;">
              <p style="font-size:17px;color:#111827;margin:0 0 12px;font-weight:600;">Olá ${nome},</p>
              <p style="font-size:15px;color:#374151;line-height:1.65;margin:0 0 28px;">
                Os teus <strong>100 créditos grátis</strong> estão prontos a usar.
              </p>
              <p style="font-size:15px;font-weight:700;color:#111827;margin:0 0 20px;">
                Para teres o melhor resultado possível no teu primeiro vídeo, segue estes passos:
              </p>
            </td>
          </tr>

          <!-- Steps -->
          <tr>
            <td style="padding:0 40px 28px;">

              <!-- Step 1 -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#F0FDF9;border-radius:12px;margin-bottom:12px;">
                <tr><td style="padding:20px 24px;">
                  <p style="font-size:13px;font-weight:700;color:#065F46;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px;">Passo 1 — Escolhe uma boa foto</p>
                  <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">
                    Uma foto nítida de um imóvel ou terreno. Quanto melhor a foto, melhor o resultado.
                  </p>
                </td></tr>
              </table>

              <!-- Step 2 -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#F0FDF9;border-radius:12px;margin-bottom:12px;">
                <tr><td style="padding:20px 24px;">
                  <p style="font-size:13px;font-weight:700;color:#065F46;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.5px;">Passo 2 — Escolhe o modo certo para o teu objetivo</p>
                  <table cellpadding="0" cellspacing="0">
                    <tr><td style="padding:4px 0;font-size:14px;color:#374151;">🎬&nbsp; Vídeo de um imóvel → <strong>Standard</strong> ou <strong>Pro</strong></td></tr>
                    <tr><td style="padding:4px 0;font-size:14px;color:#374151;">🔄&nbsp; Mostrar transformação → <strong>Antes/Depois</strong></td></tr>
                    <tr><td style="padding:4px 0;font-size:14px;color:#374151;">🛋️&nbsp; Mobilar uma divisão vazia → <strong>Mobilar Espaço</strong></td></tr>
                    <tr><td style="padding:4px 0;font-size:14px;color:#374151;">📐&nbsp; Visualizar um projeto num terreno → <strong>Projeto Aprovado</strong></td></tr>
                  </table>
                </td></tr>
              </table>

              <!-- Step 3 -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#F0FDF9;border-radius:12px;margin-bottom:28px;">
                <tr><td style="padding:20px 24px;">
                  <p style="font-size:13px;font-weight:700;color:#065F46;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.5px;">Passo 3 — Descreve em português o que queres ver</p>
                  <p style="font-size:14px;color:#374151;margin:0;line-height:1.6;">
                    Não precisas de saber inglês nem de conhecer IA. Descreve simplesmente o que imaginas.
                  </p>
                </td></tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:#00D4AA;border-radius:10px;">
                    <a href="${dashboardUrl}" style="display:inline-block;padding:16px 40px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                      👉 Começar agora
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:14px;color:#374151;line-height:1.65;margin:0 0 8px;">
                Qualquer dúvida estamos disponíveis em <a href="mailto:suporte@imorender.pt" style="color:#00B894;">suporte@imorender.pt</a>
              </p>
              <p style="font-size:14px;color:#374151;margin:0 0 32px;">
                Até já,<br />
                <strong>Equipa ImoRender</strong><br />
                <a href="https://imorender.pt" style="color:#00B894;">imorender.pt</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;padding:20px 40px;border-top:1px solid #E5E7EB;text-align:center;">
              <p style="font-size:12px;color:#9CA3AF;margin:0;">
                Recebeste este email porque criaste uma conta em imorender.pt.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST() {
  try {
    const supabase = getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const userId = session.user.id
    const email  = session.user.email!

    // Guard: só envia uma vez
    const { data: existing } = await supabaseAdmin
      .from('email_reminders')
      .select('id')
      .eq('user_id', userId)
      .eq('tipo', 'welcome')
      .maybeSingle()

    if (existing) return NextResponse.json({ skipped: true })

    // Buscar nome do perfil
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('nome')
      .eq('id', userId)
      .maybeSingle()

    const nome = profile?.nome?.split(' ')[0] || 'utilizador'

    const resend = new Resend(process.env.RESEND_API_KEY!)
    await resend.emails.send({
      from: 'ImoRender <noreply@imorender.pt>',
      to: email,
      subject: 'Bem-vindo ao ImoRender — começa aqui 🏠',
      html: emailHtml(nome),
    })

    await supabaseAdmin.from('email_reminders').insert({
      user_id: userId,
      tipo: 'welcome',
      enviado_em: new Date().toISOString(),
    })

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('Welcome email error:', err)
    return NextResponse.json({ error: 'Erro ao enviar email.' }, { status: 500 })
  }
}
