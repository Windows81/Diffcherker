import * as React from 'react';
import {
  useFindInPage,
  useFindInPageActive,
  useFindInPageEventListener,
  useFindInPageParams,
  useFindInPageResults,
} from 'lib/state/findInPage';
import css from './find-bar.module.css';
import IconButton from 'components/shared/icon-button';
import UpArrow from 'components/shared/icons/arrow-up.svg';
import DownArrow from 'components/shared/icons/arrow-down.svg';
import Close from 'components/shared/icons/cancel.svg';
import TextInput from 'components/shared/form/text-input';

const NextButton = () => {
  return (
    <IconButton
      svg={DownArrow}
      type="submit"
      style="secondary"
      tone="base"
      size="small"
    />
  );
};

const PreviousButton = () => {
  const findInPage = useFindInPage();
  return (
    <IconButton
      svg={UpArrow}
      size="small"
      onClick={() => findInPage({ forward: false })}
      style="secondary"
      tone="base"
    />
  );
};

const MatchCaseToggle = () => {
  const findInPage = useFindInPage();
  const { matchCase } = useFindInPageParams();
  // TODO(@izaakschroeder): Style this. Make the checkbox invisible
  // and leverage the labels default click handler. Use sibling
  // selector to display checked state, e.g. input:checked ~ ...
  return (
    <label style={{ display: 'flex', alignItems: 'center' }}>
      <input
        type="checkbox"
        checked={matchCase}
        onChange={(ev) => findInPage({ matchCase: ev.target.checked })}
      />
      Aa
    </label>
  );
};

const CloseButton = () => {
  const [, setActive] = useFindInPageActive();
  return (
    <IconButton
      size="small"
      svg={Close}
      onClick={() => setActive(false)}
      style="secondary"
      tone="base"
    />
  );
};

const FindText = React.forwardRef<HTMLInputElement>((_props, ref) => {
  const findInPage = useFindInPage();
  const { text } = useFindInPageParams();
  return (
    <TextInput
      size="xs"
      ref={ref}
      value={text}
      onChange={(ev) => findInPage({ text: ev.target.value })}
    />
  );
});
FindText.displayName = 'FindText';

const FindInfo = () => {
  const { matches, activeMatchOrdinal } = useFindInPageResults();
  return (
    <div className={css.findInfo}>
      {activeMatchOrdinal} / {matches}
    </div>
  );
};

const FindBar = () => {
  const findInPage = useFindInPage();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [active, setActive] = useFindInPageActive();
  const handleSubmit = React.useCallback(
    (ev: React.SyntheticEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      findInPage({ forward: true });
    },
    [findInPage],
  );
  const handleKeyDown = React.useCallback<React.KeyboardEventHandler>(
    (ev) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        ev.stopPropagation();
        setActive(false);
      }
      if (ev.shiftKey && ev.key == 'Enter') {
        ev.preventDefault();
        findInPage({ forward: false });
      }
    },
    [findInPage, setActive],
  );
  useFindInPageEventListener();
  if (!active) {
    return null;
  }

  return (
    <div className={css.findBarContainer}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <form
        className={css.findBar}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
      >
        <FindText
          ref={(elem) => {
            inputRef.current = elem;
            if (active && elem) {
              elem.select();
            }
          }}
        />
        <FindInfo />
        <MatchCaseToggle />
        <PreviousButton />
        <NextButton />
        <CloseButton />
      </form>
    </div>
  );
};

export default FindBar;
