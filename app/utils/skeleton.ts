/** Skeleton rows stay on screen at least this long, so a fast server doesn't make them flash. */
export const SKELETON_MIN_MS = 1000;

/** Resolves with `work`'s result, but not before SKELETON_MIN_MS has passed. A failure is reported at once. */
export async function atLeastSkeletonTime<T>(work: Promise<T>): Promise<T> {
  const [result] = await Promise.all([work, new Promise((r) => setTimeout(r, SKELETON_MIN_MS))]);
  return result;
}
