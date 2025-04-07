import { initializeImageMagick } from '@imagemagick/magick-wasm';

export type ElectronInstantiationOptions = {
  appPath: string;
  electronIsDev: boolean;
};

class ImageMagickWasm {
  static _instance: ImageMagickWasm;

  constructor() {
    if (ImageMagickWasm._instance) {
      return ImageMagickWasm._instance;
    }

    ImageMagickWasm._instance = this;
  }

  public static async instantiate(options?: ElectronInstantiationOptions) {
    if (ImageMagickWasm._instance) {
      return;
    }
    ImageMagickWasm._instance = new ImageMagickWasm();

    const relativeUrl = new URL(
      '@imagemagick/magick-wasm/magick.wasm',
      import.meta.url,
    ).href;

    if (process.env.NEXT_PUBLIC_IS_ELECTRON) {
      if (!options) {
        throw new Error('Electron instantiation options required.');
      }
      await ImageMagickWasm._instance.instantiateElectron(relativeUrl, options);
    } else {
      await ImageMagickWasm._instance.instantiateWeb(relativeUrl);
    }
  }

  private async instantiateWeb(relativeUrl: string) {
    const wasmURL = new URL(relativeUrl, self.location.origin);
    await initializeImageMagick(wasmURL);
  }

  private async instantiateElectron(
    relativeUrl: string,
    options: ElectronInstantiationOptions,
  ) {
    relativeUrl = options.electronIsDev
      ? relativeUrl.replace('_next', '.next')
      : relativeUrl;
    const wasmBase =
      `file://${options.appPath}` + (options.electronIsDev ? '/web' : '/out');
    const wasmURL = new URL(wasmBase + relativeUrl);

    const wasmBuffer = await fetch(wasmURL).then((response) => {
      if (!response.ok) {
        throw new Error('Unable to fetch ImageMagick WASM file.');
      }
      return response.arrayBuffer();
    });
    await initializeImageMagick(wasmBuffer);
  }
}

export default ImageMagickWasm;
