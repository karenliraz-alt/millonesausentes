export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { nombre, shoe, color } = req.body;
    const token = process.env.GEMINI_API_KEY;
    const projectId = 'supple-century-468019-h2';

    const prompt = `A realistic and moving close-up photograph taken at Plaza de la Ciudadania in Santiago, Chile, during a sunny day. In the extreme foreground, resting on the gray paved ground, is a single ${color} ${shoe} (representing fibromyalgia awareness). Resting against the shoe is a square white card with neatly handwritten blue ink text in Spanish: "${nombre}, ausente por fibromialgia". The camera is at ground level, focused sharply on the shoe and the card. Behind it, filling the middle ground, hundreds of diverse pairs of empty shoes (sneakers, boots, flats, loafers) are laid out in rows, stretching toward the background. The shoes are colorful but static, emphasizing collective absence. In the background, blurred but clearly identifiable, is the facade of La Moneda Palace, with the Chilean flag flying prominently from the central rooftop. Large commercial buildings line the background on both sides under a clear, bright blue sky.`;

    const response = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagegeneration@006:predict`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1'
          }
        })
      }
    );

    const data = await response.json();

    if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
      const base64 = data.predictions[0].bytesBase64Encoded;
      const imageUrl = `data:image/png;base64,${base64}`;
      return res.status(200).json({ imageUrl });
    } else {
      return res.status(500).json({ error: data.error?.message || 'Error generando imagen' });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
