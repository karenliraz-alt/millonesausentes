export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { nombre, shoe, color } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    const prompt = `Professional protest documentary photograph. Camera at ground level worm eye view, 85mm lens f/1.8. CENTER FOREGROUND ultra sharp focus: one ${color} ${shoe} on gray granite tiles filling bottom 55% of frame. Leaning against shoe: white paper card clearly legible large text: "${nombre} - Ausente por Fibromialgia". MIDDLE GROUND: pairs of empty shoes in loose human-placed rows, varied styles and colors side by side: red sneakers pair, yellow boots pair, black oxfords pair, blue sandals pair, brown boots pair, pink flats pair. TOP THIRD blurred bokeh: Palacio La Moneda Santiago Chile, ABSOLUTELY FLAT ROOFLINE no dome no clock no tower no cupola, pure white neoclassical building, single long horizontal two-story facade, evenly spaced rectangular windows, large central rounded arch entrance, Chilean flag red white blue horizontal stripes white star flying on straight flat roof, wide open plaza, clear sunny blue sky, warm golden sunlight, NO trees NO people.`;

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
        headers: { 'Authorization': `B
