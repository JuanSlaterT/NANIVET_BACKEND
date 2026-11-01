const ACCESS_COOKIE = 'nanivet_access';
const REFRESH_COOKIE = 'nanivet_refresh';

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return cookies;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function cookieOptions(maxAge, path) {
  const production = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: production || process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'strict',
    maxAge,
    path,
  };
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(
    Number(process.env.COOKIE_ACCESS_MAX_AGE_MS || 15 * 60 * 1000),
    '/api',
  ));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(
    Number(process.env.COOKIE_REFRESH_MAX_AGE_MS || 7 * 24 * 60 * 60 * 1000),
    '/api/auth',
  ));
}

function clearAuthCookies(res) {
  const access = cookieOptions(0, '/api');
  const refresh = cookieOptions(0, '/api/auth');
  res.clearCookie(ACCESS_COOKIE, access);
  res.clearCookie(REFRESH_COOKIE, refresh);
}

function accessTokenFrom(req) {
  const cookies = parseCookies(req.headers.cookie);
  const header = req.headers.authorization;
  return cookies[ACCESS_COOKIE] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
}

function refreshTokenFrom(req) {
  const cookies = parseCookies(req.headers.cookie);
  const header = req.headers.authorization;
  return cookies[REFRESH_COOKIE] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
}

module.exports = {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  setAuthCookies,
  clearAuthCookies,
  accessTokenFrom,
  refreshTokenFrom,
};
