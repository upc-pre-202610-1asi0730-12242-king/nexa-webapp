export const creditLimit = (client = {}) => Number(client.monthlyCreditLimit ?? client.creditLimit ?? 0);
export const creditUsed = (client = {}) => Number(client.monthlyCreditUsed ?? client.creditUsed ?? 0);
export const creditAvailable = (client = {}) => Math.max(0, creditLimit(client) - creditUsed(client));

function currentCreditPeriod() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

function currentCreditDueDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0)).toISOString().slice(0, 10);
}

export function creditPercent(client = {}) {
  const limit = creditLimit(client);
  if (!limit) return 0;
  return Math.min(100, Math.round((creditUsed(client) / limit) * 100));
}

export function creditStatus(client = {}) {
  if (client.monthlyCreditStatus) return client.monthlyCreditStatus;
  if (client.creditStatus) return client.creditStatus;
  if (creditLimit(client) && creditUsed(client) >= creditLimit(client)) return 'blocked';
  if (creditPercent(client) >= 85) return 'attention';
  return 'ok';
}

const creditStatusLabels = {
  en: {
    ok: 'Credit OK',
    attention: 'Credit attention',
    document_pending: 'Document pending',
    inactive: 'Inactive',
    overdue: 'Overdue',
    blocked: 'Blocked',
  },
  es: {
    ok: 'Crédito OK',
    attention: 'Crédito en atención',
    document_pending: 'Documento pendiente',
    inactive: 'Inactivo',
    overdue: 'Vencido',
    blocked: 'Bloqueado',
  },
};

export function creditStatusLabel(status = 'ok', locale) {
  const activeLocale = locale || (typeof localStorage !== 'undefined' && localStorage.getItem('nexa.lang') === 'es' ? 'es' : 'en');
  return creditStatusLabels[activeLocale]?.[status]
    || creditStatusLabels.en[status]
    || String(status).replace(/_/g, ' ');
}

export function creditBadgeClass(status = 'ok') {
  return ({
    ok: 'badge-green',
    attention: 'badge-amber',
    document_pending: 'badge-blue',
    inactive: 'badge-gray',
    overdue: 'badge-red',
    blocked: 'badge-red',
  }[status] || 'badge-gray');
}

export function creditBarColor(client = {}) {
  const status = creditStatus(client);
  if (status === 'blocked' || status === 'overdue') return '#EF4444';
  if (status === 'attention' || creditPercent(client) >= 80) return '#F59E0B';
  return '#22C55E';
}

export function creditSummary(client = {}) {
  const limit = creditLimit(client);
  const used = creditUsed(client);
  const due = Number(client.monthlyCreditDue ?? client.creditDue ?? used);
  const status = creditStatus(client);
  return {
    limit,
    used,
    available: Math.max(0, limit - used),
    due,
    percent: creditPercent(client),
    status,
    statusLabel: creditStatusLabel(status),
    badgeClass: creditBadgeClass(status),
    barColor: creditBarColor(client),
    period: client.creditPeriod || client.monthlyCreditPeriod || currentCreditPeriod(),
    dueDate: client.creditDueDate || client.monthlyCreditDueDate || currentCreditDueDate(),
  };
}
