// Currency formatter ($)
export const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Compact currency for big values: $12.3k
export const formatCurrencyCompact = (value) => {
  const num = Number(value) || 0;
  if (Math.abs(num) >= 1000) {
    return '$' + formatCompact(num);
  }
  return formatCurrency(num);
};

// 12.3k / 1.2M style formatting
export const formatCompact = (value) => {
  const num = Number(value) || 0;
  if (Math.abs(num) >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return String(num);
};

export const formatNumber = (value) =>
  new Intl.NumberFormat('en-US').format(Number(value) || 0);

export const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
