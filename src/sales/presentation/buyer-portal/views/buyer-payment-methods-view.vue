<script setup>
import { computed, ref } from 'vue';
import { useAuthStore } from '@/iam/application/iam.store';
import { useDataStore } from '@/app/application/stores/data.store';
import ReferenceSelect from '@/shared/presentation/components/reference-select.vue';
import PaymentOptionCard from '@/invoicing/presentation/payments/components/payment-option-card.vue';
import { creditSummary } from '@/shared/credit';

const auth = useAuthStore();
const ds = useDataStore();
const selectedPaymentOption = ref('');
const statusFilter = ref('all');
const paymentMethodError = ref('');
const updatingMethodId = ref('');
const showAddMethod = ref(false);
const savingMethod = ref(false);
const methodType = ref('card');
const cardBrand = ref('Visa');
const lastFour = ref('');
const methodLabel = ref('');
const makeDefault = ref(true);

const clientId = computed(() => auth.user?.clientId || '');
const client = computed(() => ds.clientById(clientId.value));
const credit = computed(() => creditSummary(client.value || {}));
const paymentsBase = computed(() => {
  const rows = ds.D.creditPayments || [];
  if (!clientId.value) return rows;
  const scoped = rows.filter(payment => ds.clientRecordMatches(payment, clientId.value));
  return scoped.length ? scoped : rows;
});
const payments = computed(() => {
  if (statusFilter.value === 'all') return paymentsBase.value;
  if (statusFilter.value === 'confirmed') {
    return paymentsBase.value.filter(payment => ['paid', 'confirmed'].includes(String(payment.status).toLowerCase()));
  }
  return paymentsBase.value.filter(payment => !['paid', 'confirmed'].includes(String(payment.status).toLowerCase()));
});
const paymentMethods = computed(() => ds.paymentMethodsForClient(clientId.value));
const totalPaid = computed(() =>
  paymentsBase.value
    .filter(payment => ['paid', 'confirmed'].includes(String(payment.status).toLowerCase()))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
);
const totalPending = computed(() =>
  paymentsBase.value
    .filter(payment => !['paid', 'confirmed'].includes(String(payment.status).toLowerCase()))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
);
const nextDue = computed(() => paymentsBase.value.find(payment => !['paid', 'confirmed'].includes(String(payment.status).toLowerCase())));
const creditUsagePercent = computed(() => {
  if (!credit.value.limit) return 0;
  return Math.min(100, Math.round((credit.value.used / credit.value.limit) * 100));
});
const paymentChart = computed(() => {
  const rows = [
    { key: 'paid', label: 'Paid', value: totalPaid.value, color: '#16a34a' },
    { key: 'pending', label: 'Pending', value: totalPending.value, color: '#f59e0b' },
  ];
  const max = Math.max(...rows.map(row => row.value), 1);
  return rows.map(row => ({ ...row, percent: Math.max(row.value ? 8 : 0, Math.round((row.value / max) * 100)) }));
});
const recentPaymentChart = computed(() => {
  const rows = paymentsBase.value.slice(0, 6).map(payment => ({
    id: payment.id,
    label: payment.referenceCode || payment.id,
    value: Number(payment.amount || payment.total || 0),
  }));
  const max = Math.max(...rows.map(row => row.value), 1);
  return rows.map(row => ({ ...row, percent: Math.max(row.value ? 8 : 0, Math.round((row.value / max) * 100)) }));
});
const canAddMethod = computed(() => methodType.value === 'card'
  ? /^\d{4}$/.test(lastFour.value)
  : Boolean(methodLabel.value.trim()));
const statusOptions = [
  { key: 'all', label: 'All records' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'pending', label: 'Pending' },
];
const formatMoney = (value, currency = 'PEN') => `${currency} ${Number(value || 0).toFixed(2)}`;

async function selectPaymentMethod(method) {
  updatingMethodId.value = method.id;
  paymentMethodError.value = '';
  try {
    await ds.setDefaultPaymentMethod(method.id);
  } catch (error) {
    paymentMethodError.value = error?.response?.data?.message || error?.message || 'The default payment method could not be updated.';
  } finally {
    updatingMethodId.value = '';
  }
}

async function addPaymentMethod() {
  if (!canAddMethod.value || savingMethod.value) return;
  savingMethod.value = true;
  paymentMethodError.value = '';
  try {
    const label = methodType.value === 'card'
      ? `${cardBrand.value} •••• ${lastFour.value}`
      : methodLabel.value.trim();
    await ds.addPaymentMethod({
      clientId: clientId.value,
      type: methodType.value,
      label,
      isDefault: makeDefault.value,
    });
    showAddMethod.value = false;
    methodType.value = 'card';
    cardBrand.value = 'Visa';
    lastFour.value = '';
    methodLabel.value = '';
    makeDefault.value = false;
  } catch (error) {
    paymentMethodError.value = error?.response?.data?.message || error?.message || 'The payment method could not be added.';
  } finally {
    savingMethod.value = false;
  }
}
</script>

