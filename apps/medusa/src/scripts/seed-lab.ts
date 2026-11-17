/**
 * Seeds Belgium-only store config + Custom Lab products (incl. BTW 21%).
 *
 * Previous homepage list prices were excl. BTW — shop amounts are excl × 1.21.
 *
 *   npm run seed -w @arkastro/medusa
 *   # or: npx medusa exec ./src/scripts/seed-lab.ts
 */
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from '@medusajs/medusa/core-flows'
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from '@medusajs/framework/utils'
import type { ExecArgs } from '@medusajs/framework/types'

const LAB_SPACES_BASE =
  'https://arkastro-bucket.ams3.cdn.digitaloceanspaces.com/homepage/lab/'

/** Homepage excl. BTW → shop incl. BTW (21%). */
function inclBtw(exclEuro: number): number {
  return Math.round(exclEuro * 1.21 * 100) / 100
}

const LAB_PRODUCTS = [
  {
    handle: 'kerstbal',
    title: 'Kerstbal met custom logo',
    description:
      'Platte laser-cut kerstbal in hout met jouw logo. Meerdere ontwerpen beschikbaar — ideaal voor goodiebags of als relatiegeschenk.',
    excl: 1,
    image: 'kerstbal/PXL_20261012_213347456-optimized.webp',
    sku: 'LAB-KERSTBAL',
    stock: 50,
  },
  {
    handle: 'keychain-putte',
    title: 'Sleutelhanger #2580Putte',
    description:
      '3D-geprinte sleutelhanger met #2580Putte in de gemeente-kleuren.',
    excl: 1,
    image: 'keychain_putte/keychain-putte.webp',
    sku: 'LAB-KEYCHAIN-PUTTE',
    stock: 50,
  },
  {
    handle: 'felix',
    title: 'Felix — boekenstandaard',
    description: '3D-geprinte drakenboeksteun. Onze in-store klassieker.',
    excl: 7,
    image: 'felix/Felix.webp',
    sku: 'LAB-FELIX',
    stock: 20,
  },
]

