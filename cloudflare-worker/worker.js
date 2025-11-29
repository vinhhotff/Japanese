// Cloudflare Worker - Proxy cho Workers AI API
// Deploy worker này lên Cloudflare để tránh CORS

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    try {
      const { messages } = await request.json();

      // Try multiple models in order of preference
      const models = [
        '@cf/meta/llama-3.1-8b-instruct',  // Most reliable
        '@cf/qwen/qwen1.5-14b-chat',       // Good for Japanese
        '@cf/mistral/mistral-7b-instruct-v0.1'
      ];

      let response = null;
      let lastError = null;

      // Try each model until one works
      for (const model of models) {
        try {
          response = await env.AI.run(model, {
            messages: messages,
            stream: false,
            max_tokens: 1000,
            temperature: 0.7,
          });
          
          if (response && (response.response || response.content)) {
            break; // Success!
          }
        } catch (modelError) {
          lastError = modelError;
          continue; // Try next model
        }
      }

      if (!response || (!response.response && !response.content)) {
        throw new Error(lastError?.message || 'All models failed');
      }

      return new Response(JSON.stringify({
        result: {
          response: response.response || response.content || ''
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};
