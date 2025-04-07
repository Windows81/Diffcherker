const getHerokuUrl = () =>
  `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;

const createWebUrl = (url = '/'): string => {
  return `${process.env.NEXT_PUBLIC_WEB_URL || getHerokuUrl()}${url}`;
};

export default createWebUrl;
