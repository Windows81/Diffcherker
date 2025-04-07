const generateUrl = (
  url: string,
  data: Record<string, unknown> | undefined,
): string => {
  if (!data) {
    return url;
  }
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return url;
  }
  return (
    url +
    '?' +
    keys
      .map((key) => {
        return [key, data[key]]
          .map((value: unknown) =>
            encodeURIComponent(value as string | number | boolean),
          )
          .join('=');
      })
      .join('&')
  );
};

export default generateUrl;
