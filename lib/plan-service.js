"use strict";

const crypto = require("node:crypto");

const MERCADO_PAGO_API_BASE = "https://api.mercadopago.com";
const PLAN_CODE = "mensal-1290";
const PLAN_NAME = "Horizonte da Esperanca - Plano mensal";
const PLAN_DESCRIPTION = "Compartilhamentos liberados por 31 dias apos a aprovacao do pagamento.";
const PLAN_PRICE = 12.9;
const PLAN_CURRENCY = "BRL";
const PLAN_DURATION_DAYS = 31;
const PLAN_DURATION_MS = PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000;
const ACTIVE_STATUSES = new Set(["approved"]);
const PAYMENT_STATUS_MESSAGES = {
  approved: "Pagamento aprovado com sucesso. O plano ja pode ser utilizado.",
  pending: "O pagamento ainda esta pendente. Assim que o Mercado Pago aprovar, o plano sera liberado.",
  in_process: "O pagamento esta em analise. Aguarde a confirmacao do Mercado Pago.",
  authorized: "O pagamento foi autorizado, mas ainda aguarda confirmacao final.",
  rejected: "O pagamento nao foi aprovado. Voce pode tentar novamente.",
  cancelled: "O pagamento foi cancelado antes da aprovacao.",
  refunded: "Este pagamento foi devolvido e nao pode liberar o plano.",
  charged_back: "Este pagamento sofreu contestacao e nao pode liberar o plano."
};

