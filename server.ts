import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API : Route de santé
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "ALGS API is running" });
  });

  // Gestion de l'environnement
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // En production, on sert les fichiers du dossier 'dist'
    const distPath = path.join(process.cwd(), "dist");
    
    app.use(express.static(distPath));
    
    // Fallback pour SPA
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
