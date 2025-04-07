export function elInScrollFrame(el: Element, scrollFrame: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const containerRect = scrollFrame.getBoundingClientRect();
  const inScrollFrame =
    rect.top >= containerRect.top &&
    rect.left >= containerRect.left &&
    rect.bottom <= containerRect.bottom &&
    rect.right <= containerRect.right;

  const inWindow = rect.bottom < window.innerHeight && rect.top >= 0;

  return inScrollFrame && inWindow;
}
