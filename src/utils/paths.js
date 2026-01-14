/**
 * 경로 관련 유틸리티 함수들
 *
 * NOTE: Astro의 BASE_URL은 빌드 시점에 결정되므로,
 * 이 함수들은 .astro 파일의 프론트매터에서 import하여 사용합니다.
 *
 * 사용 예시:
 * ---
 * import { withBase } from "../utils/paths.js";
 * ---
 * <a href={withBase("/blog")}>Blog</a>
 */

/**
 * BASE_URL을 정규화하여 항상 슬래시로 끝나도록 함
 * @returns {string}
 */
export function getBasePath() {
  const baseUrl = import.meta.env.BASE_URL;
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

/**
 * 주어진 경로에 BASE_URL을 붙여 반환
 * GitHub Pages 서브디렉토리 배포 시 필요
 *
 * @param {string} path - 상대 경로 (예: "/blog", "/images/photo.jpg")
 * @returns {string} - BASE_URL이 붙은 전체 경로
 *
 * @example
 * // astro.config.mjs에서 base: "/yoojasalon_blog" 설정 시
 * withBase("/blog") // => "/yoojasalon_blog/blog"
 * withBase("/images/photo.jpg") // => "/yoojasalon_blog/images/photo.jpg"
 */
export function withBase(path) {
  const basePath = getBasePath();
  return `${basePath}${path.replace(/^\/+/, "")}`;
}
