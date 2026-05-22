function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30",
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: "Missing Supabase configuration" });
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/gift_payments?select=gift_id,gift_action,amount_total,currency`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return jsonResponse(response.status, { error: data });
    }

    const gifts = data.reduce((summary, payment) => {
      const giftId = payment.gift_id;

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

      if (payment.gift_action === "full") {
        summary[giftId].fullGiftCount += 1;
      } else {
        summary[giftId].contributionCount += 1;
      }

      return summary;
    }, {});

    return jsonResponse(200, { gifts });
  } catch (error) {
    return jsonResponse(500, { error: "Failed to load gift statuses" });
  }
};
