const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Datastore = require("@seald-io/nedb");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const db = new Datastore({ filename: "db.db", autoload: true });

app.use(express.static("public"));

// Load initial positions
let cubePositions = [
  { x: -5, z: 0 },
  { x: -2, z: 0 },
  { x: 1, z: 0 },
  { x: 4, z: 0 },
];

db.find({}, (err, docs) => {
  if (docs.length > 0) cubePositions = docs[0].cubes;
});

// Socket.IO connections
io.on("connection", (socket) => {
  // Send current positions
  socket.emit("positions", cubePositions);

  // Update cube position
  socket.on("update", (data) => {
    cubePositions[data.index] = { x: data.x, z: data.z };
    db.update({ _id: "cubes" }, { _id: "cubes", cubes: cubePositions }, { upsert: true }, (err) => {
      if (err) console.error("DB save error:", err);
    });
    io.emit("positions", cubePositions);
  });

  // Reset cubes
  socket.on("reset", () => {
    cubePositions = [
      { x: -5, z: 0 },
      { x: -2, z: 0 },
      { x: 1, z: 0 },
      { x: 4, z: 0 },
    ];
    db.update({ _id: "cubes" }, { _id: "cubes", cubes: cubePositions }, { upsert: true }, (err) => {
      if (err) console.error("DB save error:", err);
    });
    io.emit("positions", cubePositions);
  });
});

const PORT = 8001;
server.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
