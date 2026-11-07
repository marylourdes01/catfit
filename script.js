const DAYS = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const KEY = "fitconnect-v1";

const initial = {
  role: "aluno",
  plan: {
    Segunda: [{ id: 1, nome: "Agachamento", series: "3x12", done: false },
              { id: 2, nome: "Flexão de braço", series: "3x10", done: false }],
    Quarta:  [{ id: 3, nome: "Remada curvada", series: "3x12", done: false }],
    Sexta:   [{ id: 4, nome: "Prancha", series: "3x30s", done: false }]
  },
  logs: [],
  feedback: ""
};

let state;
try { state = JSON.parse(localStorage.getItem(KEY)) || initial; }
catch (e) { state = initial; }

const $ = (id) => document.getElementById(id);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

function setRole(role) {
  state.role = role; save(); render();
}

function toggle(day, id) {
  const ex = state.plan[day].find((e) => e.id === id);
  ex.done = !ex.done; save(); render();
}

function remove(day, id) {
  state.plan[day] = state.plan[day].filter((e) => e.id !== id);
  save(); render();
}

function render() {
  const isPersonal = state.role === "personal";
  $("btn-aluno").classList.toggle("on", !isPersonal);
  $("btn-personal").classList.toggle("on", isPersonal);
  $("personal-box").hidden = !isPersonal;
  $("fb-form").hidden = !isPersonal;
  $("aluno-box").hidden = isPersonal;

  // Treinos da semana
  const week = $("week");
  week.innerHTML = "";
  let total = 0, done = 0;
  DAYS.forEach((day) => {
    const list = state.plan[day] || [];
    if (!list.length) return;
    const box = document.createElement("div");
    box.className = "day";
    box.innerHTML = `<h3>${day}</h3>`;
    list.forEach((ex) => {
      total++; if (ex.done) done++;
      const row = document.createElement("div");
      row.className = "ex" + (ex.done ? " done" : "");
      const cb = document.createElement("input");
      cb.type = "checkbox"; cb.checked = ex.done; cb.disabled = isPersonal;
      cb.setAttribute("aria-label", "Concluir " + ex.nome);
      cb.onchange = () => toggle(day, ex.id);
      const txt = document.createElement("span");
      txt.textContent = `${ex.nome} – ${ex.series}`;
      row.append(cb, txt);
      if (isPersonal) {
        const del = document.createElement("button");
        del.className = "del"; del.textContent = "Remover";
        del.onclick = () => remove(day, ex.id);
        row.append(del);
      }
      box.append(row);
    });
    week.append(box);
  });
  if (!total) week.innerHTML = '<p class="empty">Nenhum treino ainda. O personal pode adicionar exercícios.</p>';

  // Progresso
  const pct = total ? Math.round((done / total) * 100) : 0;
  $("fill").style.width = pct + "%";
  $("progress-text").textContent = `${done} de ${total} exercícios concluídos (${pct}%)`;

  // Histórico
  const h = $("history");
  h.innerHTML = "";
  if (!state.logs.length) h.innerHTML = '<li class="empty">Nenhum registro ainda.</li>';
  state.logs.slice().reverse().forEach((l) => {
    const li = document.createElement("li");
    li.textContent = `${l.data} · ${l.peso} kg · esforço ${l.esforco}/5` + (l.nota ? ` · ${l.nota}` : "");
    h.append(li);
  });

  // Recado
  $("feedback-view").textContent = state.feedback || "Nenhum recado por enquanto.";
}

// Eventos dos formulários
$("add-form").onsubmit = (e) => {
  e.preventDefault();
  const day = $("f-day").value;
  (state.plan[day] = state.plan[day] || []).push({
    id: Date.now(), nome: $("f-name").value.trim(), series: $("f-sets").value.trim(), done: false
  });
  e.target.reset(); save(); render();
};

$("log-form").onsubmit = (e) => {
  e.preventDefault();
  state.logs.push({
    data: new Date().toLocaleDateString("pt-BR"),
    peso: $("l-peso").value, esforco: $("l-esforco").value, nota: $("l-nota").value.trim()
  });
  e.target.reset(); save(); render();
};

$("fb-form").onsubmit = (e) => {
  e.preventDefault();
  state.feedback = $("fb-text").value.trim();
  e.target.reset(); save(); render();
};

$("f-day").innerHTML = DAYS.map((d) => `<option>${d}</option>`).join("");
render();
