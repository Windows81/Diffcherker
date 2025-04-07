const createLogger = (name: string) => {
  return {
    info: (...args: Parameters<typeof console.log>) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${name}]`, ...args);
      }
    },
    // Later on we can extend this to warning or error 
  };
};

export const excelLogger = createLogger("EXCEL");

export const devLog = (...args: Parameters<typeof console.log>) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV]', ...args);
  }
};
