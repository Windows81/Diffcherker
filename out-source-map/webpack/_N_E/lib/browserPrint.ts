const THREE_MONTHS = 1000 * 60 * 60 * 24 * 90;

// Copied from https://github.com/oelin/fingerprint
async function createCanvasBp() {
  const canvasElement = document.createElement('canvas');
  const canvasContext = canvasElement.getContext('2d');

  if (canvasContext) {
    canvasContext.fillText('abc', 0, 100);
    canvasContext.beginPath();
    canvasContext.arc(20, 20, 20, 0, 6);
    canvasContext.fillStyle = 'red';
    canvasContext.fill();

    const canvasData = new TextEncoder().encode(canvasElement.toDataURL());
    const canvasPrint = await crypto.subtle.digest('sha-1', canvasData);
    return Buffer.from(new Uint8Array(canvasPrint)).toString('base64');
  } else {
    crypto.randomUUID();
  }
}

export async function getBrowserPrint(): Promise<string> {
  const bpString = localStorage.getItem('diffchecker-bp');
  let bpObj =
    typeof bpString === 'string'
      ? JSON.parse(bpString)
      : { exp: new Date().getTime() };

  if (bpObj.exp <= new Date().getTime()) {
    const bp = await createCanvasBp();
    bpObj = {
      bp,
      exp: new Date().getTime() + THREE_MONTHS,
    };

    localStorage.setItem('diffchecker-bp', JSON.stringify(bpObj));
  }

  return bpObj.bp;
}
