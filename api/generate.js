export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { nombre, shoe, color } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    const prompt = `Photorealistic protest scene, ground level perspective, extreme close-up of a brand new shiny ${color} ${shoe} in sharp focus filling 70% of the frame, resting on the gray granite stone pavement of Plaza de la Ciudadania in front of Palacio de La Moneda, the iconic Chilean government palace in Santiago, a long neoclassical white limestone building with the Chilean flag (red white and blue with star) flying on top, clear blue sky. Hundreds of pairs of colorful empty shoes neatly arranged in rows across the wide sunny plaza, many different types and colors spread evenly. A white paper card lying flat on the ground in front of the shoe with elegant handwritten text: "${nombre} - Ausente por Fibromialgia". Shallow depth of field, bokeh background, warm daylight, 85mm lens, documentary photography style, professional photo.`;

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
