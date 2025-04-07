// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function combineHandlers<T extends React.SyntheticEvent<any>>(
  ...handlers: (((event: T) => void) | undefined)[]
) {
  return (event: T) => {
    for (const handler of handlers) {
      if (handler) {
        handler(event);
        if (event.defaultPrevented) {
          return;
        }
      }
    }
  };
}
