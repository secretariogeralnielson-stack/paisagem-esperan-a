"use strict";

const { fetchProxiedImage, loadEnvFile } = require("../../lib/landscape-service");

let envReady;

async function ensureEnv() {
  if (!envReady) {
    envReady = loadEnvFile();
  }

  await envReady;
}

exports.handler = async function handler(event) {
  await ensureEnv();

  try {
    const sourceUrl = event.queryStringParameters?.src;
    if (!sourceUrl) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({ error: "Informe a URL da imagem." })
      };
    }

    const image = await fetchProxiedImage(sourceUrl);
    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Cache-Control": "public, max-age=86400",
        "Content-Type": image.contentType
      },
      body: image.buffer.toString("base64")
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ error: "Nao foi possivel carregar a imagem remota." })
    };
  }
};
