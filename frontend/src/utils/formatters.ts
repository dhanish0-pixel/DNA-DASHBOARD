/**
 * Format number to Indian Numbering System currency (₹)
 * e.g., 1234567.89 -> ₹12,34,567.89
 */
export function formatINR(amount: number | string | null | undefined, includeDecimals = true): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0.00';
  }

  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const [intStr, decStr] = absNum.toFixed(2).split('.');

  let result = '';
  if (intStr.length <= 3) {
    result = intStr;
  } else {
    const last3 = intStr.slice(-3);
    let remaining = intStr.slice(0, -3);
    const groups: string[] = [];
    while (remaining.length > 2) {
      groups.unshift(remaining.slice(-2));
      remaining = remaining.slice(0, -2);
    }
    if (remaining.length > 0) {
      groups.unshift(remaining);
    }
    result = `${groups.join(',')},${last3}`;
  }

  const formatted = includeDecimals ? `${result}.${decStr}` : result;
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatINRShort(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }
  const num = Number(amount);
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 10000000) {
    return `${sign}₹${(absNum / 10000000).toFixed(2)} Cr`;
  }
  if (absNum >= 100000) {
    return `${sign}₹${(absNum / 100000).toFixed(2)} L`;
  }
  if (absNum >= 1000) {
    return `${sign}₹${(absNum / 1000).toFixed(1)} K`;
  }
  return `${sign}₹${absNum.toFixed(0)}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export function getStockStatusConfig(status: StockStatus | string) {
  switch (status) {
    case 'IN_STOCK':
      return {
        label: 'In Stock',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        color: '#10B981',
      };
    case 'LOW_STOCK':
      return {
        label: 'Low Stock',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        color: '#F59E0B',
      };
    case 'OUT_OF_STOCK':
    default:
      return {
        label: 'Out of Stock',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
        color: '#EF4444',
      };
  }
}
