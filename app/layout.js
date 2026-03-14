export const metadata = { title: "Lente Curatorial" };
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