export default async function seedLab({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const pricingModule = container.resolve(Modules.PRICING)

  const { data: stores } = await query.graph({
    entity: 'store',
    fields: ['id', 'supported_currencies.*', 'default_sales_channel_id'],
  })
  const store = stores[0]
  if (!store) {
    throw new Error('No store found. Start Medusa once so default data exists.')
  }

  const { data: salesChannels } = await query.graph({
    entity: 'sales_channel',
    fields: ['id', 'name'],
  })
  const salesChannel = salesChannels[0]
  if (!salesChannel) {
    throw new Error('No sales channel found.')
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: 'ArkAstro Custom Lab',
        supported_currencies: [{ currency_code: 'eur', is_default: true }],
        default_sales_channel_id: salesChannel.id,
      },
    },
  })

  // Belgium-only region
  let regionId: string
  const { data: existingRegions } = await query.graph({
    entity: 'region',
    fields: ['id', 'name', 'currency_code', 'countries.iso_2'],
  })
  const beRegion = existingRegions.find(
    (r: { countries?: { iso_2: string }[] }) =>
      r.countries?.some((c) => c.iso_2 === 'be')
  )

  if (beRegion) {
    regionId = beRegion.id
    logger.info(`Using existing region ${beRegion.name} (${regionId})`)
  } else {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: 'België',
            currency_code: 'eur',
            countries: ['be'],
            payment_providers: ['pp_system_default', 'pp_mollie_mollie'],
            automatic_taxes: true,
          },
        ],
      },
    })
    regionId = result[0].id
    logger.info(`Created België region ${regionId}`)
  }

  // Tax region BE + 21% BTW
  try {
    await createTaxRegionsWorkflow(container).run({
      input: [
        {
          country_code: 'be',
          provider_id: 'tp_system',
          default_tax_rate: {
            rate: 21,
            code: 'BTW',
            name: 'BTW 21%',
            is_combinable: false,
          },
        },
      ],
    })
    logger.info('Created BE tax region (BTW 21%)')
  } catch (e) {
    logger.info(`Tax region seed skipped (may already exist): ${(e as Error).message}`)
  }

  // Prices are tax-inclusive for EUR / België
  try {
    await pricingModule.createPricePreferences([
      { attribute: 'currency_code', value: 'eur', is_tax_inclusive: true },
      { attribute: 'region_id', value: regionId, is_tax_inclusive: true },
    ])
    logger.info('Enabled tax-inclusive price preferences')
  } catch (e) {
    logger.info(`Price preferences skipped: ${(e as Error).message}`)
  }

  // Stock location Putte
  let stockLocationId: string
  const { data: stockLocations } = await query.graph({
    entity: 'stock_location',
    fields: ['id', 'name'],
  })
  const putte = stockLocations.find((l: { name: string }) =>
    l.name.toLowerCase().includes('putte')
  )
  if (putte) {
    stockLocationId = putte.id
  } else {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: 'ArkAstro Putte',
            address: {
              address_1: 'Putte',
              city: 'Putte',
              country_code: 'be',
              province: 'Antwerpen',
            },
          },
        ],
      },
    })
    stockLocationId = result[0].id
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: stockLocationId, add: [salesChannel.id] },
    })
  }

  // Shipping profile + options
  let shippingProfileId: string
  const { data: profiles } = await query.graph({
    entity: 'shipping_profile',
    fields: ['id', 'name'],
  })
  if (profiles[0]) {
    shippingProfileId = profiles[0].id
  } else {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: [{ name: 'Default', type: 'default' }],
      },
    })
    shippingProfileId = result[0].id
  }

  const fulfillmentSets = await fulfillmentModule.listFulfillmentSets(
    {},
    { relations: ['service_zones'] }
  )
  let fulfillmentSet = fulfillmentSets[0]
  if (!fulfillmentSet) {
    fulfillmentSet = await fulfillmentModule.createFulfillmentSets({
      name: 'België fulfillment',
      type: 'shipping',
      service_zones: [
        {
          name: 'België',
          geo_zones: [{ type: 'country', country_code: 'be' }],
        },
      ],
    })
  }

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocationId },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  }).catch(() => undefined)

  const serviceZoneId = fulfillmentSet.service_zones?.[0]?.id
  if (serviceZoneId) {
    try {
      await createShippingOptionsWorkflow(container).run({
        input: [
          {
            name: 'Afhaling Putte',
            price_type: 'flat',
            provider_id: 'manual_manual',
            service_zone_id: serviceZoneId,
            shipping_profile_id: shippingProfileId,
            type: {
              label: 'Afhaling',
              description: 'Afhalen in Putte',
              code: 'pickup',
            },
            prices: [
              { currency_code: 'eur', amount: 0 },
              { region_id: regionId, amount: 0 },
            ],
            rules: [
              { attribute: 'enabled_in_store', value: 'true', operator: 'eq' },
              { attribute: 'is_return', value: 'false', operator: 'eq' },
            ],
          },
          {
            name: 'Verzending België',
            price_type: 'flat',
            provider_id: 'manual_manual',
            service_zone_id: serviceZoneId,
            shipping_profile_id: shippingProfileId,
            type: {
              label: 'Verzending',
              description: 'Verzending binnen België',
              code: 'be_shipping',
            },
            prices: [
              { currency_code: 'eur', amount: 5.5 },
              { region_id: regionId, amount: 5.5 },
            ],
            rules: [
              { attribute: 'enabled_in_store', value: 'true', operator: 'eq' },
              { attribute: 'is_return', value: 'false', operator: 'eq' },
            ],
          },
        ],
      })
      logger.info('Created shipping options (afhaling + verzending BE)')
    } catch (e) {
      logger.info(`Shipping options skipped: ${(e as Error).message}`)
    }
  }

  // Products
  const { data: existingProducts } = await query.graph({
    entity: 'product',
    fields: ['id', 'handle'],
  })
  const existingHandles = new Set(
    existingProducts.map((p: { handle: string }) => p.handle)
  )

  const toCreate = LAB_PRODUCTS.filter((p) => !existingHandles.has(p.handle))
  if (!toCreate.length) {
    logger.info('All lab products already exist — skipping product create')
    return
  }

  const { result: products } = await createProductsWorkflow(container).run({
    input: {
      products: toCreate.map((p) => ({
        title: p.title,
        handle: p.handle,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfileId,
        images: [{ url: `${LAB_SPACES_BASE}${p.image}` }],
        options: [{ title: 'Default', values: ['Standaard'] }],
        variants: [
          {
            title: 'Standaard',
            sku: p.sku,
            options: { Default: 'Standaard' },
            manage_inventory: true,
            prices: [{ amount: inclBtw(p.excl), currency_code: 'eur' }],
          },
        ],
        sales_channels: [{ id: salesChannel.id }],
      })),
    },
  })

  logger.info(`Created ${products.length} lab products (prices incl. BTW 21%)`)

  // Inventory levels
  const inventoryItems: { inventory_item_id: string; location_id: string; stocked_quantity: number }[] = []
  for (const product of products) {
    const match = toCreate.find((p) => p.handle === product.handle)
    const variant = product.variants?.[0]
    if (!variant?.inventory_items?.[0] && !variant?.id) continue
    const invId =
      variant.inventory_items?.[0]?.inventory_item_id ||
      (variant as { inventory_item_id?: string }).inventory_item_id
    if (!invId || !match) continue
    inventoryItems.push({
      inventory_item_id: invId,
      location_id: stockLocationId,
      stocked_quantity: match.stock,
    })
  }

  if (inventoryItems.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: inventoryItems },
    })
    logger.info(`Set inventory for ${inventoryItems.length} variants`)
  }

  logger.info('Lab seed complete.')
}
