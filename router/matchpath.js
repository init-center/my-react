import { pathToRegexp } from "path-to-regexp";

function getRegexp(path, options) {
  const keys = [];
  const result = pathToRegexp(path, keys, options);
  return {
    regexp: result,
    keys,
  };
}

export function matchPath(pathname, options = {}) {
  const { path, exact = false, strict = false, sensitive = false } = options;
  const { regexp, keys } = getRegexp(path, { end: exact, strict, sensitive });
  const match = regexp.exec(pathname);
  if (!match) return null;
  const [url, ...values] = match;

  const isExact = pathname === url;

  if (exact && !isExact) return null;

  return {
    path,
    url: path === "/" && url === "" ? "/" : url,
    isExact,
    params: keys.reduce((acc, key, index) => {
      acc[key.name] = values[index];
      return acc;
    }, {}),
  };
}
