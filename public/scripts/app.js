const STORAGE_KEYS = {
  permission: "horizonte-download-permission",
  customMessages: "horizonte-custom-messages",
  shareUsage: "horizonte-share-usage",
  planAccess: "horizonte-plan-access"
};

const IS_FILE_PROTOCOL = window.location.protocol === "file:";
const FREE_SHARE_LIMIT = 30;
const ROTATION_SECONDS = 60;

const FORMAT_OPTIONS = [
  {
    id: "instagram-feed",
    name: "Instagram Feed",
    badge: "4:5",
    width: 1080,
    height: 1350,
    use: "Feed e posts verticais"
  },
  {
    id: "instagram-story",
    name: "Instagram Story",
    badge: "9:16",
    width: 1080,
    height: 1920,
    use: "Stories e telas verticais"
  },
  {
    id: "tiktok",
    name: "TikTok",
    badge: "9:16",
    width: 1080,
    height: 1920,
    use: "Videos curtos e capas verticais"
  },
  {
    id: "whatsapp-status",
    name: "WhatsApp Status",
    badge: "9:16",
    width: 1080,
    height: 1920,
    use: "Status e compartilhamentos rapidos"
  },
  {
    id: "square",
    name: "Quadrado",
    badge: "1:1",
    width: 1080,
    height: 1080,
    use: "Posts quadrados e carrosseis"
  },
  {
    id: "widescreen",
    name: "Widescreen",
    badge: "16:9",
    width: 1920,
    height: 1080,
    use: "Capas, videos e exibicao horizontal"
  }
];

const THEMES = [
  {
    id: "esperanca",
    label: "Esperanca",
    accent: "#efc27d",
    accentSoft: "#ffe7be"
  },
  {
    id: "fe",
    label: "Fe",
    accent: "#9fd4ff",
    accentSoft: "#daf0ff"
  },
  {
    id: "amor",
    label: "Amor",
    accent: "#ffb4b4",
    accentSoft: "#ffdede"
  },
  {
    id: "motivacao",
    label: "Motivacao",
    accent: "#bee7d2",
    accentSoft: "#e0fff0"
  },
  {
    id: "sabedoria",
    label: "Sabedoria",
    accent: "#f8d6a0",
    accentSoft: "#fff0d4"
  }
];

const DEFAULT_MESSAGES = [
  {
    theme: "esperanca",
    text: "Deus prepara novos horizontes mesmo quando nossos olhos ainda veem neblina.",
    reference: "Inspirado em Jeremias 29:11"
  },
  {
    theme: "esperanca",
    text: "A noite pode ser longa, mas a misericordia do Senhor renova a manha.",
    reference: "Inspirado em Lamentacoes 3:22-23"
  },
  {
    theme: "esperanca",
    text: "Quem espera em Deus encontra forcas para continuar e paz para recomecar.",
    reference: "Inspirado em Isaias 40:31"
  },
  {
    theme: "fe",
    text: "A fe nao ignora a luta; ela lembra que Deus continua presente em cada passo.",
    reference: "Inspirado em Hebreus 11:1"
  },
  {
    theme: "fe",
    text: "Mesmo sem entender tudo, voce pode confiar naquele que guia o caminho.",
    reference: "Inspirado em Proverbios 3:5-6"
  },
  {
    theme: "fe",
    text: "Quando a fe assume a frente, o medo perde espaco para a coragem.",
    reference: "Inspirado em Salmos 56:3"
  },
  {
    theme: "amor",
    text: "O amor de Deus acolhe, restaura e ensina a repartir bondade com o proximo.",
    reference: "Inspirado em 1 Joao 4:19"
  },
  {
    theme: "amor",
    text: "Onde o amor floresce com verdade, a vida ganha calor e direcao.",
    reference: "Inspirado em 1 Corintios 13:4-7"
  },
  {
    theme: "amor",
    text: "O coracao que aprende com Cristo encontra forca para amar com paciencia.",
    reference: "Inspirado em Colossenses 3:14"
  },
  {
    theme: "motivacao",
    text: "Continue. O Deus que colocou o sonho em voce tambem sustenta o processo.",
    reference: "Inspirado em Filipenses 1:6"
  },
  {
    theme: "motivacao",
    text: "Passos pequenos com constancia podem abrir portas que a pressa nunca abriu.",
    reference: "Inspirado em Eclesiastes 9:10"
  },
  {
    theme: "motivacao",
    text: "Levante mais uma vez. Sua historia ainda nao terminou.",
    reference: "Inspirado em Miqueias 7:8"
  },
  {
    theme: "sabedoria",
    text: "A sabedoria de Deus acalma a mente e orienta decisoes com firmeza.",
    reference: "Inspirado em Tiago 1:5"
  },
  {
    theme: "sabedoria",
    text: "Ouvir antes de agir e uma forma madura de proteger caminhos importantes.",
    reference: "Inspirado em Proverbios 19:20"
  },
  {
    theme: "sabedoria",
    text: "Quem busca conselho com humildade encontra clareza para seguir melhor.",
    reference: "Inspirado em Proverbios 11:14"
  }
];

