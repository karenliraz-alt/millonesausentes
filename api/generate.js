export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { nombre, shoe, color } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    const prompt = `Photorealistic documentary protest photograph, ground level perspective on gray granite stone pavement. In the foreground center, one large ${color} ${shoe} in perfect sharp focus filling 60% of the frame. On both sides arranged in neat orderly rows, many PAIRS of diverse shoes: red canvas sneakers paired together, yellow ankle boots paired together, blue flat sandals paired together, black loafers paired together, pink heels paired together, brown boots paired together - each pair neatly side by side, NOT piled or stacked. A white paper card lying flat reads: "${nombre} - Ausente por Fibromialgia". Background blurred bokeh: the Palacio de La Moneda in Santiago Chile, a very long wide horizontal neoclassical government palace, white limestone facade, many tall rectangular windows with ornate frames, large central arched entrance portal, decorative cornice along roofline, Chilean flag with red white blue horizontal stripes and lone star flying on flagpole on top, surrounded by modern office buildings on sides, wide open sunny plaza, clear blue sky, warm golden sunlight. 85mm lens shallow depth of field, professional protest documentary photography.`;

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
