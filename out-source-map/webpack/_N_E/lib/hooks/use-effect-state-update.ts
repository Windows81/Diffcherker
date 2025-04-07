import { useEffect, useRef } from 'react';

// mimics the setState() callback.
// Mainly skips the useEffect reload on initial render.
const useEffectStateUpdate = (
  callback: () => void,
  stateDependencies: unknown[],
): void => {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      callback();
    }
  }, stateDependencies); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useEffectStateUpdate;
