const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

let songs = [];

// GET
app.get("/songs", (req, res) => {
  res.json(songs);
});

// POST
app.post("/songs", (req, res) => {
  const song = { id: Date.now(), title: req.body.title };
  songs.push(song);
  res.json(song);
});

// PUT
app.put("/songs/:id", (req, res) => {
  const song = songs.find(s => s.id == req.params.id);
  if (song) song.title = req.body.title;
  res.json(song);
});

// DELETE
app.delete("/songs/:id", (req, res) => {
  songs = songs.filter(s => s.id != req.params.id);
  res.json({});
});

app.listen(8000, () => {
  console.log("starter server is working");
});

