"use client";
import { useState, useCallback } from "react";

export default function App() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState("file");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const processFile = useCallback((file) => {
    if (!file) return;
    setResult(null); setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = e.target.result;
      const img = document.createElement("img");
      img.onload = () => {
        const MAX = 1600;
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > MAX || h > MAX) {
          if (w >= h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setImage(dataUrl);
        setImageBase64(dataUrl.split(",")[1]);
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  }, []);

  const analyze = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const body = imageBase64
        ? { imageBase64 }
        : { imageUrl: url.trim() };

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      setResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch (err) {
      setError("Error al analizar. Inténtalo de nuevo.");
    }
    setLoading(false);
  };

  const reset = () => { setImage(null); setImageBase64(null); setUrl(""); setResult(null); setError(null); };

  const s = {
    wrap: { maxWidth: 680, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" },
    label: { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", margin: "0 0 6px", display: "block" },
    tag: { fontSize: 12, padding: "4px 12px", background: "#f5f5f5", borderRadius: 20, color: "#666", border: "1px solid #eee", display: "inline-block", margin: "4px 4px 0 0" },
    card: { background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "1.25rem", marginBottom: "1.5rem" },
  };

  const Btn = ({ label, onClick, disabled, secondary, success, flex, htmlFor }) => {
    const style = {
      padding: "13px 24px", fontSize: 15, fontWeight: 500,
      background: disabled ? "#aaa" : success ? "#1a7a4a" : secondary ? "#e5e5e5" : "#111",
      color: secondary ? "#333" : "#fff",
      border: "none", borderRadius: 999,
      cursor: disabled ? "not-allowed" : "pointer",
      flex: flex ? 1 : "none",
      display: "inline-block", textAlign: "center"
    };
    if (htmlFor) return <label htmlFor={htmlFor} style={style}>{label}</label>;
    return <button onClick={onClick} disabled={disabled} style={style}>{label}</button>;
  };

  return (
    <div style={s.wrap}>
      <span style={s.label}>Análisis fotográfico</span>
      <h1 style={{ fontSize: 26, fontWeight: 500, margin: "0 0 2rem" }}>Lente curatorial</h1>

      {!image && !result && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
            {["file", "url"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: "8px 20px", fontSize: 13, fontWeight: 500,
                background: mode === m ? "#111" : "#f5f5f5",
                color: mode === m ? "#fff" : "#666",
                border: "none", borderRadius: 999, cursor: "pointer"
              }}>
                {m === "file" ? "Galería" : "URL"}
              </button>
            ))}
          </div>

          {mode === "file" && (
            <div style={{ textAlign: "center", padding: "3rem 1rem", background: "#f9f9f9", borderRadius: 12, marginBottom: "1.5rem" }}>
              <p style={{ fontSize: 14, color: "#666", margin: "0 0 1.5rem" }}>Selecciona una foto desde tu dispositivo</p>
              <Btn label="Elegir foto" htmlFor="file-input" />
              <input id="file-input" type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) processFile(e.target.files[0]); }} />
            </div>
          )}

          {mode === "url" && (
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontSize: 13, color: "#666", margin: "0 0 10px" }}>Pega el enlace directo de una imagen pública</p>
              <input type="url" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", fontSize: 14, borderRadius: 8, border: "1px solid #ddd", marginBottom: 12 }} />
            </div>
          )}

          <Btn label="Analizar fotografía" onClick={analyze}
            disabled={(!imageBase64 && url.trim().length < 10) || loading} flex />
        </>
      )}

      {image && !result && (
        <>
          <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            <img src={image} alt="foto" style={{ width: "100%", maxHeight: 420, objectFit: "contain", display: "block", background: "#000" }} />
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: "2rem" }}>
            <Btn label={loading ? "Analizando…" : "Analizar fotografía"} onClick={analyze} disabled={loading} flex />
            <Btn label="Cambiar" onClick={reset} secondary />
          </div>
        </>
      )}

      {error && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: "1rem" }}>{error}</p>}

      {result && (
        <div>
          <div style={{ borderBottom: "1px solid #eee", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
            <span style={s.label}>Título de obra</span>
            <h2 style={{ fontSize: 21, fontWeight: 500, margin: "0 0 12px" }}>{result.titulo}</h2>
            <span style={s.tag}>{result.estado_emocional}</span>
            <span style={s.tag}>{result.movimiento}</span>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <span style={s.label}>Lectura artística</span>
            <p style={{ fontSize: 15, lineHeight: 1.8, margin: 0, fontFamily: "Georgia, serif" }}>{result.analisis_artistico}</p>
          </div>

          <div style={{ ...s.card, background: "#f9f9f9", borderLeft: "3px solid #ccc" }}>
            <span style={s.label}>Nota técnica</span>
            <p style={{ fontSize: 13, color: "#666", margin: 0, lineHeight: 1.7 }}>{result.analisis_tecnico}</p>
          </div>

          <div style={s.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={s.label}>Copy para Instagram</span>
              <Btn label={copied ? "¡Copiado!" : "Copiar"} onClick={() => { navigator.clipboard.writeText(result.copy_instagram); setCopied(true); setTimeout(() => setCopied(false), 2000); }} success={copied} />
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.85, margin: 0, whiteSpace: "pre-line" }}>{result.copy_instagram}</p>
          </div>

          <Btn label="Analizar otra foto" onClick={reset} secondary />
        </div>
      )}
    </div>
  );
}
