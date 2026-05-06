import { GoogleAuth } = from 'google-auth-library';

const serviceAccount = {
  type: "service_account",
  project_id: "supple-century-468019-h2",
  private_key_id: "c6887965e33ccc409daf7ad103041b447d7a9eef",
  private_key: process.env.GOOGLE_PRIVATE_KEY,
  client_email: "imagen-fibromialgia@supple-century-468019-h2.iam.gserviceaccount.com",
  client_id: "105352470909866899141",
  token_uri: "https://oauth2.googleapis.com/token"
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { nombre, shoe, color } = req.body;

    const auth = new GoogleAuth({ credentials: serviceAccount, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    const prompt = `A realistic and moving close-up photograph taken at Plaza de la Ciudadania in Santiago, Chile, during a sunny day. In the extreme foreground, resting on the gray paved ground, is a single ${color} ${shoe}. Resting against the shoe is a square white card with neatly handwritten blue ink text: "${nombre}, ausente por fibromialgia". Camera at ground level, focused sharply on the shoe and card. Behind it, hundreds of diverse pairs of empty shoes in rows. In the background, blurred, the facade of La Moneda Palace with Chilean flag flying from the rooftop. Clear bright blue sky.`;

    const response = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/supple-century-468019-h2/locations/us-central1/publishers/google/models/imagegeneration@006:predict`,
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

    const data = await response.json();

    if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
      return res.status(200).json({ imageUrl: `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}` });
    } else {
      return res.status(500).json({ error: data.error?.message || 'Error generando imagen' });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
