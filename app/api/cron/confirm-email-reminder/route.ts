import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const WINDOW_MS   = 30 * 60 * 1000       // ±30 min tolerance
const MS_24H      = 24 * 60 * 60 * 1000
const MS_5D       = 5 * 24 * 60 * 60 * 1000

function emailHtml(nome: string, confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirma o teu email — ImoRender</title>
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
            <td style="padding:40px 40px 32px;">
              <p style="font-size:17px;color:#111827;margin:0 0 16px;font-weight:600;">Olá ${nome},</p>
              <p style="font-size:15px;color:#374151;line-height:1.65;margin:0 0 20px;">
                Reparámos que ainda não confirmaste o teu endereço de email — e isso significa que ainda não tens acesso a tudo o que o ImoRender tem para te oferecer.
              </p>
              <p style="font-size:15px;color:#374151;line-height:1.65;margin:0 0 32px;">
                Estás apenas a um clique de começar a criar vídeos profissionais dos teus imóveis com inteligência artificial — em português, em minutos, sem conhecimentos técnicos.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;">
                <tr>
                  <td style="background:#00D4AA;border-radius:10px;">
                    <a href="${confirmUrl}" style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">
                      Confirmar o meu email →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Feature list -->
              <table cellpadding="0" cellspacing="0" width="100%" style="background:#F0FDF9;border-radius:12px;padding:24px;margin-bottom:32px;">
                <tr><td style="padding:0 0 24px;">
                  <p style="font-size:14px;font-weight:700;color:#065F46;margin:0 0 16px;">Com o ImoRender podes:</p>
                  <table cellpadding="0" cellspacing="0">
                    <tr><td style="padding:6px 0;font-size:14px;color:#374151;">✅&nbsp; Transformar qualquer foto de imóvel num vídeo cinematográfico</td></tr>
                    <tr><td style="padding:6px 0;font-size:14px;color:#374151;">✅&nbsp; Mobilar divisões vazias com IA</td></tr>
                    <tr><td style="padding:6px 0;font-size:14px;color:#374151;">✅&nbsp; Criar conteúdo profissional para os teus anúncios em minutos</td></tr>
                  </table>
                </td></tr>
              </table>

              <p style="font-size:14px;color:#374151;line-height:1.65;margin:0 0 8px;">
                Os teus <strong>50 créditos grátis</strong> estão à tua espera — sem cartão de crédito, sem compromisso.
              </p>
              <p style="font-size:14px;color:#374151;line-height:1.65;margin:0 0 32px;">
                Se tiveres alguma dúvida estamos disponíveis em <a href="mailto:suporte@imorender.pt" style="color:#00B894;">suporte@imorender.pt</a>
              </p>

              <p style="font-size:14px;color:#374151;margin:0;">
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
                Recebeste este email porque te registaste em imorender.pt.<br />
                Se não foste tu, podes ignorar este email.
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

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY!)
  const now = new Date()
  const results = { reminder1: 0, reminder2: 0, skipped: 0, errors: 0 }

  // Fetch all unconfirmed users (up to 1000)
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (error) {
    console.error('listUsers error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const unconfirmed = users.filter(u => !u.email_confirmed_at && u.email)
  console.log(`Cron: ${unconfirmed.length} unconfirmed users`)

  for (const user of unconfirmed) {
    const msSince = now.getTime() - new Date(user.created_at).getTime()
    const isReminder1 = Math.abs(msSince - MS_24H) <= WINDOW_MS
    const isReminder2 = Math.abs(msSince - MS_5D)  <= WINDOW_MS

    if (!isReminder1 && !isReminder2) { results.skipped++; continue }

    const tipo = isReminder1 ? 'reminder_1' : 'reminder_2'

    // Skip if already sent
    const { data: existing } = await supabaseAdmin
      .from('email_reminders')
      .select('id')
      .eq('user_id', user.id)
      .eq('tipo', tipo)
      .maybeSingle()

    if (existing) { results.skipped++; continue }

    try {
      // Get first name from profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('nome')
        .eq('id', user.id)
        .maybeSingle()

      const nome = profile?.nome?.split(' ')[0] || 'utilizador'

      // Generate magic link (logs user in + confirms email on click)
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email!,
      })
      const confirmUrl = linkData?.properties?.action_link || 'https://imorender.pt/auth/login'

      await resend.emails.send({
        from: 'ImoRender <noreply@imorender.pt>',
        to: user.email!,
        subject: 'Falta apenas um passo para começares a usar o ImoRender 🏠',
        html: emailHtml(nome, confirmUrl),
      })

      await supabaseAdmin.from('email_reminders').insert({
        user_id: user.id,
        tipo,
        enviado_em: now.toISOString(),
      })

      if (tipo === 'reminder_1') results.reminder1++; else results.reminder2++
      console.log(`Sent ${tipo} to ${user.email}`)
    } catch (err) {
      console.error(`Error for ${user.email}:`, err)
      results.errors++
    }
  }

  console.log('Cron results:', results)
  return NextResponse.json(results)
}
