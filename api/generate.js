export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { nombre, shoe, color } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    const prompt = `Bright daylight photorealistic scene, extreme close-up macro shot of brand new shiny ${color} ${shoe}, luxurious leather texture, pristine perfect condition, resting on light gray stone pavement, THE SHOE FILLS 70% OF THE FRAME in sharp focus. A large white paper card lying flat on the pavement in front of the shoe, horizontal, well lit, elegant handwritten dark ink text reads exactly: "${nombre} - Ausente por Fibromialgia". Background shows hundreds of colorful empty shoes scattered across the sunny wide plaza in front of the Palacio de La Moneda in Santiago de Chile, the exact neoclassical Chilean government palace with white stone facade, tall columns, ornate windows and Chilean flag flying on top, beautiful bokeh blur. Warm bright daylight, clear blue sky. Emotional protest documentary photography, 85mm portrait lens, shallow depth of field, professional photography.`;

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
