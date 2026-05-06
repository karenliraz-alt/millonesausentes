export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { nombre, shoe, color } = req.body;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = 'imagen-fibromialgia@supple-century-468019-h2.iam.gserviceaccount.com';
    const projectId = 'supple-century-468019-h2';
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/cloud-platform'
    };
    const header = { alg: 'RS256', typ: 'JWT' };
    const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const signingInput = `${encode(header)}.${encode(payload)}`;
    const { createSign } = await import('crypto');
    const sign = createSign('RSA-SHA256');
    sign.update(signingInput);
    const signature = sign.sign(privateKey, 'base64url');
    const jwt = `${signingInput}.${signature}`;
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    const tokenData = await tokenResp.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return res.status(500).json({ error: 'No se pudo obtener token: ' + JSON.stringify(tokenData) });
    }
    const prompt = `A realistic and moving close-up photograph taken at Plaza de la Ciudadania in Santiago, Chile, during a sunny day. In the extreme foreground, resting on the gray paved ground, is a single ${color} ${shoe}. Resting against the shoe is a square white card with neatly handwritten blue ink text: "${nombre}, ausente por fibromialgia". Camera at ground level, focused sharply on the shoe and card. Behind it, hundreds of diverse pairs of empty shoes in rows, varied colors and styles. In the background, blurred bokeh, the facade of La Moneda Palace with Chilean flag flying from the rooftop. Clear bright blue sky.`;
    const imgResp = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-3.0-generate-002:predict`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: '1:1' }
        })
      }
    );
    const data = await imgResp.json();
    if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
      return res.status(200).json({ imageUrl: `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}` });
    } else {
      return res.status(500).json({ error: data.error?.message || JSON.stringify(data) });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
