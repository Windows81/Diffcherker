import * as React from 'react';

import cx from 'classnames';
import eql from 'fast-deep-equal';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import TrialBar from 'components/electron/trial-bar';
import IconButton from 'components/shared/icon-button';
import { TabBarItem } from './TabBarItem';
import css from './TabBar.module.css';
import {
  useTabMove,
  useTabOpen,
  useTabOpenMenu,
  useTabs,
} from 'lib/state/tabs';
import { useIsFullscreen } from 'lib/state/fullscreen';
import FindBar from 'components/find/find-bar';
import UpdateBar from './UpdateBar';
import { useIsLicenseValid, useLicenseValue } from 'lib/state/license';
import ChevronDownSVG from 'components/shared/icons/chevron-down.svg';
import PlusSVG from 'components/shared/icons/plus.svg';
import Icon from 'components/shared/icon';

const getPlatform = () => {
  if (typeof window === 'undefined') {
    return 'unknown';
  }
  return window.machine.platform;
};

const usePlatform = () => {
  const [v, sv] = React.useState('unknown');
  React.useEffect(() => {
    sv(getPlatform());
  }, []);
  return v;
};

const PreferencesSVG = () => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={css.preferencesIcon}
  >
    <g id="icon">
      <g id="outline" opacity={0.6}>
        <path
          d="M3.29091 9.90909C3.37562 10.101 3.40089 10.3139 3.36346 10.5204C3.32603 10.7268 3.22762 10.9173 3.08091 11.0673L3.04273 11.1055C2.92439 11.2237 2.83052 11.364 2.76647 11.5185C2.70242 11.673 2.66945 11.8387 2.66945 12.0059C2.66945 12.1732 2.70242 12.3388 2.76647 12.4933C2.83052 12.6478 2.92439 12.7882 3.04273 12.9064C3.16093 13.0247 3.3013 13.1186 3.4558 13.1826C3.61031 13.2467 3.77593 13.2796 3.94318 13.2796C4.11044 13.2796 4.27605 13.2467 4.43056 13.1826C4.58507 13.1186 4.72544 13.0247 4.84364 12.9064L4.88182 12.8682C5.0318 12.7215 5.22228 12.6231 5.42872 12.5856C5.63515 12.5482 5.84806 12.5735 6.04 12.6582C6.22822 12.7388 6.38874 12.8728 6.5018 13.0435C6.61487 13.2143 6.67555 13.4143 6.67636 13.6191V13.7273C6.67636 14.0648 6.81045 14.3885 7.04914 14.6272C7.28782 14.8659 7.61154 15 7.94909 15C8.28664 15 8.61036 14.8659 8.84904 14.6272C9.08773 14.3885 9.22182 14.0648 9.22182 13.7273V13.67C9.22675 13.4594 9.29492 13.2551 9.41749 13.0837C9.54006 12.9123 9.71135 12.7818 9.90909 12.7091C10.101 12.6244 10.3139 12.5991 10.5204 12.6365C10.7268 12.674 10.9173 12.7724 11.0673 12.9191L11.1055 12.9573C11.2237 13.0756 11.364 13.1695 11.5185 13.2335C11.673 13.2976 11.8387 13.3305 12.0059 13.3305C12.1732 13.3305 12.3388 13.2976 12.4933 13.2335C12.6478 13.1695 12.7882 13.0756 12.9064 12.9573C13.0247 12.8391 13.1186 12.6987 13.1826 12.5442C13.2467 12.3897 13.2796 12.2241 13.2796 12.0568C13.2796 11.8896 13.2467 11.7239 13.1826 11.5694C13.1186 11.4149 13.0247 11.2746 12.9064 11.1564L12.8682 11.1182C12.7215 10.9682 12.6231 10.7777 12.5856 10.5713C12.5482 10.3649 12.5735 10.1519 12.6582 9.96C12.7388 9.77178 12.8728 9.61126 13.0435 9.4982C13.2143 9.38513 13.4143 9.32445 13.6191 9.32364H13.7273C14.0648 9.32364 14.3885 9.18955 14.6272 8.95086C14.8659 8.71218 15 8.38846 15 8.05091C15 7.71336 14.8659 7.38964 14.6272 7.15096C14.3885 6.91227 14.0648 6.77818 13.7273 6.77818H13.67C13.4594 6.77325 13.2551 6.70508 13.0837 6.58251C12.9123 6.45994 12.7818 6.28865 12.7091 6.09091C12.6244 5.89897 12.5991 5.68606 12.6365 5.47963C12.674 5.27319 12.7724 5.0827 12.9191 4.93273L12.9573 4.89455C13.0756 4.77634 13.1695 4.63598 13.2335 4.48147C13.2976 4.32696 13.3305 4.16135 13.3305 3.99409C13.3305 3.82683 13.2976 3.66122 13.2335 3.50671C13.1695 3.35221 13.0756 3.21184 12.9573 3.09364C12.8391 2.9753 12.6987 2.88143 12.5442 2.81738C12.3897 2.75333 12.2241 2.72036 12.0568 2.72036C11.8896 2.72036 11.7239 2.75333 11.5694 2.81738C11.4149 2.88143 11.2746 2.9753 11.1564 3.09364L11.1182 3.13182C10.9682 3.27852 10.7777 3.37694 10.5713 3.41437C10.3649 3.4518 10.1519 3.42653 9.96 3.34182H9.90909C9.72087 3.26115 9.56035 3.12721 9.44729 2.95648C9.33422 2.78575 9.27354 2.58568 9.27273 2.38091V2.27273C9.27273 1.93518 9.13864 1.61146 8.89995 1.37277C8.66127 1.13409 8.33755 1 8 1C7.66245 1 7.33873 1.13409 7.10005 1.37277C6.86136 1.61146 6.72727 1.93518 6.72727 2.27273V2.33C6.72646 2.53477 6.66578 2.73484 6.55271 2.90557C6.43965 3.0763 6.27913 3.21024 6.09091 3.29091C5.89897 3.37562 5.68606 3.40089 5.47963 3.36346C5.27319 3.32603 5.08271 3.22761 4.93273 3.08091L4.89455 3.04273C4.77634 2.92439 4.63598 2.83052 4.48147 2.76647C4.32696 2.70242 4.16135 2.66945 3.99409 2.66945C3.82683 2.66945 3.66122 2.70242 3.50671 2.76647C3.35221 2.83052 3.21184 2.92439 3.09364 3.04273C2.9753 3.16093 2.88143 3.3013 2.81738 3.4558C2.75333 3.61031 2.72036 3.77593 2.72036 3.94318C2.72036 4.11044 2.75333 4.27605 2.81738 4.43056C2.88143 4.58507 2.9753 4.72543 3.09364 4.84364L3.13182 4.88182C3.27852 5.0318 3.37694 5.22228 3.41437 5.42872C3.4518 5.63515 3.42653 5.84806 3.34182 6.04V6.09091C3.26115 6.27913 3.12721 6.43965 2.95648 6.55271C2.78575 6.66578 2.58568 6.72646 2.38091 6.72727H2.27273C1.93518 6.72727 1.61146 6.86136 1.37277 7.10005C1.13409 7.33873 1 7.66245 1 8C1 8.33755 1.13409 8.66127 1.37277 8.89995C1.61146 9.13864 1.93518 9.27273 2.27273 9.27273H2.33C2.53477 9.27354 2.73484 9.33422 2.90557 9.44729C3.0763 9.56035 3.21024 9.72087 3.29091 9.90909Z z M8 10C6.89543 10 6 9.10457 6 8C6 6.89543 6.89543 6 8 6C9.10457 6 10 6.89543 10 8C10 9.10457 9.10457 10 8 10Z"
          fillRule="evenodd"
        />
      </g>
    </g>
  </svg>
);

