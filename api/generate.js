export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { nombre, shoe, color } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    const prompt = `Professional protest documentary photograph. Camera at ground level, worm eye view, 85mm lens, f/1.8 shallow depth of field. CENTER FOREGROUND ultra sharp: one ${color} ${shoe} resting on gray granite stone tiles, shoe fills bottom 60% of frame. Leaning against shoe: white matte paper 8x8cm card, handwritten dark blue ink cursive: "${nombre} - Ausente por Fibromialgia". MIDDLE GROUND soft focus: dozens of pairs of empty shoes in loose rows, each pair side by side together on stone floor, variety of styles: red worn canvas sneakers pair, yellow rain boots pair, black oxford pair, blue flat sandals pair, brown ankle boots pair, green loafers pair, pink ballet flats pair, white sneakers pair. Shoes are human-placed not perfectly aligned. TOP THIRD heavily blurred atmospheric bokeh: Palacio La Moneda Santiago Chile government palace, pure brilliant white neoclassical limestone building, single long horizontal structure NO adjacent buildings, evenly spaced tall rectangular ornate windows across entire long facade, large central rounded arch main entrance, decorative stone cornice roofline, Chilean flag red white blue horizontal stripes lone white star on blue canton flying centered above building, wide open granite plaza, soft clear blue sky, warm natural golden sunlight illuminating white facade from right side.`;

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
