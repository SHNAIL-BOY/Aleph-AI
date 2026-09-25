export function onRequestGet(context) {
  return Response.json({
    ok: Boolean(context.env.OPENAI_API_KEY),
    model: context.env.OPENAI_MODEL || "gpt-5.6-luna"
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}
