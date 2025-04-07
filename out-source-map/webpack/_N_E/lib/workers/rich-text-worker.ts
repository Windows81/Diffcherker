import getRichTextDiff from 'lib/rich-text/get-rich-text-diff';
import { RichTextWorkerInput } from 'types/rich-text';

self.addEventListener('message', (e: MessageEvent<RichTextWorkerInput>) => {
  const { rows, left, right, diffLevel, moves } = e.data;

  const result = getRichTextDiff(rows, left, right, diffLevel, moves);
  self.postMessage(result);
  return;
});
