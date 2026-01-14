/**
 * OAuth API 공통 유틸리티
 *
 * NOTE: 이 파일은 Vercel Functions에서 공유되는 헬퍼 함수들입니다.
 * 파일명이 _로 시작하면 Vercel이 API 엔드포인트로 노출하지 않습니다.
 */

import crypto from "node:crypto";

/**
 * 환경변수에서 허용된 오리진 목록을 파싱
 * ALLOWED_ORIGINS 환경변수는 쉼표로 구분된 URL 목록
 *
 * @returns {string[]} 허용된 오리진 배열
 *
 * @example
 * // ALLOWED_ORIGINS=https://example.com,https://staging.example.com
 * getAllowedOrigins() // => ["https://example.com", "https://staging.example.com"]
 */
export function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * 요청된 오리진이 허용 목록에 있으면 해당 오리진을, 없으면 첫 번째 허용 오리진 반환
 *
 * @param {string[]} allowedOrigins - 허용된 오리진 배열
 * @param {string|undefined} requestedOrigin - 요청 헤더의 origin
 * @returns {string|undefined} 사용할 오리진
 */
export function pickOrigin(allowedOrigins, requestedOrigin) {
  if (requestedOrigin && allowedOrigins.includes(requestedOrigin)) {
    return requestedOrigin;
  }
  return allowedOrigins[0];
}

/**
 * 값을 base64url로 인코딩
 * @param {string} value
 * @returns {string}
 */
export function toBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

/**
 * HMAC-SHA256으로 값에 서명
 * @param {string} value - 서명할 값
 * @param {string} secret - 비밀 키
 * @returns {string} base64url 인코딩된 서명
 */
export function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

/**
 * HMAC-SHA256 서명 검증 (타이밍 공격 방지)
 * @param {string} value - 원본 값
 * @param {string} secret - 비밀 키
 * @param {string} signature - 검증할 서명
 * @returns {boolean} 서명 일치 여부
 */
export function verify(value, secret, signature) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("base64url");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

/**
 * 쿼리 파라미터에서 첫 번째 값만 추출 (배열일 수 있음)
 * @param {string|string[]|undefined} value
 * @returns {string|undefined}
 */
export function getFirstQueryValue(value) {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}