const LOCAL_LANDSCAPES = [
  { id: "amanhecer-serrano", title: "Amanhecer Serrano" },
  { id: "campo-sereno", title: "Campo Sereno" },
  { id: "horizonte-vitorioso", title: "Horizonte Vitorioso" },
  { id: "oceano-de-luz", title: "Oceano de Luz" },
  { id: "rio-da-esperanca", title: "Rio da Esperanca" },
  { id: "vale-da-graca", title: "Vale da Graca" }
];

const elements = {
  formatPills: document.getElementById("formatPills"),
  themePills: document.getElementById("themePills"),
  shareCanvas: document.getElementById("shareCanvas"),
  canvasFrame: document.getElementById("canvasFrame"),
  canvasLoading: document.getElementById("canvasLoading"),
  selectedFormatName: document.getElementById("selectedFormatName"),
  currentFormatBadge: document.getElementById("currentFormatBadge"),
  currentResolutionLabel: document.getElementById("currentResolutionLabel"),
  currentFormatUse: document.getElementById("currentFormatUse"),
  messageTheme: document.getElementById("messageTheme"),
  messagePlatform: document.getElementById("messagePlatform"),
  messageText: document.getElementById("messageText"),
  messageReference: document.getElementById("messageReference"),
  imageSource: document.getElementById("imageSource"),
  shareUsageCount: document.getElementById("shareUsageCount"),
  shareUsageNote: document.getElementById("shareUsageNote"),
  countdownValue: document.getElementById("countdownValue"),
  rotationLabel: document.getElementById("rotationLabel"),
  refreshButton: document.getElementById("refreshButton"),
  toggleRotationButton: document.getElementById("toggleRotationButton"),
  downloadButton: document.getElementById("downloadButton"),
  downloadBackgroundButton: document.getElementById("downloadBackgroundButton"),
  copyCaptionButton: document.getElementById("copyCaptionButton"),
  shareButton: document.getElementById("shareButton"),
  instagramButton: document.getElementById("instagramButton"),
  facebookButton: document.getElementById("facebookButton"),
  whatsappButton: document.getElementById("whatsappButton"),
  toast: document.getElementById("toast"),
  viewPlanButton: document.getElementById("viewPlanButton"),
  permissionModal: document.getElementById("permissionModal"),
  grantPermissionButton: document.getElementById("grantPermissionButton"),
  cancelPermissionButton: document.getElementById("cancelPermissionButton"),
  messageThemeSelect: document.getElementById("messageThemeSelect"),
  customMessageText: document.getElementById("customMessageText"),
  customMessageReference: document.getElementById("customMessageReference"),
  saveMessageButton: document.getElementById("saveMessageButton"),
  exportMessagesButton: document.getElementById("exportMessagesButton"),
  importMessagesButton: document.getElementById("importMessagesButton"),
  resetMessagesButton: document.getElementById("resetMessagesButton"),
  messagesFileInput: document.getElementById("messagesFileInput"),
  defaultMessageCount: document.getElementById("defaultMessageCount"),
  customMessageCount: document.getElementById("customMessageCount"),
  totalMessageCount: document.getElementById("totalMessageCount"),
  customMessagesList: document.getElementById("customMessagesList")
};

