import cx from 'classnames';
import React, { useEffect, useRef } from 'react';

import css from './text-area.module.css';
import mergeRefs from 'lib/merge-refs';

type TextAreaProps = {
  size?: 'default' | 'small';
  error?: boolean;
  autoGrow?: boolean;
  autoGrowMin?: number;
  autoGrowMax?: number;
} & Omit<JSX.IntrinsicElements['textarea'], 'type' | 'size'>;

function isCursorAtEnd(textarea: HTMLTextAreaElement) {
  return (
    textarea.selectionStart == textarea.selectionEnd &&
    textarea.selectionStart == textarea.value.length
  );
}

const paddingForNoScrollBar = 2;

const TextArea: React.ForwardRefRenderFunction<
  HTMLTextAreaElement,
  TextAreaProps
> = (
  {
    size = 'default',
    rows = 3,
    error,
    value,
    autoGrow = false,
    autoGrowMin,
    autoGrowMax,
    ...props
  },
  ref,
) => {
  const innerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoGrow && innerRef.current) {
      innerRef.current.style.height = '0px';
      innerRef.current.style.overflow = 'hidden';
      const autoHeight = innerRef.current.scrollHeight + paddingForNoScrollBar;

      let height = autoHeight;

      if (autoGrowMin) {
        height = Math.max(autoGrowMin, autoHeight);
      }

      if (autoGrowMax) {
        height = Math.min(autoGrowMax, autoHeight);
        if (autoHeight > autoGrowMax) {
          innerRef.current.style.overflow = 'auto';
          if (isCursorAtEnd(innerRef.current)) {
            innerRef.current.scrollTop = innerRef.current.scrollHeight;
          }
        }
      }

      innerRef.current.style.height = `${height}px`;
    }
  }, [autoGrow, autoGrowMax, autoGrowMin, value]);

  return (
    <textarea
      {...props}
      value={value}
      rows={rows}
      className={cx(
        css.textarea,
        css[size],
        error && css.error,
        props.className,
      )}
      ref={mergeRefs([ref, innerRef])}
    />
  );
};

export default React.forwardRef(TextArea);
