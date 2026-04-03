const PLAN_ACCESS_KEY = "horizonte-plan-access";
const PLAN_PENDING_REFERENCE_KEY = "horizonte-plan-pending-reference";
const IS_FILE_PROTOCOL = window.location.protocol === "file:";

const toast = document.getElementById("toast");
const introText = document.getElementById("planIntroText");
const startCheckoutButton = document.getElementById("startCheckoutButton");
const planStateBadge = document.getElementById("planStateBadge");
const planStateTitle = document.getElementById("planStateTitle");
const planStateText = document.getElementById("planStateText");
const planMeta = document.getElementById("planMeta");
const checkoutConfigNotice = document.getElementById("checkoutConfigNotice");

const state = {
  busy: false,
  toastTimer: null
};

function resolveAppUrl(path) {
  return new URL(path, window.location.href).href;
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  state.toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

function readStorageJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveStorageJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    return;
  }
}

function removeStorageItem(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    return;
  }
}

function loadPlanAccess() {
  const stored = readStorageJson(PLAN_ACCESS_KEY, null);
  if (!stored || typeof stored !== "object") {
    return null;
  }

  if (!stored.token || !stored.plan || typeof stored.plan !== "object") {
    return null;
  }

  return stored;
}

function savePlanAccess(token, plan) {
  saveStorageJson(PLAN_ACCESS_KEY, {
    token,
    plan,
    checkedAt: new Date().toISOString()
  });
}

function clearPlanAccess() {
  removeStorageItem(PLAN_ACCESS_KEY);
}

function setPendingReference(reference) {
  saveStorageJson(PLAN_PENDING_REFERENCE_KEY, {
    reference,
    createdAt: Date.now()
  });
}

function getPendingReference() {
  const stored = readStorageJson(PLAN_PENDING_REFERENCE_KEY, null);
  return stored?.reference || null;
}

function clearPendingReference() {
  removeStorageItem(PLAN_PENDING_REFERENCE_KEY);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "data indisponivel";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short"
  }).format(date);
}

