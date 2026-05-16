/**
 * Index of the section that should be highlighted in a scroll-spy UI.
 * Uses the last section whose top edge has reached or passed the activation line,
 * so only one step is active at any scroll position (no intersection-ratio flicker).
 */
export function getActiveSectionIndex(
  sectionTops: readonly number[],
  activationLinePx: number,
): number {
  let active = 0
  for (let i = 0; i < sectionTops.length; i++) {
    if (sectionTops[i] <= activationLinePx) {
      active = i
    }
  }
  return active
}
