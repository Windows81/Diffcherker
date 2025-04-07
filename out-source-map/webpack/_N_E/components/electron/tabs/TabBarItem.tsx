import * as React from 'react';
import cx from 'classnames';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useTab, useTabActivate, useTabClose } from 'lib/state/tabs';
import css from './TabBarItem.module.css';
import CancelSVG from 'components/shared/icons/cancel.svg';
import Icon from 'components/shared/icon';
import { combineHandlers } from 'lib/combineHandlers';

interface TabBarItemProps {
  id: string;
}

export const TabBarItem = (props: TabBarItemProps) => {
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.id });
  const style = {
    zIndex: isDragging ? 4 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const { id } = props;
  const tab = useTab(id);
  const close = useTabClose();
  const activate = useTabActivate();
  const handleClose = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Stop click from reaching parent div to prevent tab activation during close
      close(id);
    },
    [id, close],
  );
  const handleActivate = React.useCallback(() => {
    activate(id);
  }, [id, activate]);

  const handleClick = combineHandlers(
    listeners?.onClick as (event: React.SyntheticEvent<unknown>) => void,
    handleActivate,
  );
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      activate(id);
    }
  };

  if (!tab) {
    return null;
  }
  const { label, icon, active } = tab;

  return (
    <div
      className={cx(css.tabBarItem, active && css.tabBarItemActive)}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="tab"
    >
      <div className={css.tabBarItemImage}>
        {icon && <img src={icon} alt="" />}
      </div>
      <div className={css.tabBarItemLabel}>{label}</div>
      <div style={{ flex: '1 1 auto' }} />
      <div className={css.buttons}>
        <button className={css.tabBarItemCloseButton} onClick={handleClose}>
          <Icon svg={CancelSVG} size="small" />
        </button>
      </div>
    </div>
  );
};