const state = {
  selectedFormatId: FORMAT_OPTIONS[0].id,
  selectedThemeId: THEMES[0].id,
  rotationEnabled: true,
  countdown: ROTATION_SECONDS,
  countdownTimer: null,
  toastTimer: null,
  busy: false,
  currentMessage: null,
  currentLandscape: null,
  lastLandscapeId: null
};

const ctx = elements.shareCanvas.getContext("2d");

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
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

function getSelectedFormat() {
  return FORMAT_OPTIONS.find((item) => item.id === state.selectedFormatId) || FORMAT_OPTIONS[0];
}

function getSelectedTheme() {
  return THEMES.find((item) => item.id === state.selectedThemeId) || THEMES[0];
}

function randomItem(items, excludeId) {
  const filtered = excludeId ? items.filter((item) => item.id !== excludeId && item.slug !== excludeId) : items;
  const source = filtered.length ? filtered : items;
  return source[Math.floor(Math.random() * source.length)];
}

function resolveAppUrl(path) {
  return new URL(path, window.location.href).href;
}

function normalizeAssetPath(path) {
  if (!path) {
    return path;
  }

  if (/^https?:/i.test(path) || /^data:/i.test(path) || /^blob:/i.test(path) || /^file:/i.test(path)) {
    return path;
  }

  if (IS_FILE_PROTOCOL && path.startsWith("/")) {
    return `.${path}`;
  }

  return path;
}

function formatCountdown(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getCustomMessages() {
  const items = readStorageJson(STORAGE_KEYS.customMessages, []);
  return Array.isArray(items) ? items.filter((item) => item && item.text && item.theme) : [];
}

function saveCustomMessages(items) {
  saveStorageJson(STORAGE_KEYS.customMessages, items);
}

function getAllMessages() {
  return [...DEFAULT_MESSAGES, ...getCustomMessages()];
}

function getMessagesByTheme(themeId) {
  const items = getAllMessages().filter((item) => item.theme === themeId);
  return items.length ? items : DEFAULT_MESSAGES.filter((item) => item.theme === THEMES[0].id);
}

function getShareUsage() {
  const usage = readStorageJson(STORAGE_KEYS.shareUsage, { count: 0 });
  return {
    count: Number.isFinite(Number(usage?.count)) ? Number(usage.count) : 0
  };
}

function setShareUsageCount(count) {
  saveStorageJson(STORAGE_KEYS.shareUsage, { count: Math.max(0, count) });
}

function getPlanAccess() {
  const stored = readStorageJson(STORAGE_KEYS.planAccess, null);
  if (!stored || !stored.plan || !stored.token) {
    return null;
  }

  const expiresAt = Date.parse(stored.plan.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    removeStorageItem(STORAGE_KEYS.planAccess);
    return null;
  }

  return stored;
}

function hasActivePlan() {
  return Boolean(getPlanAccess());
}

function getCaptionText() {
  if (!state.currentMessage) {
    return "Horizonte da Esperanca";
  }

  return [
    state.currentMessage.text,
    state.currentMessage.reference,
    "",
    "Gerado em Horizonte da Esperanca"
  ].join("\n");
}

function updateUsageUi() {
  const usage = getShareUsage();
  const activePlan = hasActivePlan();

  if (activePlan) {
    const plan = getPlanAccess().plan;
    const expiresText = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(new Date(plan.expiresAt));
    elements.shareUsageCount.textContent = "Plano ativo neste dispositivo";
    elements.shareUsageNote.textContent = `Os compartilhamentos estao liberados ate ${expiresText}.`;
    return;
  }

  elements.shareUsageCount.textContent = `${usage.count} de ${FREE_SHARE_LIMIT} usados`;
  if (usage.count >= FREE_SHARE_LIMIT) {
    elements.shareUsageNote.textContent = "O limite gratuito foi atingido. Abra o plano mensal para continuar compartilhando.";
  } else {
    const remaining = FREE_SHARE_LIMIT - usage.count;
    elements.shareUsageNote.textContent = `Voce ainda pode compartilhar gratuitamente ${remaining} vez${remaining === 1 ? "" : "es"} neste navegador.`;
  }
}

function redirectToPlan() {
  const usage = getShareUsage();
  const planUrl = resolveAppUrl(`./plano.html?shares=${usage.count}&limit=${FREE_SHARE_LIMIT}`);
  window.location.href = planUrl;
}

function ensureShareAllowed() {
  if (hasActivePlan()) {
    return true;
  }

  const usage = getShareUsage();
  if (usage.count >= FREE_SHARE_LIMIT) {
    showToast("Seu limite gratuito terminou. Abrindo o plano mensal.");
    window.setTimeout(() => {
      redirectToPlan();
    }, 450);
    return false;
  }

  return true;
}

function incrementShareUsage() {
  if (hasActivePlan()) {
    updateUsageUi();
    return;
  }

  const usage = getShareUsage();
  const nextCount = usage.count + 1;
  setShareUsageCount(nextCount);
  updateUsageUi();

  if (nextCount >= FREE_SHARE_LIMIT) {
    showToast("Voce chegou ao limite gratuito de compartilhamentos.");
  }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function openLink(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nao foi possivel carregar a imagem."));
    image.src = resolveAppUrl(normalizeAssetPath(url));
  });
}

