const ALLOWED_ORIGIN = "*";

export async function onRequestPost(context) {
  try {
    if (!context.env.OPENAI_API_KEY) {
      return json({ error: "OPENAI_API_KEY is not configured." }, 500);
    }

    const body = await context.request.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const clean = messages
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-40)
      .map(m => ({ role: m.role, content: m.content.slice(0, 12000) }));

    if (!clean.length || clean.at(-1).role !== "user") {
      return json({ error: "Invalid conversation." }, 400);
    }

    const model = context.env.OPENAI_MODEL || "gpt-5.6-luna";
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${context.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model, 
        messages: [
          { role: "system", content: "You are Aleph AI, a helpful, friendly AI assistant." },
          ...clean
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI error:", JSON.stringify(data));
      return json({ error: data.error?.message || "Request failed" }, response.status);
    }

    return json({ 
      text: data.choices?.[0]?.message?.content || "No response received.", 
      model: data.model, 
      id: data.id 
    });

  } catch (error) {
    console.error(error);
    return json({ error: "Server error while contacting the AI." }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Cache-Control": "no-store"
    }
  });
}
