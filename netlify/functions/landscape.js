"use strict";

const { getLandscapePayload, loadEnvFile } = require("../../lib/landscape-service");

let envReady;

async function ensureEnv() {
  if (!envReady) {
    envReady = loadEnvFile();
  }

  await envReady;
}

exports.handler = async function handler() {
  await ensureEnv();

  try {
    const payload = await getLandscapePayload({ imageProxyBasePath: "/api/image" });
    return {
      statusCode: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify(payload)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ error: "Nao foi possivel gerar a paisagem agora." })
    };
  }
};
