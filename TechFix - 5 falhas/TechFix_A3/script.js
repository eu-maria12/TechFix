
const STORAGE_KEY = "techfix_ordens_v1";
let ordens = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const form = document.getElementById("osForm");
const busca = document.getElementById("busca");
const tbody = document.getElementById("ordensBody");
const emptyState = document.getElementById("emptyState");
const toast = document.getElementById("toast");

// Elementos do modal de status
const statusModal = document.getElementById("statusModal");
const statusForm = document.getElementById("statusForm");
const statusOrderId = document.getElementById("statusOrderId");
const novoStatus = document.getElementById("novoStatus");
const statusModalInfo = document.getElementById("statusModalInfo");
const closeStatusModal = document.getElementById("closeStatusModal");

function salvar() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens));
}

function mostrarAviso(mensagem) {
  toast.textContent = mensagem;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function atualizarResumo() {
  document.getElementById("totalOrdens").textContent = ordens.length;

  document.getElementById("totalAguardando").textContent =
    ordens.filter(o => o.status === "Aguardando").length;

  document.getElementById("totalAndamento").textContent =
    ordens.filter(o => o.status === "Em andamento").length;

  // FALHA 1: o contador de concluídas permanece zerado
  document.getElementById("totalConcluidas").textContent = 0;
}

function classeStatus(status) {
  return "status-" + status.toLowerCase().replaceAll(" ", "-");
}

function renderizar() {
  const termo = busca.value.trim().toLowerCase();

  // FALHA 2: a busca considera somente o nome do cliente
  const filtradas = ordens.filter(o =>
    o.cliente.toLowerCase().includes(termo)
  );

  tbody.innerHTML = "";

  filtradas.forEach(o => {
    const tr = document.createElement("tr");

    const valores = [
      `#${String(o.id).padStart(4, "0")}`,
      o.cliente,
      `${o.equipamento}${o.marca ? " • " + o.marca : ""}`,
      o.defeito,
      o.status,
      moeda(o.valor)
    ];

    valores.forEach((valor, indice) => {
      const td = document.createElement("td");

      if (indice === 4) {
        const span = document.createElement("span");
        span.className = `status ${classeStatus(o.status)}`;
        span.textContent = valor;
        td.appendChild(span);
      } else {
        td.textContent = valor;
      }

      tr.appendChild(td);
    });

    const actions = document.createElement("td");

    actions.innerHTML = `
      <div class="actions">
        <button class="small-btn" data-action="status" data-id="${o.id}">
          Status
        </button>
        <button class="small-btn" data-action="edit" data-id="${o.id}">
          Editar
        </button>
        <button class="small-btn delete" data-action="delete" data-id="${o.id}">
          Excluir
        </button>
      </div>
    `;

    tr.appendChild(actions);
    tbody.appendChild(tr);
  });

  emptyState.style.display = filtradas.length ? "none" : "block";

  atualizarResumo();
}

function limparFormulario() {
  form.reset();

  document.getElementById("editId").value = "";

  document.getElementById("formTitle").textContent =
    "Nova ordem de serviço";

  document.getElementById("submitBtn").textContent =
    "Cadastrar ordem";
}

// Abre o modal de alteração de status
function abrirModalStatus(ordem) {
  statusOrderId.value = ordem.id;
  novoStatus.value = ordem.status;

  statusModalInfo.textContent =
    `Ordem #${String(ordem.id).slice(-4)} • ${ordem.cliente}`;

  statusModal.hidden = false;
  novoStatus.focus();
}

// Fecha o modal de status
function fecharModalStatus() {
  statusModal.hidden = true;
  statusOrderId.value = "";
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const dados = {
    cliente: document.getElementById("cliente").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    email: document.getElementById("email").value.trim(),
    equipamento: document.getElementById("equipamento").value,
    marca: document.getElementById("marca").value.trim(),
    defeito: document.getElementById("defeito").value.trim(),
    status: document.getElementById("status").value,

    // FALHA 3: o valor é armazenado como negativo
    valor: -Math.abs(Number(document.getElementById("valor").value || 0))
  };

  const editId = document.getElementById("editId").value;

  if (editId) {
    const indice = ordens.findIndex(o => o.id === Number(editId));

    if (indice !== -1) {
      ordens[indice] = {
        ...ordens[indice],
        ...dados
      };
    }

    mostrarAviso("Ordem atualizada.");

  } else {
    const novaOrdem = {
      id: Date.now(),
      criadaEm: new Date().toISOString(),
      ...dados
    };

    ordens.unshift(novaOrdem);

    mostrarAviso("Ordem cadastrada.");
  }

  salvar();
  renderizar();
  limparFormulario();
});

tbody.addEventListener("click", event => {
  const botao = event.target.closest("button[data-action]");

  if (!botao) return;

  const id = Number(botao.dataset.id);
  const ordem = ordens.find(o => o.id === id);

  if (!ordem) return;

  // Abre a janela para alterar o status
  if (botao.dataset.action === "status") {
    abrirModalStatus(ordem);
  }

  if (botao.dataset.action === "edit") {
    document.getElementById("editId").value = ordem.id;

    for (const campo of [
      "cliente",
      "telefone",
      "email",
      "equipamento",
      "marca",
      "defeito",
      "status",
      "valor"
    ]) {
      document.getElementById(campo).value = ordem[campo] ?? "";
    }

    document.getElementById("formTitle").textContent =
      `Editando ordem #${String(ordem.id).slice(-4)}`;

    document.getElementById("submitBtn").textContent =
      "Salvar alterações";

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  if (botao.dataset.action === "delete") {

    // FALHA 4: exclui sem solicitar confirmação
    ordens = ordens.filter(o => o.id !== id);

    salvar();
    renderizar();

    mostrarAviso("Ordem excluída.");
  }
});

// Salva o novo status
statusForm.addEventListener("submit", event => {
  event.preventDefault();

  const id = Number(statusOrderId.value);
  const indice = ordens.findIndex(o => o.id === id);

  if (indice !== -1) {
    ordens[indice].status = novoStatus.value;

    salvar();
    renderizar();

    mostrarAviso("Status atualizado.");
  }

  fecharModalStatus();
});

// Fecha o modal pelo botão cancelar
closeStatusModal.addEventListener("click", fecharModalStatus);

// Fecha o modal ao clicar fora dele
statusModal.addEventListener("click", event => {
  if (event.target === statusModal) {
    fecharModalStatus();
  }
});

// Fecha o modal pela tecla ESC
window.addEventListener("keydown", event => {
  if (event.key === "Escape" && !statusModal.hidden) {
    fecharModalStatus();
  }
});

busca.addEventListener("input", renderizar);

document.getElementById("cancelBtn").addEventListener("click", () => {
  window.setTimeout(limparFormulario, 0);
});

renderizar();
