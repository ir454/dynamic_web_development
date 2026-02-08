const $ = id => document.getElementById(id);
const artist = $("artist"), song = $("song"),
      lyrics = $("lyrics"), btn = $("search");

let controller;

btn.onclick = async () => {
  if (!artist.value || !song.value) return;

  controller?.abort();
  controller = new AbortController();

  lyrics.textContent = "Loading...";

  try {
    const r = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist.value)}&track_name=${encodeURIComponent(song.value)}`,
      { signal: controller.signal }
    );
    const d = await r.json();
    lyrics.textContent = d.plainLyrics || d.syncedLyrics || "Not found";
  } catch(e){
    if (e.name !== "AbortError") lyrics.textContent = "Error";
  }
};
