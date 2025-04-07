const cloneArrayBuffer = (buf: ArrayBuffer): ArrayBuffer => {
  const copiedData = new ArrayBuffer(buf.byteLength);
  const originalView = new Uint8Array(buf);
  const copiedView = new Uint8Array(copiedData);
  copiedView.set(originalView);
  return copiedData;
};

export default cloneArrayBuffer;
