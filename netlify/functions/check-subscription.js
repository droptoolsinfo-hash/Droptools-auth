exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email } = JSON.parse(event.body);
    const key = process.env.STRIPE_SECRET_KEY;

    // 1. Procura customer pelo email
    const custRes = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(email)}&limit=1`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    const custData = await custRes.json();

    if (!custData.data || custData.data.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ active: false, reason: 'no_customer' })
      };
    }

    const customerId = custData.data[0].id;

    // 2. Verifica subscrições ativas
    const subRes = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=1`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    const subData = await subRes.json();

    const active = subData.data && subData.data.length > 0;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active, reason: active ? 'ok' : 'no_subscription' })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
