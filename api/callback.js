/**
 * GitHub OAuth 콜백 처리
 * GitHub에서 code를 받아 access_token으로 교환 후 Decap CMS에 전달
 *
 * NOTE: 이 엔드포인트는 GitHub OAuth 승인 후 리다이렉트되는 곳입니다.
 * state 검증으로 CSRF 공격을 방지하고, origin 검증으로 토큰 유출을 방지합니다.
 */

import {
  getAllowedOrigins,
  verify,
  getFirstQueryValue,
} from "./_utils.js";

export default async function handler(req, res) {
  const code = getFirstQueryValue(req.query?.code);
  const state = getFirstQueryValue(req.query?.state);
  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  const stateSecret = process.env.OAUTH_STATE_SECRET;
  const allowedOrigins = getAllowedOrigins();

  // 필수 파라미터 확인
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
    // state 서명 검증
    const [encoded, signature] = String(state).split(".");
    if (!encoded || !signature || !verify(encoded, stateSecret, signature)) {
      res.status(400).send("Invalid state.");
      return;
    }

    // state payload 파싱 및 만료 확인 (10분)
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    );
    const isExpired = Date.now() - payload.ts > 10 * 60 * 1000;
    if (isExpired) {
      res.status(400).send("Expired state.");
      return;
    }

    // origin이 허용 목록에 있는지 확인
    if (!allowedOrigins.includes(payload.origin)) {
      res.status(400).send("Invalid origin.");
      return;
    }

    // GitHub에서 access_token 교환
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

    // Decap CMS가 기대하는 형식으로 postMessage 전달
    // NOTE: origin을 명시적으로 지정하여 토큰이 허용된 사이트에만 전달되도록 함
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