class PlanError extends Error {
  constructor(message, statusCode = 500, code = "plan_error") {
    super(message);
    this.name = "PlanError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

class ValidationError extends PlanError {
  constructor(message) {
    super(message, 400, "validation_error");
    this.name = "ValidationError";
  }
}

class ConfigError extends PlanError {
  constructor(message) {
    super(message, 503, "config_error");
    this.name = "ConfigError";
  }
}

class IntegrationError extends PlanError {
  constructor(message, statusCode = 502) {
    super(message, statusCode, "integration_error");
    this.name = "IntegrationError";
  }
}

function normalizeBoolean(value) {
  return /^(1|true|yes|on)$/i.test(String(value || "").trim());
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/g, "");
}

function normalizeUrl(value) {
  if (!value) {
    return null;
  }

  try {
    return trimTrailingSlash(new URL(value).toString());
  } catch (error) {
    return null;
  }
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch (error) {
    return false;
  }
}

function buildAbsoluteUrl(siteUrl, pathname) {
  return new URL(pathname.replace(/^\//, ""), `${siteUrl}/`).toString();
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: PLAN_CURRENCY
  }).format(value);
}

function getPlanInfo() {
  return {
    code: PLAN_CODE,
    name: PLAN_NAME,
    description: PLAN_DESCRIPTION,
    price: PLAN_PRICE,
    priceLabel: formatMoney(PLAN_PRICE),
    currency: PLAN_CURRENCY,
    durationDays: PLAN_DURATION_DAYS,
    renewalMode: "manual"
  };
}

function getRuntimeConfig(origin) {
  const accessToken = String(process.env.MERCADO_PAGO_ACCESS_TOKEN || "").trim();
  const planSecret = String(process.env.PLAN_TOKEN_SECRET || "").trim();
  const siteUrl = normalizeUrl(String(process.env.SITE_URL || "").trim()) || normalizeUrl(origin);
  const useSandbox = normalizeBoolean(process.env.MERCADO_PAGO_USE_SANDBOX);
  const issues = [];

  if (!accessToken) {
    issues.push("Configure MERCADO_PAGO_ACCESS_TOKEN no arquivo .env.");
  }

  if (!planSecret) {
    issues.push("Configure PLAN_TOKEN_SECRET no arquivo .env.");
  }

  if (!siteUrl) {
    issues.push("Defina SITE_URL com o endereco HTTPS publicado do site.");
  } else if (!isHttpsUrl(siteUrl)) {
    issues.push("O Mercado Pago exige SITE_URL em HTTPS para o retorno do checkout.");
  }

  return {
    accessToken,
    planSecret,
    siteUrl,
    useSandbox,
    checkoutReady: issues.length === 0,
    issues
  };
}

function ensureCheckoutConfig(origin) {
  const config = getRuntimeConfig(origin);
  if (!config.checkoutReady) {
    throw new ConfigError(config.issues.join(" "));
  }

  return config;
}

function buildReference() {
  return `HE-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
}

function randomIdempotencyKey() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return crypto.randomBytes(16).toString("hex");
}

async function parseMercadoPagoResponse(response) {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return raw;
  }
}

function getMercadoPagoErrorMessage(responseData, fallbackStatusText) {
  if (!responseData) {
    return fallbackStatusText || "Falha ao comunicar com o Mercado Pago.";
  }

  if (typeof responseData === "string") {
    return responseData;
  }

  if (typeof responseData.message === "string" && responseData.message.trim()) {
    return responseData.message.trim();
  }

  if (typeof responseData.error === "string" && responseData.error.trim()) {
    return responseData.error.trim();
  }

  if (Array.isArray(responseData.cause) && responseData.cause.length) {
    const cause = responseData.cause.find((item) => typeof item?.description === "string");
    if (cause?.description) {
      return cause.description;
    }
  }

  return fallbackStatusText || "Falha ao comunicar com o Mercado Pago.";
}

async function mercadoPagoRequest(pathname, options = {}) {
  const accessToken = String(process.env.MERCADO_PAGO_ACCESS_TOKEN || "").trim();
  if (!accessToken) {
    throw new ConfigError("Configure MERCADO_PAGO_ACCESS_TOKEN no arquivo .env.");
  }

  const method = options.method || "GET";
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (method !== "GET") {
    headers["X-Idempotency-Key"] = randomIdempotencyKey();
  }

  const response = await fetch(`${MERCADO_PAGO_API_BASE}${pathname}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const responseData = await parseMercadoPagoResponse(response);
  if (!response.ok) {
    const message = getMercadoPagoErrorMessage(responseData, response.statusText);
    throw new IntegrationError(`Mercado Pago respondeu com erro: ${message}`, response.status);
  }

  return responseData;
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function getApprovedTimestamp(payment) {
  const source =
    payment.date_approved ||
    payment.date_last_updated ||
    payment.date_created ||
    new Date().toISOString();
  const parsed = Date.parse(source);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function buildPlanFromPayment(payment) {
  const approvedAtMs = getApprovedTimestamp(payment);
  const expiresAtMs = approvedAtMs + PLAN_DURATION_MS;
  const now = Date.now();
  const amount = roundCurrency(Number(payment.transaction_amount || 0));

  return {
    code: PLAN_CODE,
    name: PLAN_NAME,
    provider: "Mercado Pago",
    renewalMode: "manual",
    paymentId: String(payment.id || ""),
    externalReference: payment.external_reference ? String(payment.external_reference) : null,
    amount,
    currency: String(payment.currency_id || PLAN_CURRENCY).toUpperCase(),
    approvedAt: new Date(approvedAtMs).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
    status: expiresAtMs > now ? "active" : "expired"
  };
}

function encodeBase64Url(value) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(`${normalized}${"=".repeat(padding)}`, "base64").toString("utf8");
}

function createTokenSignature(encodedPayload, secret) {
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("hex");
}

function compareSignatures(expected, received) {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function signPlanToken(plan) {
  const secret = String(process.env.PLAN_TOKEN_SECRET || "").trim();
  if (!secret) {
    throw new ConfigError("Configure PLAN_TOKEN_SECRET no arquivo .env.");
  }

  const payload = {
    v: 1,
    code: plan.code,
    paymentId: plan.paymentId,
    externalReference: plan.externalReference,
    amount: plan.amount,
    currency: plan.currency,
    approvedAt: plan.approvedAt,
    expiresAt: plan.expiresAt,
    renewalMode: plan.renewalMode,
    provider: plan.provider
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = createTokenSignature(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

function getPlanStatusMessage(reason, status) {
  if (reason === "expired") {
    return "O periodo mensal deste pagamento ja terminou. E preciso gerar um novo pagamento para renovar o acesso.";
  }

  if (reason === "invalid") {
    return "Nao foi possivel validar o acesso salvo neste dispositivo.";
  }

  if (reason === "missing") {
    return "Nenhum plano ativo foi encontrado neste navegador.";
  }

  const normalizedStatus = String(status || "").toLowerCase();
  return PAYMENT_STATUS_MESSAGES[normalizedStatus] || "O pagamento ainda nao liberou o plano.";
}

function readPlanToken(token) {
  const secret = String(process.env.PLAN_TOKEN_SECRET || "").trim();
  if (!secret) {
    return {
      active: false,
      reason: "config_missing",
      message: "A validacao do plano ainda nao foi configurada no servidor.",
      plan: null
    };
  }

  if (!token || typeof token !== "string") {
    return {
      active: false,
      reason: "missing",
      message: getPlanStatusMessage("missing"),
      plan: null
    };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return {
      active: false,
      reason: "invalid",
      message: getPlanStatusMessage("invalid"),
      plan: null
    };
  }

  const [encodedPayload, receivedSignature] = parts;
  const expectedSignature = createTokenSignature(encodedPayload, secret);
  if (!compareSignatures(expectedSignature, receivedSignature)) {
    return {
      active: false,
      reason: "invalid",
      message: getPlanStatusMessage("invalid"),
      plan: null
    };
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload));
    if (payload.code !== PLAN_CODE) {
      return {
        active: false,
        reason: "invalid",
        message: getPlanStatusMessage("invalid"),
        plan: null
      };
    }

    const plan = {
      code: payload.code,
      name: PLAN_NAME,
      provider: payload.provider || "Mercado Pago",
      renewalMode: payload.renewalMode || "manual",
      paymentId: String(payload.paymentId || ""),
      externalReference: payload.externalReference || null,
      amount: roundCurrency(Number(payload.amount || 0)),
      currency: String(payload.currency || PLAN_CURRENCY).toUpperCase(),
      approvedAt: payload.approvedAt,
      expiresAt: payload.expiresAt,
      status: Date.parse(payload.expiresAt) > Date.now() ? "active" : "expired"
    };

    if (plan.status !== "active") {
      return {
        active: false,
        reason: "expired",
        message: getPlanStatusMessage("expired"),
        plan
      };
    }

    return {
      active: true,
      reason: "active",
      message: PAYMENT_STATUS_MESSAGES.approved,
      plan
    };
  } catch (error) {
    return {
      active: false,
      reason: "invalid",
      message: getPlanStatusMessage("invalid"),
      plan: null
    };
  }
}

async function createCheckoutSession(options = {}) {
  const config = ensureCheckoutConfig(options.origin);
  const reference = buildReference();
  const planInfo = getPlanInfo();
  const returnBase = buildAbsoluteUrl(config.siteUrl, "plano.html");

  const preference = await mercadoPagoRequest("/checkout/preferences", {
    method: "POST",
    body: {
      items: [
        {
          id: PLAN_CODE,
          title: PLAN_NAME,
          description: PLAN_DESCRIPTION,
          quantity: 1,
          currency_id: PLAN_CURRENCY,
          unit_price: PLAN_PRICE
        }
      ],
      metadata: {
        plan_code: PLAN_CODE,
        plan_duration_days: PLAN_DURATION_DAYS,
        product: "horizonte-da-esperanca"
      },
      external_reference: reference,
      back_urls: {
        success: `${returnBase}?checkout=success`,
        pending: `${returnBase}?checkout=pending`,
        failure: `${returnBase}?checkout=failure`
      },
      auto_return: "approved"
    }
  });

  const checkoutUrl = config.useSandbox
    ? preference.sandbox_init_point || preference.init_point
    : preference.init_point;

  if (!checkoutUrl) {
    throw new IntegrationError("O Mercado Pago nao retornou a URL de checkout.");
  }

  return {
    checkoutReady: true,
    reference,
    preferenceId: preference.id || null,
    checkoutUrl,
    planInfo
  };
}

function validatePaymentMatch(payment, expectedReference) {
  if (!expectedReference) {
    return;
  }

  const actual = payment.external_reference ? String(payment.external_reference) : "";
  if (actual !== String(expectedReference)) {
    throw new ValidationError("O retorno do pagamento nao corresponde a sessao iniciada neste navegador.");
  }
}

function validateApprovedPlanPayment(payment) {
  const amount = roundCurrency(Number(payment.transaction_amount || 0));
  const currency = String(payment.currency_id || "").toUpperCase();

  if (amount + 0.01 < PLAN_PRICE) {
    throw new ValidationError("O pagamento encontrado nao corresponde ao valor do plano mensal.");
  }

  if (currency && currency !== PLAN_CURRENCY) {
    throw new ValidationError("O pagamento encontrado nao corresponde a moeda do plano.");
  }
}

async function verifyCheckoutPayment(options = {}) {
  const paymentId = String(options.paymentId || "").trim();
  if (!paymentId) {
    throw new ValidationError("Informe o identificador do pagamento retornado pelo Mercado Pago.");
  }

  const payment = await mercadoPagoRequest(`/v1/payments/${encodeURIComponent(paymentId)}`);
  validatePaymentMatch(payment, options.externalReference);

  const paymentStatus = String(payment.status || "").toLowerCase();
  if (!ACTIVE_STATUSES.has(paymentStatus)) {
    return {
      active: false,
      paymentStatus,
      message: getPlanStatusMessage("payment", paymentStatus),
      plan: null,
      token: null,
      planInfo: getPlanInfo()
    };
  }

  validateApprovedPlanPayment(payment);

  const plan = buildPlanFromPayment(payment);
  if (plan.status !== "active") {
    return {
      active: false,
      paymentStatus: "approved",
      message: getPlanStatusMessage("expired"),
      plan,
      token: null,
      planInfo: getPlanInfo()
    };
  }

  return {
    active: true,
    paymentStatus: "approved",
    message: PAYMENT_STATUS_MESSAGES.approved,
    plan,
    token: signPlanToken(plan),
    planInfo: getPlanInfo()
  };
}

function getPublicPlanStatus(options = {}) {
  const config = getRuntimeConfig(options.origin);
  const tokenStatus = readPlanToken(options.token);

  return {
    checkoutReady: config.checkoutReady,
    configIssues: config.issues,
    active: tokenStatus.active,
    reason: tokenStatus.reason,
    message: tokenStatus.message,
    plan: tokenStatus.plan,
    planInfo: getPlanInfo()
  };
}

module.exports = {
  ConfigError,
  IntegrationError,
  PlanError,
  ValidationError,
  createCheckoutSession,
  getPlanInfo,
  getPublicPlanStatus,
  getRuntimeConfig,
  readPlanToken,
  verifyCheckoutPayment
};
