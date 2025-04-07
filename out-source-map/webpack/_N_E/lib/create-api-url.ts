const createApiUrl = (url = '/'): string => {
  const prUrl = `https://${process.env.HEROKU_APP_NAME}.herokuapp.com/api`;
  return `${process.env.NEXT_PUBLIC_API_URL || prUrl}${url}`;
};

export default createApiUrl;
