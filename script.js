const DAYS = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
const PACKS = [
  { id: "ini", nome: "Iniciante", icone: "🌱", preco: "R$ 29,90", desc: "Guia de 3 treinos por semana para começar com segurança." },
  { id: "hip", nome: "Hipertrofia", icone: "💪", preco: "R$ 49,90", desc: "5 treinos semanais com vídeos para ganhar massa.", best: true },
  { id: "eme", nome: "Emagrecimento", icone: "🔥", preco: "R$ 59,90", desc: "Treinos, vídeos e dicas de alimentação." }
];
const KEY = "fitconnect-v2";

const fresh = () => ({
  plan: {}, locked: false, weekStart: new Date().toLocaleDateString("pt-BR"),
  logs: [], feedback: "", orders: []
});
let state;
try { state = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { state = fresh(); }

const $ = (id) => document.getElementById(id);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Navegação ---------- */
function show(view) {
  document.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== "view-" + view));
  document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("on", b.dataset.view === view));
  window.scrollTo(0, 0);
}
document.querySelectorAll("nav button").forEach((b) => (b.onclick = () => show(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => show(b.dataset.go)));

/* ---------- Plano semanal ---------- */
function renderWeek(el, mode) {
  el.innerHTML = "";
  let total = 0, done = 0;
  DAYS.forEach((day) => {
    const list = state.plan[day] || [];
    if (!list.length) return;
    const box = document.createElement("div");
    box.className = "day";
    box.innerHTML = "<h4>" + day + "</h4>";
    list.forEach((ex) => {
      total++; if (ex.done) done++;
      const row = document.createElement("div");
      row.className = "ex" + (ex.done ? " done" : "");
      const txt = document.createElement("span");
      txt.textContent = ex.nome + " – " + ex.series;
      if (mode === "aluno") {
        const cb = document.createElement("input");
        cb.type = "checkbox"; cb.checked = ex.done;
        cb.setAttribute("aria-label", "Concluir " + ex.nome);
        cb.onchange = () => { ex.done = cb.checked; save(); render(); };
        row.append(cb);
      }
      row.append(txt);
      if (mode === "personal" && !state.locked) {
        const del = document.createElement("button");
        del.className = "del ghost"; del.textContent = "Remover";
        del.onclick = () => { state.plan[day] = list.filter((e) => e !== ex); save(); render(); };
        row.append(del);
      }
      box.append(row);
    });
    el.append(box);
  });
  if (!total) el.innerHTML = '<p class="muted">Nenhum treino definido ainda.</p>';
  return { total, done };
}

function renderHistory(el) {
  el.innerHTML = "";
  if (!state.logs.length) el.innerHTML = '<li class="muted">Nenhum registro ainda.</li>';
  state.logs.slice().reverse().forEach((l) => {
    const li = document.createElement("li");
    li.textContent = l.data + " · " + l.peso + " kg · esforço " + l.esforco + "/5" + (l.nota ? " · " + l.nota : "");
    el.append(li);
  });
}

function render() {
  const { total, done } = renderWeek($("week-aluno"), "aluno");
  renderWeek($("week-personal"), "personal");
  const pct = total ? Math.round((done / total) * 100) : 0;
  $("fill").style.width = pct + "%";
  $("progress-text").textContent = done + " de " + total + " exercícios concluídos (" + pct + "%)";
  $("week-label").textContent = "· semana de " + state.weekStart;
  renderHistory($("history")); renderHistory($("history-p"));
  $("fb-aluno").textContent = state.feedback || "Nenhum recado por enquanto.";

  $("lock-msg").textContent = state.locked
    ? "🔒 Semana fixada. O aluno já pode treinar. Libere a edição para alterar."
    : "Escolha os dias, escreva os exercícios e fixe a semana quando terminar.";
  $("btn-lock").textContent = state.locked ? "Liberar edição" : "Fixar semana";
  document.querySelectorAll("#add-form input, #add-form textarea, #add-form button")
    .forEach((x) => (x.disabled = state.locked));

  const mine = $("my-packs"), orders = $("orders");
  mine.innerHTML = ""; orders.innerHTML = "";
  if (!state.orders.length) {
    mine.innerHTML = '<li class="muted">Você ainda não pediu nenhum pacote.</li>';
    orders.innerHTML = '<li class="muted">Nenhum pedido ainda.</li>';
  }
  state.orders.forEach((o) => {
    const text = o.pacote + " · " + o.data;
    const a = document.createElement("li"); a.textContent = text; mine.append(a);
    const b = document.createElement("li"); b.textContent = text; orders.append(b);
  });
}

/* ---------- Pacotes ---------- */
$("packs").innerHTML = PACKS.map((p) =>
  '<article class="card pack' + (p.best ? " best" : "") + '"><span class="ico">' + p.icone + "</span>" +
  "<h3>" + p.nome + '</h3><p class="muted">' + p.desc + '</p><p class="price">' + p.preco +
  '</p><button class="primary" data-pack="' + p.id + '">Quero este pacote</button></article>'
).join("");
document.querySelectorAll("[data-pack]").forEach((b) => (b.onclick = () => {
  const p = PACKS.find((x) => x.id === b.dataset.pack);
  state.orders.push({ pacote: p.nome, data: new Date().toLocaleDateString("pt-BR") });
  save(); render(); toast("Pedido registrado: " + p.nome);
}));

/* ---------- Formulários ---------- */
$("days-check").innerHTML = DAYS.map((d) =>
  '<label><input type="checkbox" value="' + d + '">' + d.slice(0, 3) + "</label>").join("");

$("add-form").onsubmit = (e) => {
  e.preventDefault();
  const days = [...document.querySelectorAll("#days-check input:checked")].map((i) => i.value);
  const lines = $("f-list").value.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!days.length) return toast("Marque pelo menos um dia.");
  days.forEach((day) => {
    state.plan[day] = state.plan[day] || [];
    lines.forEach((l) => {
      const [nome, series] = l.split(" - ");
      state.plan[day].push({ nome: nome.trim(), series: (series || "").trim() || "livre", done: false });
    });
  });
  e.target.reset(); save(); render(); toast("Exercícios adicionados!");
};

