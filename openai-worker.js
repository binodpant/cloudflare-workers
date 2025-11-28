import OpenAI from "openai";

export default {
  async fetch(request, env, ctx) {
    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      // Parse incoming request body
      const body = await request.json();
      const { messages, model = "gpt-4o-mini", temperature = 0.7, max_tokens = 1000 } = body;

      // Validate messages
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ 
          error: "Invalid request: 'messages' array is required" 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Configure OpenAI client with Cloudflare AI Gateway
      const host = "https://gateway.ai.cloudflare.com";
      const endpoint = `/v1/${env.GATEWAY_ID}/${env.GATEWAY_NAME}/openai`;
      
      const client = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
        baseURL: host + endpoint,
      });

      // Call OpenAI through AI Gateway
      const response = await client.chat.completions.create({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens,
      });

      // Return the response
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Adjust for production
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });

    } catch (error) {
      console.error("Error calling OpenAI:", error);
      
      return new Response(JSON.stringify({ 
        error: "Failed to process request",
        details: error.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
