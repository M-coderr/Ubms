// uBMS Core Data & State Management Layer (Comprehensive ERP & OMS Architecture)
window.uBMS = window.uBMS || {};

const STAGES = [
  { key: 'pending', label: 'Pending Approval', color: 'amber', icon: 'clock' },
  { key: 'approved', label: 'Approved', color: 'emerald', icon: 'check-circle' },
  { key: 'rejected', label: 'Rejected', color: 'rose', icon: 'x-circle' },
  { key: 'in_production', label: 'In Production', color: 'sky', icon: 'cog' },
  { key: 'ready_dispatch', label: 'Quality Check / Ready', color: 'purple', icon: 'package' },
  { key: 'shipped', label: 'Dispatched / In Transit', color: 'orange', icon: 'truck' },
  { key: 'delivered', label: 'Delivered', color: 'emerald', icon: 'check' },
  { key: 'cancelled', label: 'Cancelled', color: 'rose', icon: 'x-circle' },
  { key: 'placed', label: 'Pending Approval', color: 'amber', icon: 'clock' },
  { key: 'confirmed', label: 'Approved', color: 'emerald', icon: 'check-circle' }
];

const ROLES = {
  admin: {
    name: 'Super Admin / Owner',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Full access to all orders, invoices, financial ledgers, staff payroll, and system settings.',
    permissions: ['all']
  },
  manager: {
    name: 'Operations Manager',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Manage all orders, create invoices, assign staff, production flow, and handle chat.',
    permissions: ['orders_all', 'invoices_manage', 'production_manage', 'chat_manage', 'assign_staff']
  },
  fulfillment: {
    name: 'Production & Dispatch Lead',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Manage job cards, workstation status, production line progress, and dispatch packing.',
    permissions: ['production_manage', 'orders_assigned', 'status_update']
  },
  support: {
    name: 'Customer Support Rep',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Account management, order lookups, customer chat, and client inquiries.',
    permissions: ['orders_view', 'chat_manage', 'customers_view']
  }
};

// Generic helper to fetch collection with cache
async function fetchEntity(endpoint, defaultData) {
  try {
    const res = await fetch(`/api/${endpoint}`);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(`ubms_${endpoint}`, JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.warn(`API /api/${endpoint} unavailable, using cached/static data`, e);
  }
  const cached = localStorage.getItem(`ubms_${endpoint}`);
  if (cached) return JSON.parse(cached);
  return defaultData;
}

// Generic helper to save collection
async function saveEntity(endpoint, data) {
  localStorage.setItem(`ubms_${endpoint}`, JSON.stringify(data));
  try {
    await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.warn(`Could not sync ${endpoint} to server file system`, e);
  }
}

const DataService = {
  fetchOrders: () => fetchEntity('orders', []),
  saveOrders: (data) => saveEntity('orders', data),

  fetchUsers: () => fetchEntity('users', { team: [], customers: [] }),
  saveUsers: (data) => saveEntity('users', data),

  fetchProducts: () => fetchEntity('products', []),
  saveProducts: (data) => saveEntity('products', data),

  fetchEstimates: () => fetchEntity('estimates', []),
  saveEstimates: (data) => saveEntity('estimates', data),

  fetchInvoices: () => fetchEntity('invoices', []),
  saveInvoices: (data) => saveEntity('invoices', data),

  fetchPayments: () => fetchEntity('payments', []),
  savePayments: (data) => saveEntity('payments', data),

  fetchProduction: () => fetchEntity('production', []),
  saveProduction: (data) => saveEntity('production', data),

  fetchPayroll: () => fetchEntity('payroll', { staffSummary: [], dailyAttendance: [] }),
  savePayroll: (data) => saveEntity('payroll', data),

  fetchMessages: () => fetchEntity('messages', []),
  saveMessages: (data) => saveEntity('messages', data),

  fetchLabelTypes: () => fetchEntity('label_types', [
    { id: 'TYPE-TAG', name: 'Tag', materials: ['100 GSM', '200 GSM', '300 GSM'], defaultRate: 2.50 },
    { id: 'TYPE-PULABEL', name: 'PU Label', materials: ['1.2', '1.8', '2.2'], defaultRate: 14.00 }
  ]),
  saveLabelTypes: (data) => saveEntity('label_types', data)
};

// Financial Calculations & Ledger Engine
function computeCustomerGeneralLedger(customerId, invoices = [], payments = []) {
  // Filter for this customer
  const custInvoices = invoices.filter(i => i.customerId === customerId);
  const custPayments = payments.filter(p => p.customerId === customerId);

  // Combine into single ledger journal
  const entries = [];

  custInvoices.forEach(inv => {
    entries.push({
      id: inv.id,
      date: inv.issueDate,
      type: 'Invoice / Debit',
      refNo: inv.id,
      particulars: `Sales Invoice against Order ${inv.orderId || 'N/A'}`,
      debit: Number(inv.total) || 0,
      credit: 0
    });
  });

  custPayments.forEach(pay => {
    entries.push({
      id: pay.id,
      date: pay.date,
      type: 'Payment / Credit',
      refNo: pay.referenceNumber || pay.id,
      particulars: `Payment Received (${pay.paymentMode}) against ${pay.invoiceId || 'Account'}`,
      debit: 0,
      credit: Number(pay.amount) || 0
    });
  });

  // Sort chronologically
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Compute running balance
  let runningBalance = 0;
  const journal = entries.map(entry => {
    runningBalance += (entry.debit - entry.credit);
    return {
      ...entry,
      balance: runningBalance
    };
  });

  const totalDebited = custInvoices.reduce((acc, i) => acc + (Number(i.total) || 0), 0);
  const totalCredited = custPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const closingBalance = totalDebited - totalCredited;

  return {
    journal,
    totalDebited,
    totalCredited,
    closingBalance
  };
}

function computeOutstandingLedger(customerId, invoices = []) {
  const custInvoices = invoices.filter(i => i.customerId === customerId && i.balanceDue > 0);
  const now = new Date();

  let totalOutstanding = 0;
  let aging0to30 = 0;
  let aging31to60 = 0;
  let aging60Plus = 0;

  const bills = custInvoices.map(inv => {
    const due = Number(inv.balanceDue) || 0;
    totalOutstanding += due;

    const issueDate = new Date(inv.issueDate);
    const diffDays = Math.floor((now - issueDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      aging0to30 += due;
    } else if (diffDays <= 60) {
      aging31to60 += due;
    } else {
      aging60Plus += due;
    }

    return {
      ...inv,
      overdueDays: Math.max(0, diffDays)
    };
  });

  return {
    bills,
    totalOutstanding,
    aging0to30,
    aging31to60,
    aging60Plus
  };
}

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(isoOrDateStr) {
  if (!isoOrDateStr) return 'N/A';
  try {
    const d = new Date(isoOrDateStr);
    if (isNaN(d.getTime())) return isoOrDateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return isoOrDateStr;
  }
}

window.uBMS.STAGES = STAGES;
window.uBMS.ROLES = ROLES;
window.uBMS.DataService = DataService;
window.uBMS.computeCustomerGeneralLedger = computeCustomerGeneralLedger;
window.uBMS.computeOutstandingLedger = computeOutstandingLedger;
window.uBMS.formatCurrency = formatCurrency;
window.uBMS.formatDate = formatDate;
