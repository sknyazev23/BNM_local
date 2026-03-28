import React from 'react';

// 1 234 567.8900 (неразрывный пробел, 4 знака после точки)
export function format4(n) {
  const [int, frac] = Number(n).toFixed(4).split(".");
  const intSpaced = int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${intSpaced}.${frac}`;
}

// 1 234 567.89 (2 знака, математическое округление)
export function format2(n) {
  const [int, frac] = Number(n).toFixed(2).split(".");
  const intSpaced = int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${intSpaced}.${frac}`;
}
 
// Возвращает React-узел с уменьшенной дробной частью
export function formatTableNumber(n, decimals = 4) {
  const [int, frac] = Number(n || 0).toFixed(decimals).split(".");
  const intSpaced = int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  
  // Используем React.createElement вместо JSX, чтобы файл остался .js
  return React.createElement(
    React.Fragment,
    null,
    intSpaced,
    React.createElement("span", { className: "decimal-small" }, "." + frac)
  );
}