function isStoredPlanStillActive(plan) {
  if (!plan?.expiresAt) {
    return false;
  }

  const expiresAt = Date.parse(plan.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

function updateCheckoutButton(options = {}) {
  startCheckoutButton.disabled = Boolean(options.disabled);
  startCheckoutButton.textContent = options.label || "Pagar com Mercado Pago";
}

function renderPlanMeta(items) {
  planMeta.innerHTML = "";

  for (const text of items) {
    const item = document.createElement("span");
    item.textContent = text;
    planMeta.append(item);
  }
}

function buildConfigNotice(statusPayload) {
  if (statusPayload.checkoutReady) {
    return "O pagamento abre em ambiente seguro do Mercado Pago e retorna para esta pagina para concluir a ativacao.";
  }

  const issue = Array.isArray(statusPayload.configIssues) && statusPayload.configIssues.length
    ? statusPayload.configIssues[0]
    : "A integracao de pagamento ainda precisa ser configurada.";
  return `${issue} Enquanto isso, o botao fica desabilitado para evitar um checkout incompleto.`;
}

function renderPlanState(statusPayload) {
  const active = Boolean(statusPayload?.active);
  const plan = statusPayload?.plan || null;
  const checkoutReady = Boolean(statusPayload?.checkoutReady);
  const message =
    statusPayload?.message ||
    (active
      ? "Pagamento confirmado. O compartilhamento segue liberado neste dispositivo."
      : "Use o pagamento seguro para ativar o plano mensal.");

  if (active && plan) {
    planStateBadge.textContent = "Plano ativo";
    planStateTitle.textContent = `Liberado ate ${formatDateTime(plan.expiresAt)}`;
    planStateText.textContent = `${message} A renovacao e manual e pode ser feita com um novo pagamento quando quiser.`;
    renderPlanMeta([
      plan.amount ? `Pagamento ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: plan.currency || "BRL" }).format(plan.amount)}` : "Pagamento confirmado",
      `Aprovado em ${formatDateTime(plan.approvedAt)}`,
      `Valido ate ${formatDateTime(plan.expiresAt)}`
    ]);
    updateCheckoutButton({
      disabled: !checkoutReady || state.busy,
      label: state.busy ? "Preparando pagamento..." : "Renovar com novo pagamento"
    });
  } else {
    const expired = statusPayload?.reason === "expired";
    planStateBadge.textContent = expired ? "Plano expirado" : "Aguardando pagamento";
    planStateTitle.textContent = expired ? "Renove o acesso mensal" : "Ativacao do plano";
    planStateText.textContent = message;
    renderPlanMeta([
      "31 dias por pagamento",
      "Ativacao automatica",
      "Mercado Pago"
    ]);
    updateCheckoutButton({
      disabled: !checkoutReady || state.busy,
      label: state.busy ? "Preparando pagamento..." : "Pagar com Mercado Pago"
    });
  }

  checkoutConfigNotice.textContent = buildConfigNotice(statusPayload || {});
}

async function postJson(url, payload) {
  const response = await fetch(resolveAppUrl(url), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload || {})
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Nao foi possivel concluir esta etapa.");
    error.payload = data;
    throw error;
  }

  return data;
}

function renderLocalModeState() {
  const stored = loadPlanAccess();
  const activePlan = isStoredPlanStillActive(stored?.plan) ? stored.plan : null;

  renderPlanState(
    activePlan
      ? {
          active: true,
          plan: activePlan,
          message: "Este navegador ainda possui um plano salvo localmente. Para validar novos pagamentos, abra o projeto pelo servidor.",
          checkoutReady: false,
          configIssues: ["O checkout precisa da API ativa. Abra o projeto com `npm start` para concluir pagamentos."]
        }
      : {
          active: false,
          reason: "local",
          message: "O checkout não funciona quando `plano.html` é aberto direto da pasta. Abra o projeto pelo servidor para ativar pagamentos.",
          checkoutReady: false,
          configIssues: ["Ao usar `file:///`, a API de pagamento não fica disponível para esta página."]
        }
  );
}

function readPlanContext() {
  const params = new URLSearchParams(window.location.search);
  const shares = params.get("shares");
  const limit = params.get("limit") || "30";

  if (shares) {
    introText.textContent = `Voce atingiu ${shares} compartilhamentos do limite gratuito de ${limit}. Para continuar usando os compartilhamentos, o plano mensal custa R$ 12,90 e libera mais 31 dias de uso apos a aprovacao.`;
  }
}

function sanitizeReturnParams() {
  const url = new URL(window.location.href);
  const removable = [
    "checkout",
    "payment_id",
    "status",
    "external_reference",
    "merchant_order_id",
    "collection_id",
    "collection_status"
  ];

  let changed = false;
  for (const key of removable) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  const search = url.searchParams.toString();
  const nextUrl = `${url.pathname}${search ? `?${search}` : ""}`;
  window.history.replaceState({}, "", nextUrl);
}

function getStoredStatusPayload() {
  const stored = loadPlanAccess();
  if (!stored || !isStoredPlanStillActive(stored.plan)) {
    return null;
  }

  return {
    active: true,
    plan: stored.plan,
    message: "Plano salvo neste navegador e aguardando confirmacao final do servidor.",
    checkoutReady: true,
    configIssues: []
  };
}

async function refreshPlanStatus() {
  const stored = loadPlanAccess();
  const fallbackStatus = getStoredStatusPayload();
  if (fallbackStatus) {
    renderPlanState(fallbackStatus);
  }

  const result = await postJson("./api/plan/status", {
    token: stored?.token || null
  });

  if (result.active && result.plan && stored?.token) {
    savePlanAccess(stored.token, result.plan);
  } else if (!result.active && stored?.token) {
    clearPlanAccess();
  }

  renderPlanState(result);
  return result;
}

function getReturnStatusParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    checkout: params.get("checkout"),
    paymentId: params.get("payment_id") || params.get("collection_id"),
    status: params.get("status") || params.get("collection_status"),
    externalReference: params.get("external_reference")
  };
}

