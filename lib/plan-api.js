"use strict";

const { PlanError, createCheckoutSession, getPublicPlanStatus, verifyCheckoutPayment } = require("./plan-service");

function normalizeBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {};
  }

  return body;
}

function handleKnownError(error) {
  if (error instanceof PlanError) {
    return {
      statusCode: error.statusCode,
      payload: {
        error: error.message,
        code: error.code
      }
    };
  }

  console.error(error);
  return {
    statusCode: 500,
    payload: {
      error: "Erro interno ao processar o plano.",
      code: "internal_error"
    }
  };
}

async function handlePlanCreateSession(options = {}) {
  try {
    const result = await createCheckoutSession({
      origin: options.origin,
      body: normalizeBody(options.body)
    });

    return {
      statusCode: 200,
      payload: result
    };
  } catch (error) {
    return handleKnownError(error);
  }
}

async function handlePlanVerify(options = {}) {
  const body = normalizeBody(options.body);

  try {
    const result = await verifyCheckoutPayment({
      paymentId: body.paymentId,
      externalReference: body.externalReference
    });

    return {
      statusCode: 200,
      payload: result
    };
  } catch (error) {
    return handleKnownError(error);
  }
}

async function handlePlanStatus(options = {}) {
  const body = normalizeBody(options.body);

  try {
    return {
      statusCode: 200,
      payload: getPublicPlanStatus({
        origin: options.origin,
        token: body.token
      })
    };
  } catch (error) {
    return handleKnownError(error);
  }
}

module.exports = {
  handlePlanCreateSession,
  handlePlanStatus,
  handlePlanVerify
};