$("btn-lock").onclick = () => { state.locked = !state.locked; save(); render(); };
$("btn-new").onclick = () => {
  if (!confirm("Começar uma nova semana? Os treinos atuais serão apagados.")) return;
  state.plan = {}; state.locked = false; state.weekStart = new Date().toLocaleDateString("pt-BR");
  save(); render();
};

$("l-esforco").oninput = (e) => ($("l-out").textContent = e.target.value);
$("log-form").onsubmit = (e) => {
  e.preventDefault();
  state.logs.push({ data: new Date().toLocaleDateString("pt-BR"), peso: $("l-peso").value,
    esforco: $("l-esforco").value, nota: $("l-nota").value.trim() });
  e.target.reset(); $("l-out").textContent = "3"; save(); render(); toast("Registro salvo!");
};

$("fb-form").onsubmit = (e) => {
  e.preventDefault();
  state.feedback = $("fb-text").value.trim();
  e.target.reset(); save(); render(); toast("Recado enviado!");
};

render();

/* ---------- Cadastro, perfis e personais ---------- */
const SEEDS = [
  { id: 1, tipo: "personal", nome: "Ana Lima", cref: "000001-G/XX (exemplo)", esp: "Hipertrofia, Força", cidade: "Recife", valor: 80, bio: "Treinos objetivos para ganhar força com segurança." },
  { id: 2, tipo: "personal", nome: "Carlos Mendes", cref: "000002-G/XX (exemplo)", esp: "Emagrecimento, Corrida", cidade: "Salvador", valor: 70, bio: "Foco em constância, saúde e boa alimentação." }
];
state.trainers = state.trainers || SEEDS.slice();
state.user = state.user || null;
state.chosen = state.chosen || null;

const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const avatar = (u, big) => u.foto
  ? '<img class="avatar' + (big ? " big" : "") + '" src="' + u.foto + '" alt="Foto de ' + esc(u.nome) + '">'
  : '<span class="avatar' + (big ? " big" : "") + '">' + esc((u.nome || "?")[0].toUpperCase()) + "</span>";

