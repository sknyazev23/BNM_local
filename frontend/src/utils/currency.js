// пересчёт в AED по курсам из JobForm (строковые значения допустимы)
export function toAED(amount, currency, { AED_to_USD, RUB_to_USD, AED_to_EUR }) {
  const n = Number(amount || 0);
  const aedUsd = Number(AED_to_USD || 0); // 1 USD = aedUsd AED
  const rubUsd = Number(RUB_to_USD || 1); // 1 USD = rubUsd RUB
  const aedEur = Number(AED_to_EUR || 0); // 1 EUR = aedEur AED

  switch (currency) {
    case 'AED': return n;
    case 'USD': return n * aedUsd;
    case 'EUR': return n * aedEur;
    case 'RUB': return (n / rubUsd) * aedUsd; // RUB→USD→AED
    default:    return 0;
  }
}
