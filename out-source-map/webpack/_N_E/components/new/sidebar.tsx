import cx from 'classnames';
import IconButton from 'components/shared/icon-button';
import ChevronLeftSvg from 'components/shared/icons/chevron-left.svg';
import ChevronRightSvg from 'components/shared/icons/chevron-right.svg';

import css from './sidebar.module.css';
import Divider from 'components/shared/divider';
import React from 'react';

interface SidebarProps {
  header: React.ReactNode;
  visible: boolean;
  setVisibility: (newState: boolean) => void;
  aboveSidebar?: React.ReactNode;
  belowSidebar?: React.ReactNode;
  fixedHeight?: boolean;
  isHome?: boolean;
  width?: number;
  instantTransition?: boolean;
}

const Sidebar: React.FC<React.PropsWithChildren<SidebarProps>> = ({
  aboveSidebar,
  belowSidebar,
  fixedHeight,
  isHome,
  header,
  visible,
  setVisibility,
  width,
  instantTransition,
  children,
}) => {
  return (
    <div
      className={cx(
        css.wrapper,
        visible ? css.open : css.closed,
        instantTransition && css.instantTransition,
      )}
      style={
        {
          '--width': `${width ?? 192}px`,
        } as React.CSSProperties
      }
    >
      {!!aboveSidebar && <div className={css.above}>{aboveSidebar}</div>}
      <div
        className={cx(
          css.sidebar,
          fixedHeight && css.fixedHeight,
          isHome && css.home,
        )}
      >
        <div className={css.background} />
        {/* need above div to handle the gap at the top of the header when sticky */}
        <div className={css.buttonWrapper}>
          <IconButton
            style="text"
            tone="base"
            svg={visible ? ChevronLeftSvg : ChevronRightSvg}
            onClick={() => setVisibility(!visible)}
            className={css.minimizeButton}
            aria-label="Minimize sidebar"
          />
        </div>

        <div className={css.header}>
          <div className={css.headerContent}>{header}</div>
          <Divider />
        </div>
        <div
          className={cx(
            css.body,
            fixedHeight && css.fixedHeight,
            isHome && css.home,
          )}
        >
          <div className={css.bodyHeightContainer}>
            <div className={css.bodyOverflowWrapper}>
              <div className={css.bodyContent}>{children}</div>
            </div>
          </div>
        </div>
      </div>
      {!!belowSidebar && <div className={css.below}>{belowSidebar}</div>}
    </div>
  );
};

export default Sidebar;