function renderUsers() {
  const u = state.user;
  $("me").innerHTML = u ? avatar(u) : "👤";
  $("me").onclick = () => show("cadastro");
  $("reg-card").hidden = !!u;
  $("profile-card").hidden = !u;
  if (u) {
    const extra = u.tipo === "aluno"
      ? "<li>Idade: " + esc(u.idade) + "</li><li>Objetivo: " + esc(u.objetivo) + "</li><li>Peso: " + esc(u.peso || "–") + " kg · Altura: " + esc(u.altura || "–") + " cm</li><li>Restrições: " + esc(u.restricoes || "nenhuma") + "</li>"
      : "<li>CREF: " + esc(u.cref || "não informado") + "</li><li>Especialidades: " + esc(u.esp || "–") + "</li><li>Cidade: " + esc(u.cidade) + " · R$ " + esc(u.valor || "0") + "/consulta</li><li>" + esc(u.bio) + "</li>";
    $("profile-card").innerHTML = '<div class="tcard">' + avatar(u, true) + "<div><h3>" + esc(u.nome) + '</h3><span class="badge">' + (u.tipo === "aluno" ? "Aluno" : "Personal") + '</span><p class="muted">' + esc(u.email) + "</p></div></div><ul>" + extra + '</ul><button id="btn-out" class="ghost">Excluir cadastro</button>';
    $("btn-out").onclick = () => {
      state.trainers = state.trainers.filter((t) => t.id !== u.id);
      if (state.chosen === u.id) state.chosen = null;
      state.user = null; save(); renderUsers(); toast("Cadastro excluído.");
    };
  }
  // Lista de personais
  $("trainers").innerHTML = state.trainers.map((t) =>
    '<article class="card tcard">' + avatar(t, true) + "<div><h3>" + esc(t.nome) + '</h3><span class="badge">' + esc(t.esp) +
    '</span><p class="muted">CREF ' + esc(t.cref || "não informado") + " · " + esc(t.cidade) + " · R$ " + esc(t.valor || 0) +
    "/consulta</p><p>" + esc(t.bio) + '</p><button class="primary" data-pick="' + t.id + '">' +
    (state.chosen === t.id ? "✔ Meu personal" : "Escolher este personal") + "</button></div></article>").join("");
  document.querySelectorAll("[data-pick]").forEach((b) => (b.onclick = () => {
    state.chosen = Number(b.dataset.pick); save(); renderUsers(); toast("Personal escolhido!");
  }));
  const t = state.trainers.find((x) => x.id === state.chosen);
  $("my-trainer").innerHTML = t
    ? '<div class="tcard">' + avatar(t) + "<div><strong>" + esc(t.nome) + '</strong><p class="muted">' + esc(t.esp) + "</p></div></div>"
    : '<p class="muted">Você ainda não escolheu um personal.</p><button class="ghost" data-go2="personais">Ver personais</button>';
  const go = document.querySelector("[data-go2]");
  if (go) go.onclick = () => show("personais");
}

document.querySelectorAll('input[name="tipo"]').forEach((r) => (r.onchange = () => {
  const p = document.querySelector('input[name="tipo"]:checked').value === "personal";
  $("f-aluno").hidden = p; $("f-aluno").disabled = p;
  $("f-personal").hidden = !p; $("f-personal").disabled = !p;
}));

let fotoData = "";
$("r-foto").onchange = (e) => {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const c = document.createElement("canvas"); c.width = c.height = 160;
    const m = Math.min(img.width, img.height);
    c.getContext("2d").drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, 160, 160);
    fotoData = c.toDataURL("image/jpeg", 0.7);
    $("photo-prev").innerHTML = '<img src="' + fotoData + '" alt="Prévia da foto">';
    URL.revokeObjectURL(url);
  };
  img.src = url;
};

$("reg-form").onsubmit = (e) => {
  e.preventDefault();
  const tipo = document.querySelector('input[name="tipo"]:checked').value;
  const u = { id: Date.now(), tipo, nome: $("r-nome").value.trim(), email: $("r-email").value.trim(), foto: fotoData };
  if (tipo === "aluno") {
    Object.assign(u, { idade: $("a-idade").value, objetivo: $("a-obj").value, peso: $("a-peso").value, altura: $("a-alt").value, restricoes: $("a-rest").value.trim() });
  } else {
    Object.assign(u, { cref: $("p-cref").value.trim(), esp: $("p-esp").value.trim(), cidade: $("p-cid").value.trim(), valor: $("p-val").value, bio: $("p-bio").value.trim() });
    state.trainers.push(u);
  }
  state.user = u; fotoData = "";
  e.target.reset(); $("photo-prev").textContent = "📷"; document.querySelector('input[name="tipo"]').onchange();
  save(); renderUsers(); toast("Cadastro criado!");
};

renderUsers();
