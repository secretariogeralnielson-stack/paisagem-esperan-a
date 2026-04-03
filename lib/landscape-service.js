"use strict";

const fs = require("node:fs");
const fsp = fs.promises;
const os = require("node:os");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const LOCAL_CACHE_DIR = path.join(ROOT_DIR, "cache");
const TEMP_CACHE_DIR = path.join(os.tmpdir(), "horizonte-da-esperanca-cache");
const PIXABAY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PIXABAY_TERMS = [
  "mountain sunrise landscape",
  "forest river landscape",
  "golden valley nature",
  "calm lake mountains",
  "sunset hills landscape",
  "waterfall forest landscape",
  "green meadow sunrise",
  "peaceful ocean cliffs"
];
const FALLBACK_VARIANTS = [
  { id: "amanhecer-serrano", title: "Amanhecer Serrano" },
  { id: "vale-da-graca", title: "Vale da Graca" },
  { id: "oceano-de-luz", title: "Oceano de Luz" },
  { id: "campo-sereno", title: "Campo Sereno" },
  { id: "rio-da-esperanca", title: "Rio da Esperanca" },
  { id: "horizonte-vitorioso", title: "Horizonte Vitorioso" }
];

let resolvedCacheDir = null;

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureCacheDir() {
  if (resolvedCacheDir) {
    return resolvedCacheDir;
  }

  for (const candidate of [LOCAL_CACHE_DIR, TEMP_CACHE_DIR]) {
    try {
      await fsp.mkdir(candidate, { recursive: true });
      resolvedCacheDir = candidate;
      return candidate;
    } catch (error) {
      continue;
    }
  }

  resolvedCacheDir = TEMP_CACHE_DIR;
  return resolvedCacheDir;
}

async function loadEnvFile() {
  const envPath = path.join(ROOT_DIR, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = await fsp.readFile(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function readPixabayCache(cacheKey) {
  const cacheDir = await ensureCacheDir();
  const cachePath = path.join(cacheDir, `pixabay-${cacheKey}.json`);
  if (!fs.existsSync(cachePath)) {
    return null;
  }

  try {
    const raw = await fsp.readFile(cachePath, "utf8");
    const cached = JSON.parse(raw);
    if (Date.now() - cached.createdAt < PIXABAY_CACHE_TTL_MS && Array.isArray(cached.hits)) {
      return cached.hits;
    }
  } catch (error) {
    return null;
  }

  return null;
}

async function writePixabayCache(cacheKey, hits) {
  try {
    const cacheDir = await ensureCacheDir();
    const cachePath = path.join(cacheDir, `pixabay-${cacheKey}.json`);
    await fsp.writeFile(
      cachePath,
      JSON.stringify(
        {
          createdAt: Date.now(),
          hits
        },
        null,
        2
      ),
      "utf8"
    );
  } catch (error) {
    return;
  }
}

async function fetchPixabayHits(apiKey) {
  const term = pickRandom(PIXABAY_TERMS);
  const cacheKey = slugify(term);
  const cachedHits = await readPixabayCache(cacheKey);
  if (cachedHits && cachedHits.length) {
    return cachedHits;
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: term,
    category: "nature",
    image_type: "photo",
    orientation: "horizontal",
    per_page: "40",
    safesearch: "true",
    min_width: "1920"
  });

  const response = await fetch(`https://pixabay.com/api/?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Pixabay respondeu com status ${response.status}`);
  }

  const data = await response.json();
  const hits = Array.isArray(data.hits) ? data.hits.filter((hit) => hit.largeImageURL || hit.webformatURL) : [];
  if (!hits.length) {
    throw new Error("Nenhuma imagem encontrada no Pixabay.");
  }

  await writePixabayCache(cacheKey, hits);
  return hits;
}

function isAllowedRemoteImageUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:" && /(^|\.)pixabay\.com$/i.test(parsed.hostname);
  } catch (error) {
    return false;
  }
}

async function fetchProxiedImage(rawUrl) {
  if (!isAllowedRemoteImageUrl(rawUrl)) {
    throw new Error("URL de imagem nao permitida.");
  }

  const response = await fetch(rawUrl);
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem remota (${response.status}).`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "image/jpeg"
  };
}

function buildProxyUrl(basePath, rawUrl) {
  return `${basePath}?src=${encodeURIComponent(rawUrl)}`;
}

function fallbackLandscapePayload(variant) {
  return {
    url: `/generated/landscape/${variant.id}.svg`,
    provider: "Gerador local",
    photographer: "Arte automatica do projeto",
    pageUrl: null,
    label: `Paisagem gerada automaticamente: ${variant.title}`,
    width: 1600,
    height: 900
  };
}

async function getLandscapePayload(options = {}) {
  const apiKey = process.env.PIXABAY_API_KEY;
  const imageProxyBasePath = options.imageProxyBasePath || "/api/image";

  if (apiKey) {
    try {
      const hits = await fetchPixabayHits(apiKey);
      const hit = pickRandom(hits);
      const remoteUrl = hit.largeImageURL || hit.webformatURL;

      return {
        image: {
          url: buildProxyUrl(imageProxyBasePath, remoteUrl),
          provider: "Pixabay",
          photographer: hit.user || "Pixabay",
          pageUrl: hit.pageURL || "https://pixabay.com/",
          label: `Foto de ${hit.user || "autor desconhecido"} via Pixabay`,
          width: hit.imageWidth || 1920,
          height: hit.imageHeight || 1080
        },
        mode: "pixabay"
      };
    } catch (error) {
      console.warn("Usando fallback local de imagens:", error.message);
    }
  }

  const variant = pickRandom(FALLBACK_VARIANTS);
  return {
    image: fallbackLandscapePayload(variant),
    mode: "fallback"
  };
}

module.exports = {
  FALLBACK_VARIANTS,
  fetchProxiedImage,
  getLandscapePayload,
  loadEnvFile
};
