import normalize from 'lib/normalize';
import { DiffLevel, NormalizeOptions } from 'types/normalize';
import { NormalizeWorkerReqData } from 'types/normalize-worker-message';

export type NormalizeDiffInput = {
  left: string;
  right: string;
  diffLevel?: DiffLevel;
  options?: NormalizeOptions;
};

const ctx: Worker = self as unknown as Worker;

ctx.addEventListener('message', (e: MessageEvent<NormalizeWorkerReqData>) => {
  const { left, right, diffLevel, options } = e.data;

  const result = normalize(left, right, diffLevel, options);
  ctx.postMessage({ ...result, left, right, diffLevel });
  return;
});

export {};
