exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer r8_BQUpJU2t2TUXYufm7XCVjlVJNrIjRKs29Rgen',
        'Content-Type': 'application/json',
        'Prefer': 'wait=60'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          aspect_ratio: '1:1',
          output_format: 'png',
          output_quality: 90,
          num_outputs: 1
        }
      })
    });

    const data = await response.json();

    if (data.output && data.output.length > 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ imageUrl: data.output[0] }) };
    } else if (data.id) {
      // Poll
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
          headers: { 'Authorization': 'Bearer r8_BQUpJU2t2TUXYufm7XCVjlVJNrIjRKs29Rgen' }
        });
        const pollData = await poll.json();
        if (pollData.status === 'succeeded' && pollData.output) {
          return { statusCode: 200, headers, body: JSON.stringify({ imageUrl: pollData.output[0] }) };
        }
        if (pollData.status === 'failed') throw new Error('Generación fallida');
      }
      throw new Error('Tiempo agotado');
    } else {
      throw new Error(data.detail || 'Error desconocido');
    }
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
