import { PageRange } from 'types/page-range';
import css from './pdf-range-picker.module.css';
import { DiffSide } from 'types/diffSide';
import Select from 'components/shared/form/select';
import Tracking from 'lib/tracking';

interface PdfRangePickerProps {
  side: DiffSide;
  pageCount: number;
  pageRange: PageRange;
  setPageRange: (pageRange: PageRange) => void;
  size?: 'default' | 'small';
}

const PdfRangePicker: React.FC<PdfRangePickerProps> = ({
  pageCount,
  pageRange: { from, to },
  setPageRange,
  size = 'default',
}) => {
  const pageNumbers = {
    from: Array.from({ length: to }, (_, i) => i + 1),
    to: Array.from({ length: pageCount - from + 1 }, (_, i) => i + from),
  };

  const handlePageRangeChange = (position: 'from' | 'to', page: number) => {
    setPageRange({
      from: position === 'from' ? page : from,
      to: position === 'to' ? page : to,
    });
    Tracking.trackEvent('Changed PDF page range', {
      position,
      page,
    });
  };

  // hard coding in a width for select elements since we need to prevent select elements from changing size due to the inner elements being added/removed
  const numDigits = pageCount < 10 ? 1 : pageCount < 100 ? 2 : 3;
  const digitWidth = 8; // 1 digit will take up the space of 8px
  const baseWidth = size === 'default' ? 52 : 40; // width of the select element without content yet
  const selectStyle: React.CSSProperties = {
    minWidth: numDigits * digitWidth + baseWidth, // min width for the edge case in which someone decides to upload a file with 4+ digits (the select elements will change size here, but there'd likely be bigger issues at play here)
  };

  return (
    <div className={css.container}>
      <span className={css.textPage}>Page</span>
      <Select
        onChange={(event) =>
          handlePageRangeChange('from', Number(event.target.value))
        }
        value={from}
        size={size}
        style={selectStyle}
      >
        {pageNumbers.from.map((page) => (
          <option key={page} value={page}>
            {page}
          </option>
        ))}
      </Select>
      <span className={css.textTo}>to</span>
      <Select
        onChange={(event) =>
          handlePageRangeChange('to', Number(event.target.value))
        }
        value={to}
        size={size}
        style={selectStyle}
      >
        {pageNumbers.to.map((page) => (
          <option key={page} value={page}>
            {page}
          </option>
        ))}
      </Select>
    </div>
  );
};

export default PdfRangePicker;
