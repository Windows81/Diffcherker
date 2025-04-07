import Icon from './icon';
import css from './tab.module.css';
import cx from 'classnames';

interface BaseTabProps {
  svg?: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  showLabel?: boolean;
  isSelected?: boolean;
  disabled?: boolean;
  className?: string;
}

type ButtonTabProps = Omit<
  JSX.IntrinsicElements['button'],
  'aria-label' | 'onClick'
> & {
  selectTab: () => void;
};
type TextTabProps = {
  selectTab?: undefined;
};

type TabProps = BaseTabProps & (ButtonTabProps | TextTabProps);

/***
 * Note that this isn't the tab for electron, but instead for things like the sidebar.
 * This is quite similar to `Button` but is used very, very differently,
 *  and separated in the designs as well hence being its own component.
 *
 * Unless passed an onClick function, this will return a static div instead of a button
 */
const Tab: React.FC<TabProps> = ({
  svg,
  label,
  showLabel = true,
  isSelected,
  disabled,
  className,
  selectTab,
  ...props
}) => {
  const classes = cx(className, css.tab, {
    [css.button]: !!selectTab,
    [css.selected]: isSelected,
    [css.disabled]: disabled,
  });
  const innerContent = (
    <>
      {svg && <Icon size="small" svg={svg} />}
      {showLabel && <span className={css.label}>{label}</span>}
    </>
  );

  if (selectTab) {
    return (
      <button
        className={classes}
        onClick={selectTab}
        aria-label={`${label} tab`}
        disabled={disabled}
        {...props}
      >
        {innerContent}
      </button>
    );
  }

  return <div className={classes}>{innerContent}</div>;
};

export default Tab;