function fitImageCover(image, width, height) {
  const imageRatio = image.width / image.height;
  const frameRatio = width / height;

  if (imageRatio > frameRatio) {
    const drawHeight = height;
    const drawWidth = height * imageRatio;
    return {
      width: drawWidth,
      height: drawHeight,
      x: (width - drawWidth) / 2,
      y: 0
    };
  }

  const drawWidth = width;
  const drawHeight = width / imageRatio;
  return {
    width: drawWidth,
    height: drawHeight,
    x: 0,
    y: (height - drawHeight) / 2
  };
}

function wrapLines(context, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (context.measureText(next).width <= maxWidth || !current) {
      current = next;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawTextBlock(format, theme, message) {
  const paddingX = format.width * 0.09;
  const cardWidth = format.width - paddingX * 2;
  const cardHeight = format.height * 0.38;
  const cardX = paddingX;
  const cardY = format.height * 0.47;

  ctx.save();
  ctx.fillStyle = "rgba(8, 11, 19, 0.54)";
  roundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 34);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const titleY = cardY + 54;
  ctx.fillStyle = theme.accentSoft;
  ctx.font = `700 ${Math.round(format.width * 0.028)}px Aptos, Segoe UI, sans-serif`;
  ctx.fillText(theme.label.toUpperCase(), cardX + 42, titleY);

  const maxTextWidth = cardWidth - 84;
  ctx.fillStyle = "#f6f4ef";
  ctx.font = `700 ${Math.round(format.width * 0.045)}px Constantia, Palatino Linotype, serif`;
  const lines = wrapLines(ctx, message.text, maxTextWidth);
  const lineHeight = Math.round(format.width * 0.058);
  let lineY = titleY + 60;

  for (const line of lines.slice(0, 5)) {
    ctx.fillText(line, cardX + 42, lineY);
    lineY += lineHeight;
  }

  ctx.fillStyle = "rgba(246, 244, 239, 0.84)";
  ctx.font = `500 ${Math.round(format.width * 0.025)}px Aptos, Segoe UI, sans-serif`;
  const referenceLines = wrapLines(ctx, message.reference, maxTextWidth);
  let referenceY = Math.max(cardY + cardHeight - 54, lineY + 16);
  for (const line of referenceLines.slice(0, 2)) {
    ctx.fillText(line, cardX + 42, referenceY);
    referenceY += Math.round(format.width * 0.032);
  }

  ctx.restore();
}

function drawArtwork(image) {
  const format = getSelectedFormat();
  const theme = getSelectedTheme();
  const message = state.currentMessage;

  elements.shareCanvas.width = format.width;
  elements.shareCanvas.height = format.height;
  elements.canvasFrame.style.setProperty("--preview-ratio", `${format.width} / ${format.height}`);

  ctx.clearRect(0, 0, format.width, format.height);

  const fitted = fitImageCover(image, format.width, format.height);
  ctx.drawImage(image, fitted.x, fitted.y, fitted.width, fitted.height);

  const heroGradient = ctx.createLinearGradient(0, 0, 0, format.height);
  heroGradient.addColorStop(0, "rgba(8, 11, 19, 0.18)");
  heroGradient.addColorStop(0.45, "rgba(8, 11, 19, 0.32)");
  heroGradient.addColorStop(1, "rgba(6, 8, 14, 0.78)");
  ctx.fillStyle = heroGradient;
  ctx.fillRect(0, 0, format.width, format.height);

  ctx.save();
  roundedRect(ctx, format.width * 0.07, format.height * 0.06, format.width * 0.26, format.height * 0.07, 22);
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fill();
  ctx.fillStyle = theme.accentSoft;
  ctx.font = `700 ${Math.round(format.width * 0.022)}px Aptos, Segoe UI, sans-serif`;
  ctx.fillText("HORIZONTE DA ESPERANCA", format.width * 0.092, format.height * 0.105);
  ctx.restore();

  drawTextBlock(format, theme, message);

  ctx.save();
  ctx.fillStyle = "rgba(246, 244, 239, 0.82)";
  ctx.font = `500 ${Math.round(format.width * 0.02)}px Aptos, Segoe UI, sans-serif`;
  ctx.fillText(format.name, format.width * 0.09, format.height * 0.93);
  ctx.textAlign = "right";
  ctx.fillText("he", format.width * 0.91, format.height * 0.93);
  ctx.restore();
}

function buildLocalLandscapePayload(item) {
  return {
    id: item.id,
    image: {
      url: `./generated/landscape/${item.id}.svg`,
      provider: "Gerador local",
      photographer: "Arte automatica do projeto",
      label: `Paisagem gerada automaticamente: ${item.title}`
    }
  };
}

async function requestLandscape() {
  if (IS_FILE_PROTOCOL) {
    const localItem = randomItem(LOCAL_LANDSCAPES, state.lastLandscapeId);
    return buildLocalLandscapePayload(localItem);
  }

  try {
    const response = await fetch(resolveAppUrl("./api/landscape"), {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Falha ao carregar paisagem.");
    }

    const payload = await response.json();
    const imageUrl = payload?.image?.url || "";
    return {
      id: payload?.image?.label || imageUrl || Date.now().toString(),
      image: {
        ...payload.image,
        url: normalizeAssetPath(imageUrl)
      }
    };
  } catch (error) {
    const localItem = randomItem(LOCAL_LANDSCAPES, state.lastLandscapeId);
    return buildLocalLandscapePayload(localItem);
  }
}

function pickMessage() {
  const pool = getMessagesByTheme(state.selectedThemeId);
  const next = pool[Math.floor(Math.random() * pool.length)];
  state.currentMessage = next;
  return next;
}

function renderCurrentMeta() {
  const format = getSelectedFormat();
  const theme = getSelectedTheme();

  elements.selectedFormatName.textContent = format.name;
  elements.currentFormatBadge.textContent = format.badge;
  elements.currentResolutionLabel.textContent = `${format.width} x ${format.height}`;
  elements.currentFormatUse.textContent = format.use;
  elements.messagePlatform.textContent = format.name;
  elements.messageTheme.textContent = theme.label;

  if (state.currentMessage) {
    elements.messageText.textContent = state.currentMessage.text;
    elements.messageReference.textContent = state.currentMessage.reference;
  }

  if (state.currentLandscape?.image) {
    const provider = state.currentLandscape.image.provider || "Paisagem";
    const author = state.currentLandscape.image.photographer || state.currentLandscape.image.label || "";
    elements.imageSource.textContent = author ? `${provider} - ${author}` : provider;
  }
}

function setLoading(visible, label) {
  elements.canvasLoading.textContent = label || "Montando uma nova arte...";
  elements.canvasLoading.classList.toggle("is-visible", visible);
}

async function renderArtwork() {
  if (state.busy) {
    return;
  }

  state.busy = true;
  setLoading(true, "Montando uma nova arte...");

  try {
    const landscape = await requestLandscape();
    state.currentLandscape = landscape;
    state.lastLandscapeId = landscape.id;
    pickMessage();
    renderCurrentMeta();

    const image = await loadImage(landscape.image.url);
    drawArtwork(image);
    showToast("Nova arte pronta para usar.");
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel montar a arte agora.");
  } finally {
    state.busy = false;
    setLoading(false);
    resetCountdown();
  }
}

function renderFormatPills() {
  elements.formatPills.innerHTML = "";
  for (const item of FORMAT_OPTIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `format-pill${item.id === state.selectedFormatId ? " is-active" : ""}`;
    button.innerHTML = `<strong>${item.name}</strong><span>${item.badge} - ${item.use}</span>`;
    button.addEventListener("click", () => {
      state.selectedFormatId = item.id;
      renderFormatPills();
      renderCurrentMeta();
      renderArtwork();
    });
    elements.formatPills.append(button);
  }
}

function renderThemePills() {
  elements.themePills.innerHTML = "";
  for (const item of THEMES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `theme-pill${item.id === state.selectedThemeId ? " is-active" : ""}`;
    button.innerHTML = `<strong>${item.label}</strong><span>Mensagens no tom de ${item.label.toLowerCase()}</span>`;
    button.addEventListener("click", () => {
      state.selectedThemeId = item.id;
      renderThemePills();
      renderCurrentMeta();
      renderArtwork();
    });
    elements.themePills.append(button);
  }
}

function renderMessageLibrary() {
  const customMessages = getCustomMessages();
  elements.defaultMessageCount.textContent = String(DEFAULT_MESSAGES.length);
  elements.customMessageCount.textContent = String(customMessages.length);
  elements.totalMessageCount.textContent = String(DEFAULT_MESSAGES.length + customMessages.length);
  elements.customMessagesList.innerHTML = "";

  if (!customMessages.length) {
    const empty = document.createElement("p");
    empty.className = "library-empty";
    empty.textContent = "Nenhuma mensagem personalizada foi salva neste navegador ainda.";
    elements.customMessagesList.append(empty);
    return;
  }

  customMessages.forEach((message, index) => {
    const item = document.createElement("article");
    item.className = "message-item";
    item.innerHTML = `
      <div class="message-item-top">
        <span class="message-item-theme">${message.theme}</span>
        <button class="inline-button" type="button">Remover</button>
      </div>
      <p class="message-item-text">${message.text}</p>
      <p class="message-item-reference">${message.reference || "Sem referencia"}</p>
    `;

    item.querySelector("button").addEventListener("click", () => {
      const nextMessages = getCustomMessages().filter((_, itemIndex) => itemIndex !== index);
      saveCustomMessages(nextMessages);
      renderMessageLibrary();
      showToast("Mensagem personalizada removida.");
    });

    elements.customMessagesList.append(item);
  });
}

function saveMessage() {
  const theme = elements.messageThemeSelect.value;
  const text = elements.customMessageText.value.trim();
  const reference = elements.customMessageReference.value.trim();

  if (!text) {
    showToast("Digite a mensagem antes de salvar.");
    elements.customMessageText.focus();
    return;
  }

  const current = getCustomMessages();
  current.unshift({
    theme,
    text,
    reference: reference || "Mensagem personalizada"
  });
  saveCustomMessages(current);
  elements.customMessageText.value = "";
  elements.customMessageReference.value = "";
  renderMessageLibrary();
  showToast("Mensagem salva neste navegador.");
}

function exportMessages() {
  const payload = {
    exportedAt: new Date().toISOString(),
    messages: getCustomMessages()
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "horizonte-mensagens.json";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast("Arquivo de mensagens exportado.");
}

async function importMessages(file) {
  if (!file) {
    return;
  }

  try {
    const raw = await file.text();
    const payload = JSON.parse(raw);
    const imported = Array.isArray(payload?.messages) ? payload.messages : Array.isArray(payload) ? payload : [];
    const normalized = imported
      .filter((item) => item && typeof item.text === "string" && typeof item.theme === "string")
      .map((item) => ({
        theme: item.theme,
        text: item.text.trim(),
        reference: String(item.reference || "Mensagem importada").trim()
      }))
      .filter((item) => item.text);

    saveCustomMessages(normalized);
    renderMessageLibrary();
    showToast("Mensagens importadas com sucesso.");
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel importar este arquivo.");
  } finally {
    elements.messagesFileInput.value = "";
  }
}

function resetCustomMessages() {
  saveCustomMessages([]);
  renderMessageLibrary();
  showToast("Mensagens personalizadas removidas.");
}

function updateRotationUi() {
  elements.countdownValue.textContent = formatCountdown(state.countdown);
  elements.rotationLabel.textContent = state.rotationEnabled
    ? "Atualizacao automatica ativa"
    : "Rotacao pausada manualmente";
  elements.toggleRotationButton.textContent = state.rotationEnabled ? "Pausar rotacao" : "Retomar rotacao";
}

function resetCountdown() {
  state.countdown = ROTATION_SECONDS;
  updateRotationUi();
}

function startRotationTimer() {
  if (state.countdownTimer) {
    window.clearInterval(state.countdownTimer);
  }

  state.countdownTimer = window.setInterval(() => {
    if (!state.rotationEnabled || state.busy) {
      return;
    }

    state.countdown -= 1;
    if (state.countdown <= 0) {
      state.countdown = ROTATION_SECONDS;
      renderArtwork();
      return;
    }

    updateRotationUi();
  }, 1000);
}

function openPermissionModal() {
  elements.permissionModal.hidden = false;
}

function closePermissionModal() {
  elements.permissionModal.hidden = true;
}

function hasDownloadPermission() {
  return readStorageJson(STORAGE_KEYS.permission, false) === true;
}

function waitForDownloadPermission() {
  if (hasDownloadPermission()) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const approve = () => {
      saveStorageJson(STORAGE_KEYS.permission, true);
      cleanup();
      closePermissionModal();
      resolve(true);
    };

    const cancel = () => {
      cleanup();
      closePermissionModal();
      resolve(false);
    };

    function cleanup() {
      elements.grantPermissionButton.removeEventListener("click", approve);
      elements.cancelPermissionButton.removeEventListener("click", cancel);
    }

    elements.grantPermissionButton.addEventListener("click", approve);
    elements.cancelPermissionButton.addEventListener("click", cancel);
    openPermissionModal();
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function downloadCanvas() {
  const granted = await waitForDownloadPermission();
  if (!granted) {
    showToast("Download cancelado.");
    return;
  }

  const blob = await new Promise((resolve) => {
    elements.shareCanvas.toBlob(resolve, "image/png", 0.96);
  });

  if (!blob) {
    showToast("Nao foi possivel preparar o download.");
    return;
  }

  downloadBlob(blob, `horizonte-${state.selectedFormatId}.png`);
  showToast("Arte baixada com sucesso.");
}

async function downloadBackground() {
  const granted = await waitForDownloadPermission();
  if (!granted) {
    showToast("Download cancelado.");
    return;
  }

  if (!state.currentLandscape?.image?.url) {
    showToast("A paisagem atual ainda nao esta pronta.");
    return;
  }

  try {
    const response = await fetch(resolveAppUrl(normalizeAssetPath(state.currentLandscape.image.url)));
    const blob = await response.blob();
    const extension = blob.type.includes("svg") ? "svg" : blob.type.includes("png") ? "png" : "jpg";
    downloadBlob(blob, `paisagem-${state.lastLandscapeId || "horizonte"}.${extension}`);
    showToast("Paisagem baixada com sucesso.");
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel baixar a paisagem agora.");
  }
}

async function copyCaption() {
  try {
    await copyText(getCaptionText());
    showToast("Legenda copiada.");
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel copiar agora.");
  }
}

async function genericShare() {
  if (!ensureShareAllowed()) {
    return;
  }

  const caption = getCaptionText();
  try {
    if (navigator.share) {
      await navigator.share({
        title: "Horizonte da Esperanca",
        text: caption,
        url: window.location.href
      });
      incrementShareUsage();
      showToast("Compartilhamento iniciado.");
      return;
    }

    await copyText(caption);
    incrementShareUsage();
    showToast("Legenda copiada para compartilhar.");
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }

    console.error(error);
    showToast("Nao foi possivel compartilhar agora.");
  }
}

async function shareToInstagram() {
  if (!ensureShareAllowed()) {
    return;
  }

  try {
    await copyText(getCaptionText());
    incrementShareUsage();
    showToast("Legenda copiada. Publique a imagem no Instagram.");
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel preparar o compartilhamento.");
  }
}

async function shareToFacebook() {
  if (!ensureShareAllowed()) {
    return;
  }

  try {
    await copyText(getCaptionText());
    openLink(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`);
    incrementShareUsage();
    showToast("Legenda copiada e Facebook aberto.");
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel abrir o Facebook agora.");
  }
}

async function shareToWhatsApp() {
  if (!ensureShareAllowed()) {
    return;
  }

  try {
    const text = `${getCaptionText()}\n${window.location.href}`;
    openLink(`https://wa.me/?text=${encodeURIComponent(text)}`);
    incrementShareUsage();
    showToast("WhatsApp aberto para compartilhar.");
  } catch (error) {
    console.error(error);
    showToast("Nao foi possivel abrir o WhatsApp agora.");
  }
}

function bindEvents() {
  elements.refreshButton.addEventListener("click", () => {
    renderArtwork();
  });

  elements.toggleRotationButton.addEventListener("click", () => {
    state.rotationEnabled = !state.rotationEnabled;
    updateRotationUi();
  });

  elements.downloadButton.addEventListener("click", () => {
    downloadCanvas();
  });

  elements.downloadBackgroundButton.addEventListener("click", () => {
    downloadBackground();
  });

  elements.copyCaptionButton.addEventListener("click", () => {
    copyCaption();
  });

  elements.shareButton.addEventListener("click", () => {
    genericShare();
  });

  elements.instagramButton.addEventListener("click", () => {
    shareToInstagram();
  });

  elements.facebookButton.addEventListener("click", () => {
    shareToFacebook();
  });

  elements.whatsappButton.addEventListener("click", () => {
    shareToWhatsApp();
  });

  elements.saveMessageButton.addEventListener("click", () => {
    saveMessage();
  });

  elements.exportMessagesButton.addEventListener("click", () => {
    exportMessages();
  });

  elements.importMessagesButton.addEventListener("click", () => {
    elements.messagesFileInput.click();
  });

  elements.messagesFileInput.addEventListener("change", (event) => {
    importMessages(event.target.files?.[0] || null);
  });

  elements.resetMessagesButton.addEventListener("click", () => {
    resetCustomMessages();
  });

  elements.viewPlanButton.addEventListener("click", () => {
    if (!hasActivePlan()) {
      return;
    }

    showToast("Seu plano ja esta ativo neste dispositivo.");
  });
}

function init() {
  renderFormatPills();
  renderThemePills();
  renderMessageLibrary();
  updateUsageUi();
  updateRotationUi();
  bindEvents();
  startRotationTimer();
  renderArtwork();
}

init();
