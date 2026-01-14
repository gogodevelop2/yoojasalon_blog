/**
 * GitHub OAuth 인증 시작점
 * GET /api/auth → GitHub 로그인 페이지로 리다이렉트
 *
 * NOTE: 이 엔드포인트는 Decap CMS에서 "GitHub으로 로그인" 시 호출됩니다.
 * state 파라미터에 nonce, timestamp, origin을 포함하여 CSRF 공격을 방지합니다.
 */

import crypto from "node:crypto";
import {
  getAllowedOrigins,
  pickOrigin,
  toBase64Url,
  sign,
} from "./_utils.js";

export default function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const siteUrl = process.env.SITE_URL;
  const stateSecret = process.env.OAUTH_STATE_SECRET;
  const allowedOrigins = getAllowedOrigins();
  const requestedOrigin =
    typeof req.headers.origin === "string" ? req.headers.origin : undefined;

  // 필수 환경변수 확인
  if (!clientId || !siteUrl || !stateSecret || allowedOrigins.length === 0) {
    res.status(500).send("Missing OAuth environment variables.");
    return;
  }

  const origin = pickOrigin(allowedOrigins, requestedOrigin);
  if (!origin) {
    res.status(500).send("Missing allowed origin.");
    return;
  }

  // NOTE: scope는 환경변수로 설정 가능. 공개 리포면 public_repo로 충분
  const scope = process.env.OAUTH_SCOPE || "public_repo";

  // state: CSRF 방지용. nonce + timestamp + origin을 서명하여 전달
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
