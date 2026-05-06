export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { nombre, shoe, color } = req.body;

    const prompt = `A realistic and moving close-up photograph taken at Plaza de la Ciudadania in Santiago, Chile, during a sunny day. In the extreme foreground, resting on the gray paved ground, is a single ${color} ${shoe}. Resting against the shoe is a square white card with neatly handwritten blue ink text: "${nombre}, ausente por fibromialgia". Camera at ground level, focused sharply on the shoe and card. Behind it, hundreds of diverse pairs of empty shoes in rows, varied colors and styles. In the background, blurred bokeh, the facade of La Moneda Palace with Chilean flag flying from the rooftop. Clear bright blue sky.`;

    const createResp = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          aspect_ratio: '1:1',
          output_format: 'webp',
          output_quality: 90
        }
      })
    });

    const prediction = await createResp.json();

    if (prediction.output && prediction.output[0]) {
      return res.status(200).json({ imageUrl: prediction.output[0] });
    } else {
      return res.status(500).json({ error: prediction.error || JSON.stringify(prediction) });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
