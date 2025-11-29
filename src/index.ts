import OpenAI from "openai";

export interface Env {
  OPENAI_API_KEY: string;
  GATEWAY_ID: string;
  GATEWAY_NAME: string;
}

/**
 * Worker that talks to OpenAI completions endpoint using AI Gateway
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }

    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      // Parse incoming request body - expecting array of messages
      const messages = await request.json() as Array<{ role: string; content: string }>;

      // Validate messages
      if (!Array.isArray(messages) || messages.length === 0) {
        return new Response(JSON.stringify({ 
          error: "Invalid request: messages array is required" 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Configure OpenAI client with Cloudflare AI Gateway
      const host = "https://gateway.ai.cloudflare.com";
	  const endpoint = "/v1/88abdb2c13d48a821039d51768f92c6e/ai-edu-backend/compat";
      
      const client = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
        baseURL: host + endpoint,
      });

      // Call OpenAI through AI Gateway
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini", // or "gpt-4o", "gpt-4-turbo", etc.
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      // Return the response
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });

    } catch (error) {
      console.error("Error calling OpenAI:", error);
      
      return new Response(JSON.stringify({ 
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }
  }
} satisfies ExportedHandler<Env>;