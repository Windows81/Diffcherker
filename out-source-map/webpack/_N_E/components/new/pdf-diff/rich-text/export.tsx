import Button from 'components/shared/button';
import SaveIcon from 'web/components/shared/icons/save.svg';
import ChevronDownIcon from 'web/components/shared/icons/chevron-down.svg';
import LeftDocIcon from 'web/components/shared/icons/split.svg';
import RightDocIcon from 'web/components/shared/icons/split-right.svg';
import SplitViewIcon from 'web/components/shared/icons/split-both.svg';
import AlternatingIcon from 'web/components/shared/icons/alternating.svg';

import css from './export.module.css';
import Dropdown from 'components/shared/dropdown';
import { useState } from 'react';
import DiffCheckbox from 'components/new/diff-checkbox';
import { RichTextExportType } from 'types/rich-text';
import { t } from 'lib/react-tiny-i18n';

interface ExportProps {
  exportRichText: (
    exportType: RichTextExportType,
    includeStyleChanges: boolean,
  ) => void;
}

const ExportDropdown: React.FC<ExportProps> = ({ exportRichText }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [includeSummary, setIncludeSummary] = useState(false);
  const [includeStyleChanges, setIncludeStyleChanges] = useState(false);

  return (
    <div>
      <Dropdown
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        closeDropdownOnClick={false}
        maxHeight={320}
        display={
          <Button
            style="primary"
            tone="base"
            iconStartSvg={SaveIcon}
            iconEndSvg={ChevronDownIcon}
            onClick={() => setIsOpen(!isOpen)}
            asSpan // prevents wrapping button in button error
          >
            {t('PdfDiff.richText.exportButtonLabel')}
          </Button>
        }
        rightAlign
      >
        <div className={css.dropdown}>
          <div className={css.optionGroup}>
            <div className={css.label}>{t('DiffEditorHeader.options')}</div>
            <DiffCheckbox
              currentValue={includeSummary}
              onValue={true}
              offValue={false}
              label="Summary (coming soon)"
              className={css.checkbox}
              onClick={() => setIncludeSummary(!includeSummary)}
              disabled={true}
            />
            <DiffCheckbox
              currentValue={includeStyleChanges}
              onValue={true}
              offValue={false}
              label="Style changes"
              className={css.checkbox}
              onClick={() => setIncludeStyleChanges(!includeStyleChanges)}
            />

            {/* <Checkbox id="includeSummary" onClick={() => {}} />
              <label htmlFor="includeSummary">Include summary</label> */}
          </div>
          <div className={css.hr} />
          <div className={css.optionGroup}>
            <div className={css.label}>{t('DiffEditorHeader.exportAsPdf')}</div>
            <div>
              <Button
                iconStartSvg={SplitViewIcon}
                fullWidth
                style="text"
                tone="base"
                onClick={() =>
                  exportRichText(
                    RichTextExportType.SplitView,
                    includeStyleChanges,
                  )
                }
              >
                Split view
              </Button>
            </div>
            <div>
              <Button
                iconStartSvg={AlternatingIcon}
                fullWidth
                style="text"
                tone="base"
                onClick={() =>
                  exportRichText(
                    RichTextExportType.Alternating,
                    includeStyleChanges,
                  )
                }
              >
                {t('PdfDiff.richText.alternating')}
              </Button>
            </div>
            <div>
              <Button
                iconStartSvg={LeftDocIcon}
                fullWidth
                style="text"
                tone="base"
                onClick={() =>
                  exportRichText(
                    RichTextExportType.LeftDocument,
                    includeStyleChanges,
                  )
                }
              >
                {t('PdfDiff.richText.leftDocument')}
              </Button>
            </div>
            <div>
              <Button
                iconStartSvg={RightDocIcon}
                fullWidth
                style="text"
                tone="base"
                onClick={() =>
                  exportRichText(
                    RichTextExportType.RightDocument,
                    includeStyleChanges,
                  )
                }
              >
                {t('PdfDiff.richText.rightDocument')}
              </Button>
            </div>
          </div>
        </div>
      </Dropdown>
    </div>
  );
};

export default ExportDropdown;
