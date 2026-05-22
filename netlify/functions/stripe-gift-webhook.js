const crypto = require("crypto");

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

function getRawBody(event) {
  if (event.isBase64Encoded) {
    return Buffer.from(event.body || "", "base64").toString("utf8");
  }

  return event.body || "";
}

function parseStripeSignature(signatureHeader) {
  return signatureHeader.split(",").reduce(
    (parts, item) => {
      const [key, value] = item.split("=");

      if (key === "t") {
        parts.timestamp = value;
      }

      if (key === "v1") {
        parts.signatures.push(value);
      }

      return parts;
    },
    { timestamp: "", signatures: [] }
  );
}

function timingSafeEqualString(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function verifyStripeSignature(rawBody, signatureHeader, webhookSecret) {
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);

  if (!timestamp || !signatures.length) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return signatures.some((signature) =>
    timingSafeEqualString(signature, expectedSignature)
  );
}

function getSessionMetadata(session) {
  return session.metadata && typeof session.metadata === "object"
    ? session.metadata
    : {};
}

function getGiftDetailsFromSuccessUrl(session) {
  if (!session.success_url) {
    return { giftId: "", giftAction: "" };
  }

  try {
    const successUrl = new URL(session.success_url);

    return {
      giftId: successUrl.searchParams.get("gift") || "",
      giftAction: successUrl.searchParams.get("gift_action") || "",
    };
  } catch (error) {
    return { giftId: "", giftAction: "" };
  }
}

async function saveGiftPayment({ supabaseUrl, serviceRoleKey, stripeEvent }) {
  const session = stripeEvent.data.object;
  const metadata = getSessionMetadata(session);
  const urlGiftDetails = getGiftDetailsFromSuccessUrl(session);
  const giftId = metadata.gift_id || metadata.giftId || urlGiftDetails.giftId;
  const giftAction =
    metadata.gift_action ||
    metadata.giftAction ||
    urlGiftDetails.giftAction ||
    (giftId === "honeymoon-pot" ? "contribution" : "full");

  if (!giftId) {
    return jsonResponse(400, {
      error:
        "Missing gift_id metadata. Add gift_id and gift_action to the Stripe Payment Link.",
    });
  }

  const record = {
    stripe_event_id: stripeEvent.id,
    checkout_session_id: session.id,
    payment_intent_id: session.payment_intent || null,
    payment_link_id: session.payment_link || null,
    gift_id: giftId,
    gift_action: giftAction,
    amount_total: session.amount_total || 0,
    currency: session.currency || "gbp",
    customer_email:
      session.customer_details?.email || session.customer_email || null,
    customer_name: session.customer_details?.name || null,
    metadata,
    paid_at: new Date((stripeEvent.created || Date.now() / 1000) * 1000).toISOString(),
  };

  const response = await fetch(
    `${supabaseUrl}/rest/v1/gift_payments?on_conflict=checkout_session_id`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: JSON.stringify(record),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    return jsonResponse(response.status, { error: data });
  }

  return jsonResponse(200, { success: true, data });
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
    return jsonResponse(500, {
      error: "Missing Supabase or Stripe webhook configuration",
    });
  }

  const rawBody = getRawBody(event);
  const signatureHeader =
    event.headers["stripe-signature"] || event.headers["Stripe-Signature"];

  if (
    !signatureHeader ||
    !verifyStripeSignature(rawBody, signatureHeader, webhookSecret)
  ) {
    return jsonResponse(400, { error: "Invalid Stripe signature" });
  }

  let stripeEvent;

  try {
    stripeEvent = JSON.parse(rawBody);
  } catch (error) {
    return jsonResponse(400, { error: "Invalid Stripe webhook payload" });
  }

  if (stripeEvent.type !== "checkout.session.completed") {
    return jsonResponse(200, { received: true, ignored: true });
  }

  const session = stripeEvent.data.object;

  if (session.payment_status && session.payment_status !== "paid") {
    return jsonResponse(200, { received: true, ignored: true });
  }

  try {
    return await saveGiftPayment({
      supabaseUrl,
      serviceRoleKey,
      stripeEvent,
    });
  } catch (error) {
    return jsonResponse(500, { error: "Failed to save gift payment" });
  }
};
