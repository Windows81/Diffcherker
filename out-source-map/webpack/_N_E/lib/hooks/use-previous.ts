import { useEffect, useRef } from 'react';

// useful for comparing against previous state/props
// https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

export default usePrevious;
