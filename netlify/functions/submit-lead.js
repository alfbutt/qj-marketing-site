const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/mMtrTqbMqNOoKetdQowt/webhook-trigger/8e25236f-80ad-4775-9840-0aaa060cda69';
const SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwVPlxCAaKOIIMUynptV6yNRyrcSLh-wF5oGY_yxnPw8lWNEDT38ZVqznKZVRS3_HsoCQ/exec';

async function postJSON(url, payload, attempt) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    if (res.ok) return true;
    if (attempt < 2) return postJSON(url, payload, attempt + 1);
    return false;
  } catch (err) {
    if (attempt < 2) return postJSON(url, payload, attempt + 1);
    return false;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const tasks = [
    payload.eventType === 'completed'
      ? postJSON(GHL_WEBHOOK_URL, {
          firstName: payload.firstName,
          email: payload.email,
          phone: payload.phone,
          licensed: payload.licensed,
          revenueOver350k: payload.revenueOver350k,
          source: payload.source
        }, 0)
      : Promise.resolve(true),
    postJSON(SHEETS_WEBHOOK_URL, payload, 0)
  ];

  const [ghlOk, sheetsOk] = await Promise.all(tasks);

  return {
    statusCode: (ghlOk && sheetsOk) ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ghlOk, sheetsOk })
  };
};
