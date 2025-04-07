import { FC, useCallback, useMemo, useState } from 'react';
import css from './rich-text-output-page-header.module.css';
import useEffectStateUpdate from 'lib/hooks/use-effect-state-update';
import IconButton from 'components/shared/icon-button';
import ChevronUpSvg from 'components/shared/icons/arrow-up.svg';
import ChevronDownSvg from 'components/shared/icons/arrow-down.svg';
import Dropdown from 'components/shared/dropdown';
import { ZoomTypeOption } from 'types/zoom-type-option';
import cx from 'classnames';

type RichTextOutputPageHeaderProps = {
  pageNumber: number;
  totalPages: number;
  zoomTypeOption: ZoomTypeOption;
  maxWidth?: number;
  isAtEnd: boolean;
  onPageChange?: (pageNumber: number) => void;
  onZoomChange?: (zoomType: ZoomTypeOption) => void;
};

const RichTextOutputPageHeader: FC<RichTextOutputPageHeaderProps> = ({
  pageNumber,
  totalPages,
  zoomTypeOption,
  maxWidth,
  isAtEnd,
  onPageChange = () => {},
  onZoomChange = () => {},
}) => {
  const style = useMemo(
    () => ({
      maxWidth: maxWidth ?? 'none',
    }),
    [maxWidth],
  );
  const [currPageInput, setCurrPageInput] = useState<number | ''>(pageNumber);
  const [isShowingLastPage, setIsShowingLastPage] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  //If the input is empty, just default the pageNumber to 1
  const currPageNumber = currPageInput || 1;

  useEffectStateUpdate(() => setCurrPageInput(pageNumber), [pageNumber]);
  useEffectStateUpdate(() => setIsShowingLastPage(isAtEnd), [isAtEnd]);

  const clamp = useCallback(
    (value: number) => Math.max(Math.min(value, totalPages), 1),
    [totalPages],
  );

  return (
    <div className={cx(css.pageHeader, maxWidth && css.hasMaxWidth)}>
      <div className={css.tools} style={style}>
        <div className={css.pageTool}>
          <strong>Page</strong>
          &nbsp;&nbsp;
          <input
            type="number"
            value={isShowingLastPage ? totalPages : currPageInput}
            className={css.input}
            onChange={(event) => {
              setIsShowingLastPage(false);
              setCurrPageInput(clamp(parseInt(event?.target.value)) || '');
            }}
            onBlur={() => onPageChange(currPageNumber)}
            onKeyDown={(event) =>
              event.key === 'Enter' && onPageChange(currPageNumber)
            }
            style={{
              width: `${currPageNumber.toString().length}em`,
            }}
          />{' '}
          <div className={css.ofTotalPages}>of {totalPages}</div>
        </div>
        <div className={css.pageUpDown}>
          <IconButton
            svg={ChevronUpSvg}
            style="secondary"
            size="small"
            tone="base"
            onClick={() => onPageChange(clamp(currPageNumber - 1))}
          />
          <IconButton
            onClick={() => onPageChange(clamp(currPageNumber + 1))}
            svg={ChevronDownSvg}
            style="secondary"
            size="small"
            tone="base"
          />
          <Dropdown
            isOpen={isDropdownOpen}
            setIsOpen={setIsDropdownOpen}
            onChange={onZoomChange}
            dropdownClassName={css.zoomDropdown}
            buttonClassName={css.zoomDropdownButton}
            display={zoomTypeOption.label}
            maxHeight={700}
            options={[
              {
                label: 'Automatic zoom',
                value: 'auto',
              },
              {
                label: 'Fit page',
                value: 'page',
              },
              {
                label: 'Fit width',
                value: 'width',
              },
              {
                label: 'Actual size',
                value: '1',
              },
              {
                label: '25%',
                value: '0.25',
              },
              {
                label: '50%',
                value: '0.5',
              },
              {
                label: '75%',
                value: '0.75',
              },
              {
                label: '100%',
                value: '1',
              },
              {
                label: '125%',
                value: '1.25',
              },
              {
                label: '150%',
                value: '1.5',
              },
              {
                label: '175%',
                value: '1.75',
              },
              {
                label: '200%',
                value: '2',
              },
              {
                label: '300%',
                value: '3',
              },
              {
                label: '400%',
                value: '4',
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default RichTextOutputPageHeader;
