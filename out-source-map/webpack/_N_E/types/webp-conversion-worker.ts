export type WebPConversionWorker = Omit<Worker, 'postMessage'> & {
  postMessage(message: Message, transfer?: Transferable[]): void;
};

export enum MessageType {
  CONVERT = 'CONVERT',
  OPTIONS = 'OPTIONS',
}

export type Message = {
  type: MessageType;
};

export interface ConvertMessage extends Message {
  fileName: string;
  buffer: ArrayBuffer;
  fileExtension: string;
}

export interface OptionsMessage extends Message {
  appPath: string;
  electronIsDev: boolean;
}
