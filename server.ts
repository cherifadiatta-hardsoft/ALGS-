import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Hostinger injecte souvent le port via process.env.PORT
  const PORT = process.env.PORT || 3000;

  // Sécurité et compression
  app.use(express.json());

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
    const distPath = path.resolve(process.cwd(), "dist");
    
    app.use(express.static(distPath, {
      maxAge: '1d',
      index: false
    }));
    
    // Fallback pour SPA
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
