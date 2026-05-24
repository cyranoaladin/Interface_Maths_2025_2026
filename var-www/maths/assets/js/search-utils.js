export function normalize(str) {
  return (str || '').toString().normalize('NFD').replace(/\p{Diacritic}+/gu, '').toLowerCase();
}
