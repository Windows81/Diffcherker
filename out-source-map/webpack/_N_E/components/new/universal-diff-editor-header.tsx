import {
  ExcelDiffOutputTypes,
  type ImageDiffOutputTypes,
  type PdfDiffOutputTypes,
} from 'lib/output-types';
import { t } from 'lib/react-tiny-i18n';
import * as React from 'react';
import { isProUser } from 'redux/selectors/user-selector';
import { useAppSelector } from 'redux/store';
import css from './universal-diff-editor-header.module.css';
import Button from './../shared/button';
import Upload from './../shared/icons/upload.svg';
import { usePdfExport } from 'lib/state/pdfExport';

interface UniversalDiffEditorHeaderProps {
  type: ExcelDiffOutputTypes | PdfDiffOutputTypes | ImageDiffOutputTypes;
  exportToExcel?: () => void;
}

const UniversalDiffEditorHeader = (
  props: UniversalDiffEditorHeaderProps,
): JSX.Element => {
  const { type, exportToExcel } = props;
  const isPro = useAppSelector(isProUser);
  const exportPdf = usePdfExport();

  const handleExportUniversal = React.useCallback(
    async (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault();
      if (exportToExcel) {
        exportToExcel();
      }
    },
    [exportToExcel],
  );

  const handleExportPdf = React.useCallback(
    async (ev: React.MouseEvent<HTMLButtonElement>) => {
      ev.preventDefault();
      exportPdf();
    },
    [exportPdf],
  );

  return (
    <div className={css.buttonHeaderContainer}>
      <Button
        iconStartSvg={Upload}
        style="primary"
        tone="base"
        data-tooltip={!isPro ? 'Diffchecker Desktop and Pro only' : undefined}
        disabled={!isPro}
        onClick={handleExportPdf}
      >
        {t('DiffEditorHeader.exportAsPdf')}
      </Button>
      {type === ExcelDiffOutputTypes.Table && ( // "Export to Excel" button will hide when in text diff output. Discrepancy with the figma, but reflects current live app behaviour.
        <Button
          iconStartSvg={Upload}
          style="primary"
          tone="green"
          data-tooltip={!isPro ? 'Diffchecker Desktop and Pro only' : undefined}
          disabled={!isPro}
          onClick={handleExportUniversal}
        >
          {t('DiffEditorHeader.exportAsExcel')}
        </Button>
      )}
    </div>
  );
};

export default UniversalDiffEditorHeader;
