import { RichTextExportType } from 'types/rich-text';
import ExportDropdown from './export';
import css from './toolbar.module.css';
// import sharedCss from './../pdf-output';

interface ToolbarProps {
  exportRichText: (
    exportType: RichTextExportType,
    includeStyleChanges: boolean,
  ) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ exportRichText }) => {
  return (
    <div className={css.container}>
      <div></div> {/** Placeholder for future components */}
      <div>
        <ExportDropdown exportRichText={exportRichText} />
      </div>
    </div>
  );
};

export default Toolbar;
