import { ExcelDiffOutputTypes } from 'lib/output-types';
import { DiffInputType } from 'types/diff-input-type';

import ExcelDiffOutputUnified, {
  ExportToExcelRef,
} from './excel-diff-output-unified';
import { forwardRef } from 'react';
import { Diff } from 'types/diff';
import { TextDiffOutputSettingsObject } from './new/text-diff-output/settings';
import dynamic from 'next/dynamic';

const TextDiffOutput = dynamic(
  async () => await import('components/new/text-diff-output'),
  {
    ssr: false,
  },
);

export interface ExcelDiffOutputProps {
  diffTable: string[][];
  diff?: Diff;
  createdTextDiff: boolean;
  maxLines: number;
  onTextDiffOuputSettingsChange: (
    newSettings: TextDiffOutputSettingsObject,
  ) => void;
}

const ExcelDiffOutput = forwardRef<ExportToExcelRef, ExcelDiffOutputProps>(
  function ExcelDiffOutput(props, ref) {
    const type = props.createdTextDiff
      ? ExcelDiffOutputTypes.Text
      : ExcelDiffOutputTypes.Table;

    return (
      <>
        {type === ExcelDiffOutputTypes.Table && (
          <ExcelDiffOutputUnified
            diffTable={props.diffTable}
            maxLines={props.maxLines}
            ref={ref}
          />
        )}
        {type === ExcelDiffOutputTypes.Text && props.diff && (
          <TextDiffOutput
            diff={props.diff}
            diffInputType={DiffInputType.EXCEL}
            scrollToOffset={0}
            showLocationBar={true}
            showTopBar={true}
            onSettingsChange={props.onTextDiffOuputSettingsChange}
          />
        )}
      </>
    );
  },
);

export default ExcelDiffOutput;
