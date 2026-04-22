import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER!,
  team: process.env.STRIPE_PRICE_TEAM!,
  agency: process.env.STRIPE_PRICE_AGENCY!,
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plano } = await request.json()
  const priceId = PRICE_MAP[plano]
  if (!priceId) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', session.user.id)
    .single()

  const checkoutParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://imorender.netlify.app'}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://imorender.netlify.app'}/planos?canceled=true`,
    metadata: { user_id: session.user.id, plano },
    subscription_data: { metadata: { user_id: session.user.id, plano } },
  }

  if (profile?.stripe_customer_id) {
    checkoutParams.customer = profile.stripe_customer_id
  } else {
    checkoutParams.customer_email = profile?.email || session.user.email
  }

  const checkoutSession = await stripe.checkout.sessions.create(checkoutParams)
  return NextResponse.json({ url: checkoutSession.url })
}
