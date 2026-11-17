import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

/**
 * Sends Dutch order notification via ArkAstro mailer (Resend).
 * Requires MAILER_URL + MAILER_INTERNAL_KEY.
 */
export default async function orderPlacedMailHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const mailerUrl = process.env.MAILER_URL
  const mailerKey = process.env.MAILER_INTERNAL_KEY
  if (!mailerUrl || !mailerKey) {
    logger.warn('MAILER_URL / MAILER_INTERNAL_KEY not set — skipping order email')
    return
  }

  const { data: orders } = await query.graph({
    entity: 'order',
    fields: [
      'id',
      'display_id',
      'email',
      'total',
      'currency_code',
      'shipping_address.*',
      'items.*',
    ],
    filters: { id: data.id },
  })

  const order = orders[0]
  if (!order) {
    logger.warn(`Order ${data.id} not found for mailer`)
    return
  }

  const lines = (order.items || [])
    .map(
      (item: { title?: string; quantity?: number; unit_price?: number }) =>
        `- ${item.title} × ${item.quantity}`
    )
    .join('\n')

  const subject = `Bestelling #${order.display_id} — ArkAstro Custom Lab`
  const text = [
    `Bedankt voor je bestelling bij ArkAstro Custom Lab.`,
    ``,
    `Bestelling #${order.display_id}`,
    lines,
    ``,
    `Totaal: € ${Number(order.total ?? 0).toFixed(2)} (incl. BTW)`,
    ``,
    `We houden je op de hoogte van de status.`,
    ``,
    `Gedroomd en Gecreëerd door Arkastro.be`,
  ].join('\n')

  const notifyTo = process.env.TO_EMAIL || 'info@arkastro.be'

  // Customer confirmation
  if (order.email) {
    await postMail(mailerUrl, mailerKey, {
      subject,
      text,
      to: order.email,
      tag: 'order-confirmation',
    })
  }

  // Internal notify
  await postMail(mailerUrl, mailerKey, {
    subject: `[Lab] Nieuwe bestelling #${order.display_id}`,
    text: `Nieuwe bestelling van ${order.email || 'onbekend'}\n\n${text}`,
    to: notifyTo,
    tag: 'order-notify',
  })

  logger.info(`Order emails sent for #${order.display_id}`)
}

async function postMail(
  url: string,
  key: string,
  body: { subject: string; text: string; to: string; tag: string }
) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Mailer-Key': key,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Mailer ${res.status}: ${err}`)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
