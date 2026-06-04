const crypto = require("crypto");

const GIFT_TARGET_AMOUNTS_PENCE = {
  "test-biscuit": 1,
  "whisky-research": 4400,
  "staffa-adventure": 9000,
  "loch-lomond-boat-trip": 4000,
  "wildlife-sea-safari": 22200,
};
const GIFT_TITLES = {
  "test-biscuit": "Emergency Biscuit Fund",
  "whisky-research": "Alan's Very Serious Whisky Research",
  "staffa-adventure": "Staffa Adventure",
  "loch-lomond-boat-trip": "Loch Lomond Boat Trip",
  "wildlife-sea-safari": "Wildlife Sea Safari",
  "honeymoon-pot": "Honeymoon Pot",
};
const DEFAULT_GIFT_NOTIFICATION_ENDPOINT = "https://formspree.io/f/xwvydezz";

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

function getNormalisedGiftAction({ giftId, giftAction, amountTotal }) {
  const targetAmountPence = GIFT_TARGET_AMOUNTS_PENCE[giftId];

  if (
    giftAction === "full" &&
    targetAmountPence &&
    amountTotal < targetAmountPence
  ) {
    return "contribution";
  }

  return giftAction;
}

function formatPaymentAmount(amountPence, currency) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: (currency || "gbp").toUpperCase(),
  }).format((Number(amountPence) || 0) / 100);
}

async function saveGiftPayment({ supabaseUrl, serviceRoleKey, stripeEvent }) {
  const session = stripeEvent.data.object;
  const metadata = getSessionMetadata(session);
  const urlGiftDetails = getGiftDetailsFromSuccessUrl(session);
  const giftId = metadata.gift_id || metadata.giftId || urlGiftDetails.giftId;
  const rawGiftAction =
    metadata.gift_action ||
    metadata.giftAction ||
    urlGiftDetails.giftAction ||
    (giftId === "honeymoon-pot" ? "contribution" : "full");
  const amountTotal = session.amount_total || 0;
  const giftAction = getNormalisedGiftAction({
    giftId,
    giftAction: rawGiftAction,
    amountTotal,
  });

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
    amount_total: amountTotal,
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

  const wasInserted = Array.isArray(data) ? data.length > 0 : true;

  return {
    response: jsonResponse(200, { success: true, data }),
    record,
    wasInserted,
  };
}

function buildGiftPaymentNotification(record) {
  const giftTitle = GIFT_TITLES[record.gift_id] || record.gift_id;
  const amount = formatPaymentAmount(record.amount_total, record.currency);
  const action =
    record.gift_action === "full" ? "Full gift" : "Contribution";

  return [
    "Nia & Alan Honeymoon Gift Payment",
    "",
    `Gift: ${giftTitle}`,
    `Type: ${action}`,
    `Amount paid: ${amount}`,
    "",
    `Guest name: ${record.customer_name || "Not provided"}`,
    `Email address: ${record.customer_email || "Not provided"}`,
    "",
    `Stripe checkout session: ${record.checkout_session_id}`,
    `Stripe payment intent: ${record.payment_intent_id || "Not provided"}`,
    `Paid at: ${record.paid_at}`,
  ].join("\n");
}

async function sendGiftPaymentNotification(record) {
  const endpoint =
    process.env.GIFT_NOTIFICATION_ENDPOINT || DEFAULT_GIFT_NOTIFICATION_ENDPOINT;

  if (!endpoint) {
    return;
  }

  const giftTitle = GIFT_TITLES[record.gift_id] || record.gift_id;
  const amount = formatPaymentAmount(record.amount_total, record.currency);
  const formData = new FormData();

  formData.append(
    "subject",
    `Honeymoon gift payment - ${giftTitle} - ${amount}`
  );
  formData.append("Gift Payment", buildGiftPaymentNotification(record));
  formData.append("gift_id", record.gift_id);
  formData.append("gift_title", giftTitle);
  formData.append("gift_action", record.gift_action);
  formData.append("amount_paid", amount);
  formData.append("customer_name", record.customer_name || "");
  formData.append("customer_email", record.customer_email || "");
  formData.append("checkout_session_id", record.checkout_session_id);

  const notificationResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  if (!notificationResponse.ok) {
    throw new Error("Gift payment notification was not accepted.");
  }
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
    const result = await saveGiftPayment({
      supabaseUrl,
      serviceRoleKey,
      stripeEvent,
    });

    if (result.wasInserted && result.record) {
      try {
        await sendGiftPaymentNotification(result.record);
      } catch (error) {
        console.warn("Gift payment notification could not be sent.", error);
      }
    }

    return result.response || result;
  } catch (error) {
    return jsonResponse(500, { error: "Failed to save gift payment" });
  }
};
