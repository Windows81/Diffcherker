import Button, { BaseButtonProps } from 'components/shared/button';
import OkSvg from 'components/shared/icons/ok.svg';
import React, { useState } from 'react';

import css from './copy-readonly.module.css';
import TextInput from '../shared/form/text-input';

interface CopyReadonlyProps {
  value: string;
  buttonProps?: BaseButtonProps;
}

const CopyReadonly: React.ForwardRefRenderFunction<
  HTMLInputElement,
  CopyReadonlyProps
> = (
  { value, buttonProps = { size: 'large', tone: 'green', style: 'primary' } },
  ref,
) => {
  const [recentlyCopied, setRecentlyCopied] = useState(false);

  const handleCopy: React.MouseEventHandler<HTMLButtonElement> = (ev) => {
    ev.preventDefault();
    ref && 'current' in ref && ref.current?.select();
    void navigator.clipboard.writeText(value);
    setRecentlyCopied(true);
    setTimeout(() => {
      setRecentlyCopied(false);
    }, 2000);
  };
  return (
    <div className={css.copy}>
      <TextInput ref={ref} defaultValue={value} readOnly />
      <Button
        {...buttonProps}
        onClick={handleCopy}
        iconStartSvg={recentlyCopied ? OkSvg : undefined}
        disabled={recentlyCopied}
        key={recentlyCopied ? 'disabled' : 'enabled'}
      >
        {recentlyCopied ? 'Copied' : <span className={css.copyText}>Copy</span>}
      </Button>
    </div>
  );
};

export default React.forwardRef(CopyReadonly);
