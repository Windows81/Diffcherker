export function rowInView(rowId: string, scrollToOffset: number = 0) {
  const searchResultSpan = document.getElementById(rowId);

  return (
    searchResultSpan &&
    searchResultSpan.getBoundingClientRect().bottom < window.innerHeight &&
    searchResultSpan.getBoundingClientRect().top > scrollToOffset
  );
}
