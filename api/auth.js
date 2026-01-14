import crypto from "node:crypto";

const toBase64Url = (value) => Buffer.from(value).toString("base64url");
const sign = (value, secret) =>
  crypto.createHmac("sha256", secret).update(value).digest("base64url");
const getAllowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const pickOrigin = (allowedOrigins, requestedOrigin) => {
  if (requestedOrigin && allowedOrigins.includes(requestedOrigin)) {
    return requestedOrigin;
  }
  return allowedOrigins[0];
};

export default function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const siteUrl = process.env.SITE_URL;
  const stateSecret = process.env.OAUTH_STATE_SECRET;
  const allowedOrigins = getAllowedOrigins();
  const requestedOrigin =
    typeof req.headers.origin === "string" ? req.headers.origin : undefined;

  if (!clientId || !siteUrl || !stateSecret || allowedOrigins.length === 0) {
    res.status(500).send("Missing OAuth environment variables.");
    return;
  }

  const origin = pickOrigin(allowedOrigins, requestedOrigin);
  if (!origin) {
    res.status(500).send("Missing allowed origin.");
    return;
  }

  const scope = process.env.OAUTH_SCOPE || "public_repo";
  const payload = {
    nonce: crypto.randomUUID(),
    ts: Date.now(),
    origin,
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(encoded, stateSecret);
  const state = `${encoded}.${signature}`;
  const redirectUri = `${siteUrl}/api/callback`;

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);

  res.setHeader("Cache-Control", "no-store");
  res.redirect(302, authUrl.toString());
}
