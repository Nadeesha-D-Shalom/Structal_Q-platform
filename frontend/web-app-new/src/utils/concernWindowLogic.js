/**
 * Mirrors backend rules: student may raise a concern only if marks are published,
 * no concern exists yet for this submission, and within 48h of published_at.
 */
export function isConcernWindowOpen(publishedAt, concernCount, nowMs = Date.now()) {
  if (publishedAt == null || publishedAt === "") return false;
  if (Number(concernCount || 0) > 0) return false;
  const t = new Date(publishedAt).getTime();
  if (Number.isNaN(t)) return false;
  return nowMs - t <= 48 * 60 * 60 * 1000;
}

export function hoursRemainingInConcernWindow(publishedAt, nowMs = Date.now()) {
  if (!publishedAt) return 0;
  const deadline = new Date(publishedAt).getTime() + 48 * 60 * 60 * 1000;
  if (Number.isNaN(deadline)) return 0;
  const left = deadline - nowMs;
  return left > 0 ? left / (60 * 60 * 1000) : 0;
}
