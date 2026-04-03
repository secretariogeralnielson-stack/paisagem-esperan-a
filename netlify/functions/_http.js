"use strict";

function getHeaderValue(headers, name) {
  if (!headers || typeof headers !== "object") {
    return undefined;
  }

  const expected = String(name || "").toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (String(key).toLowerCase() === expected) {
      return Array.isArray(value) ? value[0] : value;
    }
  }

  return undefined;
}

function getOrigin(event) {
  const protocol = getHeaderValue(event.headers, "x-forwarded-proto") || "https";
  const host = getHeaderValue(event.headers, "x-forwarded-host") || getHeaderValue(event.headers, "host") || "localhost";
  return `${protocol}://${host}`;
}

function readJsonBody(event) {
  if (!event.body) {
    return {};
  }

  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function jsonResponse(statusCode, payload, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    },
    body: JSON.stringify(payload)
  };
}

module.exports = {
  getOrigin,
  jsonResponse,
  readJsonBody
};
