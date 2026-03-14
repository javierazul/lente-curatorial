export const runtime = "edge";

const SYSTEM_PROMPT = `Eres un crítico de arte y fotógrafo con voz poética y sensibilidad curatorial. Analizas imágenes con la profundidad de un texto de galería o fotolibro.

Cuando analices una imagen, responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin backticks, sin texto adicional):

{
  "titulo": "Un título evocador para la fotografía (como si fuera una obra de galería)",
  "analisis_artistico": "Párrafo poético y profundo que habla de la narrativa visual, emoción, simbolismo, paleta cromática como lenguaje, referencias a movimientos fotográficos o artísticos, lo que dice la imagen. Mínimo 80 palabras.",
  "analisis_tecnico": "Observación técnica concisa: luz, encuadre, profundidad de campo, momento decisivo. Máximo 30 palabras.",
  "copy_instagram": "Caption para Instagram con voz poética, como texto de galería adaptado a red social. Usa saltos de línea. Incluye 5-8 hashtags relevantes al final.",
  "estado_emocional": "Una sola palabra que define el mood de la imagen",
  "movimiento": "Movimiento fotográfico o artístico de referencia"
}`;

export async function POST(req) {
  const { imageBase64, imageUrl } = await req.json();

  const imageContent = imageBase64
    ? { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } }
    : { type: "image", source: { type: "url", url: imageUrl } };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [imageContent, { type: "text", text: "Analiza esta fotografía y devuelve el JSON solicitado." }]
      }]
    })
  });

  const data = await res.json();
  return Response.json(data);
}
