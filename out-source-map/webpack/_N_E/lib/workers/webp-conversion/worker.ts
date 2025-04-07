import { ImageMagick, MagickFormat } from '@imagemagick/magick-wasm';
import ImageMagickWasm, {
  ElectronInstantiationOptions,
} from 'lib/workers/webp-conversion/image-magick-wasm';
import {
  ConvertMessage,
  Message,
  MessageType,
  OptionsMessage,
} from 'types/webp-conversion-worker';

let wasmInstantiationOptions: ElectronInstantiationOptions;
const ctx = self as unknown as Worker;

const convertToWebP = async (
  _fileName: string,
  buffer: ArrayBuffer,
  fileExtension: string,
): Promise<ArrayBuffer> => {
  await ImageMagickWasm.instantiate(wasmInstantiationOptions);

  const bytes = new Uint8Array(buffer);

  if (
    !(Object.values(MagickFormat) as string[]).includes(
      fileExtension.toUpperCase(),
    )
  ) {
    throw new Error('Unsupported file extension.');
  }
  return new Promise((resolve, reject) => {
    ImageMagick.read(bytes, fileExtension as MagickFormat, (image) => {
      image.write(MagickFormat.Webp, (data) => {
        const blob = new Blob([data], { type: 'image/webp' });
        const reader = new FileReader();
        reader.onloadend = function () {
          resolve(reader.result as ArrayBuffer);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
    });
  });
};

const convertMessageHandler = async (m: ConvertMessage) => {
  const { fileName, buffer, fileExtension } = m;
  const outBuffer = await convertToWebP(fileName, buffer, fileExtension);
  ctx.postMessage({ buffer: outBuffer }, [outBuffer]);
};

const windowMessageHandler = async (m: OptionsMessage) => {
  wasmInstantiationOptions = m;
};

ctx.addEventListener('message', async (e: MessageEvent<Message>) => {
  switch (e.data.type) {
    case MessageType.CONVERT:
      convertMessageHandler(e.data as ConvertMessage);
      break;
    case MessageType.OPTIONS:
      windowMessageHandler(e.data as OptionsMessage);
      break;
    default:
      throw new Error(`Unsupported message type - ${e.data.type}`);
  }
});
