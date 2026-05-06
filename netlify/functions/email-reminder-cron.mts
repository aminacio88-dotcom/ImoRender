export default async function handler() {
  const siteUrl = process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://imorender.netlify.app'
  const secret  = process.env.CRON_SECRET

  try {
    const res = await fetch(`${siteUrl}/api/cron/confirm-email-reminder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    console.log('Email reminder cron:', data)
  } catch (err) {
    console.error('Email reminder cron error:', err)
    throw err
  }
}

export const config = { schedule: '@hourly' }
