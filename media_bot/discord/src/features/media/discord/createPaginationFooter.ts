export const createPaginationFooter = (results: number, page: number, max: number) => {
  return `${results} Ergebnisse gefunden.\nSeite ${page} von ${max}`;
};
