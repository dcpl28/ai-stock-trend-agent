import { getUncachableStripeClient } from './stripeClient';

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('[SEED] Checking for existing products...');
  const existing = await stripe.products.list({ limit: 100 });
  const existingNames = existing.data.map(p => p.name);

  if (existingNames.includes('Essential Plan') && existingNames.includes('Professional Plan')) {
    console.log('[SEED] Products already exist, skipping.');
    const products = existing.data;
    for (const p of products) {
      const prices = await stripe.prices.list({ product: p.id, active: true });
      console.log(`  ${p.name} (${p.id})`);
      for (const pr of prices.data) {
        console.log(`    Price: ${pr.id} - $${(pr.unit_amount || 0) / 100}/${pr.recurring?.interval}`);
      }
    }
    return;
  }

  console.log('[SEED] Creating Essential Plan (5 stocks)...');
  const essentialProduct = await stripe.products.create({
    name: 'Essential Plan',
    description: 'Daily AI stock analysis for 5 favourite stocks, delivered to your inbox at 6pm.',
    metadata: {
      plan_type: 'essential',
      stock_limit: '5',
    },
  });

  const essentialPrice = await stripe.prices.create({
    product: essentialProduct.id,
    unit_amount: 500,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan_type: 'essential' },
  });

  console.log(`  Created: ${essentialProduct.id}, Price: ${essentialPrice.id}`);

  console.log('[SEED] Creating Professional Plan (10 stocks)...');
  const proProduct = await stripe.products.create({
    name: 'Professional Plan',
    description: 'Daily AI stock analysis for 10 favourite stocks, delivered to your inbox at 6pm. Priority processing.',
    metadata: {
      plan_type: 'professional',
      stock_limit: '10',
    },
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 1000,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan_type: 'professional' },
  });

  console.log(`  Created: ${proProduct.id}, Price: ${proPrice.id}`);
  console.log('[SEED] Done! Products created successfully.');
}

seedProducts().catch(err => {
  console.error('[SEED] Error:', err);
  process.exit(1);
});
