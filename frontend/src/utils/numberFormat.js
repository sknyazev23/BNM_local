// 1 234 567.8900 (неразрывный пробел, 4 знака после точки)
export function format4(n) {
  const [int, frac] = Number(n).toFixed(4).split(".");
  const intSpaced = int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${intSpaced}.${frac}`;
}
