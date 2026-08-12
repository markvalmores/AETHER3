import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  
  // Setup Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Simple in-memory stats
  let activePlayers = 0;
  let totalGamersJoined = 0; // We can increment this on connection

  io.on("connection", (socket) => {
    activePlayers++;
    totalGamersJoined++;
    
    // Broadcast updated stats to everyone
    io.emit("statsUpdate", { activePlayers, totalGamersJoined });

    socket.on("disconnect", () => {
      activePlayers--;
      io.emit("statsUpdate", { activePlayers, totalGamersJoined });
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/stats", (req, res) => {
    res.json({ activePlayers, totalGamersJoined });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