export const TabBar = () => {
  // TODO(@izaakschroeder): Compute height of `tabBarRef` and pass it
  // back to tab system for something more accurate.
  const tabBarRef = React.useRef<HTMLDivElement>(null);
  const isFullscreen = useIsFullscreen();
  const tabs = useTabs();
  const moveTab = useTabMove();
  const openTab = useTabOpen();
  const openMenu = useTabOpenMenu();
  const isValid = useIsLicenseValid();
  const license = useLicenseValue();
  const isTrial = license.planTier === 'trial';

  // Optimistic tabs are here to make the dragging operation happen
  // more smoothly – we can optimistically change the state when the
  // drag happens, and then if all is good it's a noop after.
  const [optimisticTabs, setOptimisticTabs] = React.useState(tabs);
  React.useEffect(() => {
    setOptimisticTabs((oldTabs) => {
      if (eql(oldTabs, tabs)) {
        return oldTabs;
      }
      return tabs;
    });
  }, [tabs, setOptimisticTabs]);

  const platform = usePlatform();

  const isMac = platform === 'darwin';
  const trafficLights = isMac && !isFullscreen;
  const isWindows = platform === 'win32';

  const handleNewTab = React.useCallback(() => {
    openTab({ href: '/new-desktop-tab', activate: true });
  }, [openTab]);

  const handleOpenPreferences = () => {
    openTab({
      id: '$preferences',
      href: '/preferences-desktop',
      activate: true,
    });
  };

  const handleOpenMenu: React.MouseEventHandler<HTMLButtonElement> = (ev) => {
    const rect = (ev.target as HTMLButtonElement).getBoundingClientRect();
    openMenu({ x: rect.left, y: rect.bottom });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // This is to allow clicking.
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOptimisticTabs((oldItems) => {
        const oldIndex = oldItems.findIndex((tab) => tab.id === active.id);
        const newIndex = oldItems.findIndex((tab) => tab.id === over.id);
        return arrayMove(oldItems, oldIndex, newIndex);
      });
      moveTab(`${active.id}`, `${over.id}`);
    }
  }

  return (
    <div className={cx(isWindows && css.winControlBarPadding)}>
      <div
        className={cx(css.tabBar, trafficLights && css.indent)}
        ref={tabBarRef}
      >
        {!isMac && (
          <button className={css.hamburger} onClick={handleOpenMenu}>
            <div className={css.iconContainer}>
              <img src="/static/electron/icon.svg" alt="Diffchecker logo" />
            </div>
            <Icon svg={ChevronDownSVG} size="small" />
          </button>
        )}
        {isValid && (
          <>
            <div className={css.tabGroup} data-testid="tab-bar">
              <div className={css.tabsWrapper}>
                <div className={css.tabs}>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[
                      restrictToHorizontalAxis,
                      restrictToParentElement,
                    ]}
                  >
                    <SortableContext
                      items={optimisticTabs}
                      strategy={horizontalListSortingStrategy}
                    >
                      {optimisticTabs.map((tab) => {
                        return <TabBarItem key={tab.id} id={tab.id} />;
                      })}
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
              <div className={css.buttons}>
                <IconButton
                  style="text"
                  tone="base"
                  svg={PlusSVG}
                  onClick={handleNewTab}
                  aria-label="New Tab"
                />
              </div>
            </div>
            <div className={cx(css.rightBar, isTrial && css.trialRightBar)}>
              <UpdateBar />
              <div className={css.noDrag}>
                <IconButton
                  style="text"
                  tone="base"
                  svg={PreferencesSVG}
                  onClick={handleOpenPreferences}
                  aria-label="Open preferences"
                />
              </div>
              {isTrial && <TrialBar />}
            </div>
          </>
        )}
      </div>
      <FindBar />
    </div>
  );
};
