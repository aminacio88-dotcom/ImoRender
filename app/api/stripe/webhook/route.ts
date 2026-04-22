import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

const CREDITS_MAP: Record<string, number> = {
  starter: 1000,
  team: 3200,
  agency: 12000,
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function getPeriodEnd(subscription: Stripe.Subscription): string | null {
  // In newer Stripe API versions, current_period_end is on the subscription item
  const item = subscription.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined
  const periodEnd = item?.current_period_end
  if (periodEnd) return new Date(periodEnd * 1000).toISOString()
  // Fallback: try top-level (older API behavior)
  const sub = subscription as Stripe.Subscription & { current_period_end?: number }
  if (sub.current_period_end) return new Date(sub.current_period_end * 1000).toISOString()
  return null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const plano = session.metadata?.plano

    if (!userId || !plano) return NextResponse.json({ received: true })

    const credits = CREDITS_MAP[plano] || 0
    const subscriptionId = session.subscription as string

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const renovacao = getPeriodEnd(subscription)

    await supabase.from('profiles').update({
      plano,
      creditos: credits,
      creditos_total: credits,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscriptionId,
      plano_renovacao: renovacao,
    }).eq('id', userId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.user_id

    if (!userId) return NextResponse.json({ received: true })

    await supabase.from('profiles').update({
      plano: 'free',
      creditos: 50,
      creditos_total: 50,
      stripe_subscription_id: null,
      plano_renovacao: null,
    }).eq('id', userId)
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.user_id

    if (!userId) return NextResponse.json({ received: true })

    const renovacao = getPeriodEnd(subscription)

    await supabase.from('profiles').update({
      plano_renovacao: renovacao,
    }).eq('id', userId)
  }

  return NextResponse.json({ received: true })
}
