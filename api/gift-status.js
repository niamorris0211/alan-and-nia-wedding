function sendJson(response, statusCode, body, extraHeaders = {}) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  Object.entries(extraHeaders).forEach(([key, value]) => {
    response.setHeader(key, value);
  });

  response.end(JSON.stringify(body));
}

function normaliseGiftId(giftId) {
  return String(giftId || "")
    .split(/\r?\n/)[0]
    .trim();
}

const GIFT_TARGET_AMOUNTS_PENCE = {
  "test-biscuit": 1,
  "whisky-research": 4400,
  "staffa-adventure": 9000,
  "loch-lomond-boat-trip": 4000,
  "wildlife-sea-safari": 22200,
};

function getNormalisedGiftAction(payment) {
  const targetAmountPence = GIFT_TARGET_AMOUNTS_PENCE[payment.gift_id];
  const amountTotal = Number(payment.amount_total) || 0;

  if (
    payment.gift_action === "full" &&
    targetAmountPence &&
    amountTotal < targetAmountPence
  ) {
    return "contribution";
  }

  return payment.gift_action;
}

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    return response.end();
  }

  if (request.method !== "GET") {
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return sendJson(response, 500, { error: "Missing Supabase configuration" });
  }

  try {
    const supabaseResponse = await fetch(
      `${supabaseUrl}/rest/v1/gift_payments?select=gift_id,gift_action,amount_total,currency`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const data = await supabaseResponse.json();

    if (!supabaseResponse.ok) {
      return sendJson(response, supabaseResponse.status, { error: data });
    }

    if (!Array.isArray(data)) {
      return sendJson(response, 500, {
        error: "Supabase returned an unexpected gift status response",
        detail: data,
      });
    }

    const gifts = data.reduce((summary, payment) => {
      const giftId = normaliseGiftId(payment.gift_id);

      if (!giftId) {
        return summary;
      }

      if (!summary[giftId]) {
        summary[giftId] = {
          totalPaidPence: 0,
          paymentCount: 0,
          currency: payment.currency || "gbp",
          fullGiftCount: 0,
          contributionCount: 0,
        };
      }

      summary[giftId].totalPaidPence += Number(payment.amount_total) || 0;
      summary[giftId].paymentCount += 1;

      if (getNormalisedGiftAction(payment) === "full") {
        summary[giftId].fullGiftCount += 1;
      } else {
        summary[giftId].contributionCount += 1;
      }

      return summary;
    }, {});

    return sendJson(response, 200, { gifts }, {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    });
  } catch (error) {
    return sendJson(response, 500, {
      error: "Failed to load gift statuses",
      detail: error.message,
    });
  }
};
