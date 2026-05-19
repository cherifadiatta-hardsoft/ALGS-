import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  console.log(`Starting ALGS Server on port ${PORT}...`);

  // API : Route de santé
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "ALGS API is running",
      timestamp: new Date().toISOString()
    });
  });

  // Gestion de l'environnement
  if (process.env.NODE_ENV !== "production") {
    console.log("Mode: DEVELOPMENT (Vite Middleware)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Mode: PRODUCTION (Static Assets)");
    const distPath = path.join(process.cwd(), "dist");
    
    // Vérifier si le dossier dist existe
    app.use(express.static(distPath));
    
    // Fallback pour SPA
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`✅ Server successfully listening on http://0.0.0.0:${PORT}`);
    console.log(`Health check URL: /api/health`);
  });
}

startServer().catch(err => {
  console.error("❌ CRITICAL: Failed to start server:", err);
  process.exit(1);
});
