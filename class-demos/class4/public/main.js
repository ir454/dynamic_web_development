const list = document.getElementById("list");
const form = document.getElementById("form");
const input = document.getElementById("title");

async function load() {
  const res = await fetch("/songs");
  const songs = await res.json();
  list.innerHTML = "";
  songs.forEach(s => {
    list.innerHTML += `
      <li>
        ${s.title}
        <button onclick="edit(${s.id})">E</button>
        <button onclick="del(${s.id})">D</button>
      </li>
    `;
  });
}

form.onsubmit = async e => {
  e.preventDefault();
  await fetch("/songs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: input.value })
  });
  input.value = "";
  load();
};

async function edit(id) {
  const title = prompt("New title:");
  if (!title) return;
  await fetch("/songs/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title })
  });
  load();
}

async function del(id) {
  await fetch("/songs/" + id, { method: "DELETE" });
  load();
}

load();

