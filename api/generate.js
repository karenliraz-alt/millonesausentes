export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { nombre, shoe, color } = req.body;
    const token = process.env.REPLICATE_API_TOKEN;

    const prompt = `Ultra-realistic protest photograph taken at ground level worm's eye view on gray granulated stone pavement. MAIN SUBJECT: one single ${color} ${shoe} in ultra-sharp focus filling 60% of frame, photographed from right profile angle, resting on its toe tip and stiletto heel, natural soft sunlight from upper right creating soft shadows underneath. Next to the shoe, leaning against it, a small precise 8x8cm white matte paper card with handwritten dark blue ink cursive text reading exactly: "${nombre} - Ausente por Fibromialgia", paper has slight granular texture. MIDDLE GROUND: hundreds of pairs of empty shoes arranged in curved rows receding into distance, worm eye perspective makes them appear to stretch far back, pairs include: worn red canvas sneakers, yellow rain boots, black dress shoes, blue sandals, clogs, all different styles and colors, each pair together side by side, gradual loss of focus toward background. BACKGROUND top third of image: Palacio de La Moneda Santiago Chile, neoclassical white cream limestone palace, completely isolated building no adjacent structures, extremely long horizontal single facade, evenly spaced tall rectangular windows, large central rounded arch entrance, decorative cornice, Chilean flag centered on roofline with horizontal white and red stripes blue square white star, soft atmospheric bokeh blur, clear luminous blue sky. Camera: 85mm lens, extremely shallow depth of field, bokeh, natural diffuse sunlight, solemn commemorative atmosphere, professional documentary photography.`;

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
