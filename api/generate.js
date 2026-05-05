export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { nombre, shoe, color } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    const prompt = `Photorealistic documentary protest photo, ground level view. Foreground: one ${color} ${shoe} sharp focus filling 60% frame center. Around it on gray granite pavement: pairs of shoes in loose grid formation, each pair side by side but slightly irregular as if placed by people - red sneaker pair, blue sandal pair, yellow boot pair, black loafer pair, green flat pair, pink heel pair, brown oxford pair, white sneaker pair - varied models and colors, not perfectly aligned. White card reads: "${nombre} - Ausente por Fibromialgia". Background fully blurred bokeh: Palacio de La Moneda Chile, an extremely long single-story neoclassical palace, brilliant white clean limestone, completely isolated building with no adjacent buildings visible, wide open blue sky above, central rounded arch entrance, evenly spaced rectangular tall windows across entire facade, Chilean tricolor flag red white blue with white star on flagpole centered on roofline, bright warm sunlight illuminating white facade, wide empty granite plaza in front. 85mm portrait lens, shallow depth of field, professional photography.`;

    const createResp = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { prompt, aspect_ratio: '1:1', output_format: 'png', output_quality: 90, num_outputs: 1 }
      })
    });

    const prediction = await createResp.json();
    if (!prediction.id) return res.status(500).json({ error: prediction.detail || 'Error' });

    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await poll.json();
      if (result.status === 'succeeded' && result.output) {
        return res.status(200).json({ imageUrl: result.output[0] });
      }
      if (result.status === 'failed') return res.status(500).json({ error: result.error });
    }
    return res.status(500).json({ error: 'Tiempo agotado' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
