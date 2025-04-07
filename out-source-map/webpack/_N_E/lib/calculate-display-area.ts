// IMAGE TODO: This might not be needed once we do the full image diff refactor.

export default function calculateDisplayArea(
  defaultWidth: number,
  originalHeight: number,
  originalWidth: number,
  displayArea: HTMLDivElement | null,
) {
  const ratio = originalHeight / originalWidth;
  const w = displayArea
    ? Math.min(1000, displayArea.clientWidth)
    : defaultWidth;
  const h = ratio * w;
  return { w, h };
}
