"use strict";

const { getOrigin, jsonResponse, readJsonBody } = require("./_http");
const { handlePlanVerify } = require("../../lib/plan-api");
const { loadEnvFile } = require("../../lib/landscape-service");

let envReady;

async function ensureEnv() {
  if (!envReady) {
    envReady = loadEnvFile();
  }

  await envReady;
}

exports.handler = async function handler(event) {
  await ensureEnv();

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Metodo nao suportado." });
  }

  const result = await handlePlanVerify({
    origin: getOrigin(event),
    body: readJsonBody(event)
  });

  return jsonResponse(result.statusCode, result.payload, {
    "Cache-Control": "no-store"
  });
};
