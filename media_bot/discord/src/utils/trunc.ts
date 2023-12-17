export const trunc = (str: string, length = 50) => (str.length > length ? `${str.slice(0, length)}...` : str);
