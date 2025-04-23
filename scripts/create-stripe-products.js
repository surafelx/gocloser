// This script creates test products and prices in Stripe
// Run with: node scripts/create-stripe-products.js

const Stripe = require('stripe');

// Initialize Stripe with your API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY );

// Define the plans to create
const plans = [
  {
    name: 'Starter Plan',
    id: 'starter',
    description: 'Perfect for individual sales professionals',
    price: 2900, // in cents (29.00)
    interval: 'month',
    features: [
      'Unlimited AI coaching sessions',
      'Basic sales call analysis',
      '5 file uploads per month',
      'Email support'
    ]
  },
  {
    name: 'Professional Plan',
    id: 'professional',
    description: 'For serious sales professionals',
    price: 7900, // in cents (79.00)
    interval: 'month',
    features: [
      'Everything in Starter',
      'Advanced performance analytics',
      'Unlimited file uploads',
      'Priority support',
      'Custom training data integration'
    ]
  },
  {
    name: 'Team Plan',
    id: 'team',
    description: 'For sales teams and organizations',
    price: 19900, // in cents (199.00)
    interval: 'month',
    features: [
      'Everything in Professional',
      'Team analytics dashboard',
      'Admin controls',
      'Dedicated account manager',
      'Custom AI training',
      'API access'
    ]
  }
];

// Create products and prices
async function createProductsAndPrices() {
  console.log('Creating Stripe products and prices...');
  
  const results = {};
  
  for (const plan of plans) {
    try {
      // Create product
      console.log(`Creating product: ${plan.name}`);
      const product = await stripe.products.create({
        name: plan.name,
        id: `prod_${plan.id}`,
        description: plan.description,
        metadata: {
          features: JSON.stringify(plan.features)
        }
      });
      
      // Create price
      console.log(`Creating price for: ${plan.name}`);
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: 'usd',
        recurring: {
          interval: plan.interval
        },
        metadata: {
          plan_id: plan.id
        }
      });
      
      results[plan.id] = {
        product: product,
        price: price
      };
      
      console.log(`Created ${plan.name} with price ID: ${price.id}`);
    } catch (error) {
      console.error(`Error creating ${plan.name}:`, error.message);
    }
  }
  
  console.log('\nSummary of created products and prices:');
  for (const [planId, data] of Object.entries(results)) {
    console.log(`${planId.toUpperCase()}_PRICE_ID=${data.price.id}`);
  }
  
  console.log('\nAdd these to your .env.local file');
}

// Run the function
createProductsAndPrices().catch(error => {
  console.error('Error:', error);
});
