import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export function useIsWindowResizing() {
  const [isResizing, setIsResizing] = useState<boolean>();
  const timeoutIdForResizing = useRef<NodeJS.Timeout>();

  const handleResize = useCallback(() => {
    clearTimeout(timeoutIdForResizing.current);

    setIsResizing(true);

    timeoutIdForResizing.current = setTimeout(() => {
      setIsResizing(false);
    }, 1000);
  }, []);

  useLayoutEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, setIsResizing]);

  return isResizing;
}