async function processPaymentReturn() {
  const paymentReturn = getReturnStatusParams();
  if (!paymentReturn.paymentId && !paymentReturn.status && !paymentReturn.checkout) {
    return false;
  }

  const normalizedStatus = String(paymentReturn.status || paymentReturn.checkout || "").toLowerCase();
  if (normalizedStatus && normalizedStatus !== "approved") {
    clearPendingReference();
    renderPlanState({
      active: false,
      reason: normalizedStatus === "pending" ? "pending" : "failure",
      message:
        normalizedStatus === "pending"
          ? "O pagamento voltou como pendente. Assim que o Mercado Pago aprovar, voce pode retornar a esta pagina para concluir a ativacao."
          : "O pagamento nao voltou como aprovado. Voce pode tentar novamente quando quiser.",
      checkoutReady: true,
      configIssues: []
    });
    sanitizeReturnParams();
    return true;
  }

  if (!paymentReturn.paymentId) {
    sanitizeReturnParams();
    return false;
  }

  const pendingReference = getPendingReference();
  if (pendingReference && paymentReturn.externalReference && pendingReference !== paymentReturn.externalReference) {
    clearPendingReference();
    sanitizeReturnParams();
    renderPlanState({
      active: false,
      reason: "invalid",
      message: "O retorno recebido nao corresponde ao pagamento iniciado neste navegador. Gere um novo pagamento para continuar.",
      checkoutReady: true,
      configIssues: []
    });
    return true;
  }

  state.busy = true;
  renderPlanState({
    active: false,
    message: "Validando a aprovacao do pagamento com o Mercado Pago...",
    checkoutReady: true,
    configIssues: []
  });

  try {
    const result = await postJson("./api/plan/verify", {
      paymentId: paymentReturn.paymentId,
      externalReference: paymentReturn.externalReference || pendingReference || null
    });

    clearPendingReference();

    if (result.active && result.token && result.plan) {
      savePlanAccess(result.token, result.plan);
      showToast("Plano ativado com sucesso neste dispositivo.");
    } else {
      clearPlanAccess();
      showToast(result.message || "O pagamento ainda nao liberou o plano.");
    }

    renderPlanState({
      ...result,
      checkoutReady: true,
      configIssues: []
    });
    sanitizeReturnParams();
    return true;
  } catch (error) {
    console.error(error);
    renderPlanState({
      active: false,
      reason: "invalid",
      message: error.message || "Nao foi possivel validar este pagamento agora.",
      checkoutReady: true,
      configIssues: []
    });
    sanitizeReturnParams();
    return true;
  } finally {
    state.busy = false;
  }
}

async function startCheckout() {
  if (IS_FILE_PROTOCOL) {
    renderLocalModeState();
    showToast("Abra o projeto com `npm start` para usar o checkout.");
    return;
  }

  if (state.busy) {
    return;
  }

  state.busy = true;
  updateCheckoutButton({
    disabled: true,
    label: "Preparando pagamento..."
  });

  try {
    const result = await postJson("./api/plan/create-session", {});
    if (!result.checkoutUrl || !result.reference) {
      throw new Error("O checkout nao foi criado corretamente.");
    }

    setPendingReference(result.reference);
    showToast("Abrindo o pagamento seguro no Mercado Pago...");
    window.location.href = result.checkoutUrl;
  } catch (error) {
    console.error(error);
    renderPlanState({
      active: false,
      reason: "error",
      message: error.message || "Nao foi possivel iniciar o pagamento agora.",
      checkoutReady: false,
      configIssues: []
    });
    showToast(error.message || "Nao foi possivel iniciar o pagamento.");
    state.busy = false;
    await refreshPlanStatus().catch(() => {
      updateCheckoutButton({
        disabled: false,
        label: "Pagar com Mercado Pago"
      });
    });
  }
}

window.addEventListener("error", () => {
  showToast("Se o checkout nao abrir, recarregue a pagina.");
});

startCheckoutButton.addEventListener("click", () => {
  startCheckout();
});

async function init() {
  readPlanContext();
  if (IS_FILE_PROTOCOL) {
    renderLocalModeState();
    return;
  }

  await processPaymentReturn();
  await refreshPlanStatus().catch((error) => {
    console.error(error);
    const fallback = getStoredStatusPayload();
    renderPlanState(
      fallback || {
        active: false,
        reason: "error",
        message: "Nao foi possivel atualizar o status do plano agora. Se voce ja pagou, recarregue a pagina em instantes.",
        checkoutReady: false,
        configIssues: ["Nao foi possivel consultar o servidor neste momento."]
      }
    );
  });
}

init();
