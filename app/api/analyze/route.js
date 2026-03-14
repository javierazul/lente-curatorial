export const runtime = "edge";

const PROMPT = `Eres un crítico de arte y fotógrafo con voz poética y sensibilidad curatorial. Analizas imágenes con la profundidad de un texto de galería o fotolibro.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta (sin markdown, sin backticks, sin texto adicional):

{
  "titulo": "Un título evocador para la fotografía (como si fuera una obra de galería)",
  "analisis_artistico": "Párrafo poético y profundo que habla de la narrativa visual, emoción, simbolismo, paleta cromática como lenguaje, referencias a movimientos fotográficos o artísticos, lo que dice la imagen. Mínimo 80 palabras.",
  "analisis_tecnico": "Observación técnica concisa: luz, encuadre, profundidad de campo, momento decisivo. Máximo 30 palabras.",
  "copy_instagram": "Caption para Instagram con voz poética, como texto de galería adaptado a red social. Usa saltos de línea. Incluye 5-8 hashtags relevantes al final.",
  "estado_emocional": "Una sola palabra que define el mood de la imagen",
  "movimiento": "Movimiento fotográfico o artístico de referencia"
}`;

export async function POST(req) {
  try {
    const { imageBase64, imageUrl } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "API key no configurada en Vercel" }, { status: 500 });
    }

    let imagePart;
    if (imageBase64) {
      imagePart = { inlineData: { mimeType: "image/jpeg", data: imageBase64 } };
    } else if (imageUrl) {
      const imgRes = await fetch(imageUrl);
      const buffer = await imgRes.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const mime = imgRes.headers.get("content-type") || "image/jpeg";
      imagePart = { inlineData: { mimeType: mime, data: b64 } };
    } else {
      return Response.json({ error: "No se recibió imagen" }, { status: 400 });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [imagePart, { text: PROMPT }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1000 }
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data?.error?.message || `Error Gemini: ${res.status}` }, { status: res.status });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return Response.json({ text });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
