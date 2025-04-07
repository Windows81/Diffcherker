import { createContext, useContext, useEffect } from 'react';
import Tracking from 'lib/tracking';
import { useAppStore } from 'redux/store';

const TrackingContext = createContext(Tracking);

export function TrackingInjector({ children }: { children: React.ReactNode }) {
  const store = useAppStore();
  const state = store.getState();

  useEffect(() => {
    Tracking.reduxStore = state;
  }, [state]);

  /**
   * Future work should include the creation of the Tracking class in this context component while passing the redux store into it's consturctor
   * and replacing all the manual imports of Tracking throughout the codebase with `useContext` instead.
   */
  return (
    <TrackingContext.Provider value={Tracking}>
      {children}
    </TrackingContext.Provider>
  );
}

// unused?
export function useAppContext() {
  return useContext(TrackingContext);
}
