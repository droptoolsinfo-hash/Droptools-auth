const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email } = JSON.parse(event.body);

    const customers = await stripe.customers.list({
      email: email.toLowerCase().trim(),
      limit: 1
    });

    if (!customers.data.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({ active: false, reason: 'no_customer' })
      };
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: 'active',
      limit: 1
    });

    const active = subscriptions.data.length > 0;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active, reason: active ? 'ok' : 'no_subscription' })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
