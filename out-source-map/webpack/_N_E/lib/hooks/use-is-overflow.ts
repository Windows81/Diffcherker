import { useLayoutEffect, useState } from 'react';

export const useIsOverflow = <T extends Element>(
  ref: React.RefObject<T> | undefined,
) => {
  const [isOverflow, setIsOverflow] = useState<boolean>(false);

  useLayoutEffect(() => {
    if (!ref) {
      return;
    }

    const { current } = ref;

    let resizeObserver: ResizeObserver;
    if (current) {
      const trigger = () => {
        const hasOverflow = current.scrollHeight > current.clientHeight;

        setIsOverflow(hasOverflow);
      };

      if (current) {
        if ('ResizeObserver' in window) {
          resizeObserver = new ResizeObserver(trigger);
          resizeObserver.observe(current);
        }

        trigger();
      }
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [ref]);

  return isOverflow;
};
