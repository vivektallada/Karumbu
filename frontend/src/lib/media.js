export const mediaUrl = (src) =>
  src?.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${src}` : src;