<template>
  <div class="payment-page">
    <div class="page-header">
      <div>
        <div class="page-title">Payments</div>
        <div class="page-subtitle">Credit line, pending balance, payment history and preferred payment references for this buyer account.</div>
      </div>
    </div>

    <section class="flow-panel payment-credit-panel">
      <div class="flow-panel-pad payment-credit-grid">
        <div>
          <div class="flow-eyebrow">Monthly credit</div>
          <div class="payment-credit-value">S/ {{ credit.limit.toLocaleString() }}</div>
          <div class="flow-note">Available S/ {{ credit.available.toLocaleString() }} of S/ {{ credit.limit.toLocaleString() }}.</div>
          <div class="payment-meter" aria-label="Credit usage">
            <span :style="{ width: creditUsagePercent + '%' }"></span>
          </div>
        </div>
        <div class="payment-next-card">
          <div class="flow-eyebrow">Next payment</div>
          <strong>{{ nextDue ? formatMoney(nextDue.amount || nextDue.total, nextDue.currency) : 'No pending payment' }}</strong>
          <span>{{ nextDue?.referenceCode || credit.period || 'Credit line clear' }}</span>
        </div>
        <div class="payment-next-card">
          <div class="flow-eyebrow">Payment option</div>
          <ReferenceSelect v-model="selectedPaymentOption" resource="payment-options" placeholder="Reference payment option" />
          <span>Use this to prepare the next request payment preference.</span>
        </div>
      </div>
    </section>

    <div class="grid-3" style="margin-bottom:18px">
      <div class="card kpi-card">
        <div class="kpi-label"><i class="pi pi-check-circle" style="color:#16A34A"></i> Paid</div>
        <div class="kpi-value" style="color:#16A34A">S/ {{ totalPaid.toFixed(2) }}</div>
        <div class="kpi-sub">Confirmed payment records</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label"><i class="pi pi-clock" style="color:#F59E0B"></i> Pending</div>
        <div class="kpi-value" style="color:#F59E0B">S/ {{ totalPending.toFixed(2) }}</div>
        <div class="kpi-sub">Pending payment records</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label"><i class="pi pi-credit-card" style="color:#2563EB"></i> Records</div>
        <div class="kpi-value" style="color:#2563EB">{{ paymentsBase.length }}</div>
        <div class="kpi-sub">Workspace payment records</div>
      </div>
    </div>

    <section class="payment-insights-grid" aria-label="Payment insights">
      <article class="flow-panel payment-chart-panel">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">Payment balance</div>
            <div class="flow-subtitle">Confirmed versus pending amount.</div>
          </div>
        </div>
        <div class="flow-panel-pad payment-bars">
          <div v-for="row in paymentChart" :key="row.key" class="payment-bar-row">
            <div class="flow-row-between"><strong>{{ row.label }}</strong><span>{{ formatMoney(row.value) }}</span></div>
            <div class="payment-bar-track"><span :style="{ width: row.percent + '%', background: row.color }"></span></div>
          </div>
        </div>
      </article>
      <article class="flow-panel payment-chart-panel">
        <div class="flow-panel-head">
          <div>
            <div class="flow-title">Recent payment activity</div>
            <div class="flow-subtitle">Relative amount by payment reference.</div>
          </div>
        </div>
        <div class="flow-panel-pad payment-bars">
          <div v-for="row in recentPaymentChart" :key="row.id" class="payment-bar-row compact">
            <div class="flow-row-between"><span class="mono">{{ row.label }}</span><strong>{{ formatMoney(row.value) }}</strong></div>
            <div class="payment-bar-track"><span :style="{ width: row.percent + '%' }"></span></div>
          </div>
          <div v-if="!recentPaymentChart.length" class="flow-note">No payment activity available.</div>
        </div>
      </article>
    </section>

    <section class="flow-panel">
      <div class="flow-panel-head">
        <div>
          <div class="flow-title">Payment Records</div>
          <div class="flow-subtitle">Tenant-scoped payments from Nexa Invoicing.</div>
        </div>
        <div class="flow-row">
          <button
            v-for="option in statusOptions"
            :key="option.key"
            class="btn btn-sm"
            :class="statusFilter === option.key ? 'btn-primary' : 'btn-ghost'"
            type="button"
            @click="statusFilter = option.key"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Invoice</th>
            <th>Order</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in payments" :key="payment.id">
            <td><span class="mono">{{ payment.referenceCode || payment.id }}</span></td>
            <td><span class="mono">{{ payment.invoiceId || 'Core payment' }}</span></td>
            <td><span class="mono">{{ payment.orderId || 'Pending relation' }}</span></td>
            <td style="font-weight:700">{{ formatMoney(payment.amount || payment.total, payment.currency) }}</td>
            <td>
              <span :class="'badge ' + (['paid', 'confirmed'].includes(String(payment.status).toLowerCase()) ? 'badge-green' : 'badge-amber')">
                {{ payment.status }}
              </span>
            </td>
          </tr>
          <tr v-if="!payments.length">
            <td colspan="5">
              <div class="empty-state compact">
                <div class="empty-state-icon"><i class="pi pi-credit-card"></i></div>
                <div class="empty-state-title">No payment records</div>
                <div class="empty-state-desc">No records match the current filter.</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="flow-panel" style="margin-top:18px">
      <div class="flow-panel-head">
        <div>
          <div class="flow-title">Payment Methods</div>
          <div class="flow-subtitle">Cards and payment references linked to this buyer account.</div>
        </div>
        <button class="btn btn-primary btn-sm" type="button" @click="showAddMethod = !showAddMethod">
          <i :class="showAddMethod ? 'pi pi-times' : 'pi pi-plus'"></i>
          {{ showAddMethod ? 'Cancel' : 'Add payment method' }}
        </button>
      </div>
      <div class="flow-panel-pad">
        <div v-if="paymentMethodError" class="banner banner-danger" role="alert">{{ paymentMethodError }}</div>
        <form v-if="showAddMethod" class="payment-method-form" @submit.prevent="addPaymentMethod">
          <label class="field">
            <span class="field-label">Method type</span>
            <select v-model="methodType" class="plain-input">
              <option value="card">Credit or debit card</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="cash">Cash agreement</option>
            </select>
          </label>
          <label v-if="methodType === 'card'" class="field">
            <span class="field-label">Card brand</span>
            <select v-model="cardBrand" class="plain-input">
              <option>Visa</option>
              <option>Mastercard</option>
              <option>American Express</option>
            </select>
          </label>
          <label v-if="methodType === 'card'" class="field">
            <span class="field-label">Last 4 digits</span>
            <input v-model="lastFour" class="plain-input" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="1234" />
            <small>Only a masked card reference is stored. Nexa never stores the full card number.</small>
          </label>
          <label v-else class="field">
            <span class="field-label">Reference label</span>
            <input v-model="methodLabel" class="plain-input" maxlength="80" placeholder="BCP transfer account" />
          </label>
          <label class="payment-default-check">
            <input v-model="makeDefault" type="checkbox" />
            <span>Use as default payment method</span>
          </label>
          <button class="btn btn-primary" type="submit" :disabled="!canAddMethod || savingMethod">
            <i :class="savingMethod ? 'pi pi-spin pi-spinner' : 'pi pi-save'"></i>
            {{ savingMethod ? 'Saving...' : 'Save payment method' }}
          </button>
        </form>
        <div class="nexa-select-grid">
          <PaymentOptionCard
            v-for="method in paymentMethods"
            :key="method.id"
            :method="method"
            :active="method.isDefault"
            :disabled="updatingMethodId === method.id"
            @select="selectPaymentMethod(method)"
          />
        </div>
        <div v-if="!paymentMethods.length" class="empty-state compact">
          <div class="empty-state-icon"><i class="pi pi-wallet"></i></div>
          <div class="empty-state-title">No payment methods</div>
          <div class="empty-state-desc">No payment method references are available for this buyer.</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.payment-credit-panel {
  margin-bottom: 18px;
}
.payment-credit-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(240px, .8fr) minmax(260px, .8fr);
  gap: 16px;
  align-items: stretch;
}
.payment-credit-value {
  color: #0f172a;
  font-size: clamp(28px, 3vw, 42px);
  font-weight: 900;
  line-height: 1;
  margin: 8px 0;
}
.payment-meter {
  height: 12px;
  margin-top: 16px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}
.payment-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #16a34a);
}
.payment-next-card {
  display: grid;
  gap: 8px;
  align-content: center;
  border: 1px solid #dbe5f2;
  border-radius: 8px;
  background: #f8fafc;
  padding: 16px;
}
.payment-next-card strong {
  color: #0f172a;
  font-size: 20px;
}
.payment-next-card span {
  color: #64748b;
  font-size: 12px;
  font-weight: 760;
}
.payment-insights-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 18px;
}
.payment-bars {
  display: grid;
  gap: 16px;
}
.payment-bar-row {
  display: grid;
  gap: 8px;
}
.payment-bar-row.compact {
  gap: 5px;
}
.payment-bar-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}
.payment-bar-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
}
.payment-method-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
  padding: 16px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
}
.payment-method-form small {
  color: #64748b;
  font-size: 11px;
}
.payment-default-check {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #334155;
  font-size: 13px;
  font-weight: 750;
}
@media (max-width: 980px) {
  .payment-credit-grid {
    grid-template-columns: 1fr;
  }
  .payment-insights-grid,
  .payment-method-form {
    grid-template-columns: 1fr;
  }
}
</style>
