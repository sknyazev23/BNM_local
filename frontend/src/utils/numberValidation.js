
export function validateNonNegativeTwoDecimals(val) {
  if (/^\d*\.?\d{0,2}$/.test(val)) {
    const num = parseFloat(val);
    if (val === "" || (!isNaN(num) && num >= 0)) {
      return val;
    }
  }
  return null;
}

// ТОЛЬКО 0-9 и одна точка; до 4 знаков после точки
export function onlyPositiveDecimal4(e) {
  const key = e.key;

  // Разрешаем служебные клавиши
  const controlKeys = [
    'Backspace','Delete','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'
  ];
  if (controlKeys.includes(key)) return;

  // Разрешаем только цифры и точку
  const isDigit = /^[0-9]$/.test(key);
  const isDot = key === '.';
  if (!isDigit && !isDot) {
    e.preventDefault();
    return;
  }

  const input = e.currentTarget;
  const value = input.value;
  const selStart = input.selectionStart ?? value.length;
  const selEnd = input.selectionEnd ?? value.length;
  const hasSelection = selStart !== selEnd;

  // Только одна точка (если уже есть и не затираем её выделением)
  if (isDot) {
    if (value.includes('.') && !(hasSelection && value.slice(selStart, selEnd).includes('.'))) {
      e.preventDefault();
      return;
    }
    // В пустом поле превращаем '.' в '0.'
    if (!value && selStart === 0) {
      e.preventDefault();
      input.setRangeText('0.', selStart, selEnd, 'end');
    }
    return;
  }

  // Ограничиваем 4 знаками после точки
  const dotIndex = value.indexOf('.');
  if (dotIndex !== -1) {
    const caretAfterDot = selStart > dotIndex || (hasSelection && selEnd > dotIndex);
    if (caretAfterDot) {
      const frac = value.slice(dotIndex + 1);
      const replacingInFrac = hasSelection && value.slice(selStart, selEnd).length > 0;
      if (frac.length >= 4 && !replacingInFrac) {
        e.preventDefault();
        return;
      }
    }
  }
}


export function blockPaste(e) {
  e.preventDefault();
}

// На blur форматируем до ровно 4 знаков (без «страховок»)
export const decimal4Blur = (setter) => (e) => {
  const raw = e.currentTarget.value;
  if (!raw) return setter('');
  setter(Number(raw).toFixed(4));
};

// onChange без фильтрации — вся фильтрация на onKeyDown
export const decimal4Change = (setter) => (e) => {
  setter(e.target.value);
};
