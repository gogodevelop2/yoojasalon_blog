import crypto from "node:crypto";

const verify = (value, secret, signature) => {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64url");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};
const getAllowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const getFirstQueryValue = (value) => {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
};

export default async function handler(req, res) {
  const code = getFirstQueryValue(req.query?.code);
  const state = getFirstQueryValue(req.query?.state);
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const stateSecret = process.env.OAUTH_STATE_SECRET;
  const allowedOrigins = getAllowedOrigins();

  if (
    !code ||
    !state ||
    !clientId ||
    !clientSecret ||
    !stateSecret ||
    allowedOrigins.length === 0
  ) {
    res.status(400).send("Missing OAuth parameters.");
    return;
  }

  try {
    const [encoded, signature] = String(state).split(".");
    if (!encoded || !signature || !verify(encoded, stateSecret, signature)) {
      res.status(400).send("Invalid state.");
      return;
    }

    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    );
    const isExpired = Date.now() - payload.ts > 10 * 60 * 1000;
    if (isExpired) {
      res.status(400).send("Expired state.");
      return;
    }

    if (!allowedOrigins.includes(payload.origin)) {
      res.status(400).send("Invalid origin.");
      return;
    }

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    );

    const data = await tokenResponse.json();

    if (data.error || !data.access_token) {
      res.status(400).send(`Error: ${data.error_description || "OAuth failed"}`);
      return;
    }

    const origin = payload.origin;
    const message = { token: data.access_token, provider: "github" };
    const script = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>OAuth Complete</title>
  </head>
  <body>
    <script>
      (function() {
        const origin = ${JSON.stringify(origin)};
        const message = ${JSON.stringify(message)};
        function receiveMessage(event) {
          if (event.origin !== origin) return;
          window.opener.postMessage(
            'authorization:github:success:' + JSON.stringify(message),
            origin
          );
          window.removeEventListener('message', receiveMessage, false);
        }
        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:github', origin);
      })();
    </script>
  </body>
</html>`;

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(script);
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).send("OAuth failed.");
  }
}
