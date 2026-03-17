// Test Claude API connection
const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

if (!apiKey) {
  console.error('❌ API key not found in environment variables');
  console.log('Available env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
} else {
  console.log('✅ API key found:', apiKey.substring(0, 20) + '...');
  
  // Test API call
  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "Hello"' }]
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ API Response:', data);
  })
  .catch(error => {
    console.error('❌ API Error:', error);
  });
}
