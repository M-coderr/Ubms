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
  },
  printing: {
    name: 'Printing Press Operator',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Mobile operator view: Start printing, record printed sheets & wastage.',
    permissions: ['printing_operator']
  },
  punching: {
    name: 'Punching & Packing Operator',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Mobile operator view: Start die-punching & packing, log punched count.',
    permissions: ['punching_operator']
  },
  labourer: {
    name: 'Handwork Artisan (Dori & Plastic)',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Mobile handwork view: View assigned batches, start & complete dori/plastic assembly.',
    permissions: ['handwork_worker']
  }
};

const HANDWORK_DEFAULTS = {
  doriRate: 0.20,
  plasticRate: 0.10,
  bufferSheetsPerProcess: 20,
  allowedDeficitMax: 40 // for 1000 order, 960 is minimum allowed (1000 - 40)
};

// Generic helper to fetch collection with cache
async function fetchEntity(endpoint, defaultData) {
  const parseCleanJson = (rawText) => {
    if (!rawText || typeof rawText !== 'string') return null;
    const clean = rawText.replace(/^\uFEFF/, '').trim();
    return JSON.parse(clean);
  };

  try {
    const res = await fetch(`/api/${endpoint}?_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      const data = parseCleanJson(text);
      if (data) {
        localStorage.setItem(`ubms_${endpoint}`, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    console.warn(`API /api/${endpoint} unavailable, checking static fallback`, e);
  }

  try {
    const resStatic = await fetch(`data/${endpoint}.json?_t=${Date.now()}`, { cache: 'no-store' });
    if (resStatic.ok) {
      const textStatic = await resStatic.text();
      const dataStatic = parseCleanJson(textStatic);
      if (dataStatic) {
        localStorage.setItem(`ubms_${endpoint}`, JSON.stringify(dataStatic));
        return dataStatic;
      }
    }
  } catch (e2) {}

  try {
    const cached = localStorage.getItem(`ubms_${endpoint}`);
    if (cached) return parseCleanJson(cached);
  } catch (e3) {}

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
  saveLabelTypes: (data) => saveEntity('label_types', data),

  fetchCatalogs: () => fetchEntity('catalogs', []),
  saveCatalogs: (data) => saveEntity('catalogs', data),

  fetchInventory: () => fetchEntity('inventory', []),
  saveInventory: (data) => saveEntity('inventory', data),

  fetchProductionCycles: () => fetchEntity('production_cycles', [
    {
      id: 'CYCLE-STD-5',
      name: 'Standard 5-Step Tag Cycle',
      isDefault: true,
      steps: [
        { key: 'cutting', name: 'Paper Cutting', stepNumber: 1, description: 'Guillotine sheet cutting & sizing' },
        { key: 'printing', name: 'Printing', stepNumber: 2, description: 'Offset / digital press ink application' },
        { key: 'punching', name: 'Punching & Packing', stepNumber: 3, description: 'Die-cutting, creasing & stripping' },
        { key: 'handwork', name: 'Handwork Process', stepNumber: 4, description: 'Dori attachment & plastic seal lock' },
        { key: 'dispatch', name: 'Dispatch', stepNumber: 5, description: 'Quality check & dispatch packing' }
      ]
    }
  ]),
  saveProductionCycles: (data) => saveEntity('production_cycles', data)
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

// Generate customer abbreviation code (e.g. "MG Creation" -> "MGC", "Raymond" -> "RAY")
function generateCustomerAbbr(companyOrName) {
  if (!companyOrName) return 'ITM';
  if (typeof companyOrName === 'object') {
    if (companyOrName.abbr) return companyOrName.abbr;
    companyOrName = companyOrName.company || companyOrName.name;
  }
  const clean = String(companyOrName).replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'ITM';

  const known = {
    'MG CREATION': 'MGC',
    'AARIYA CREATION': 'ARC',
    'TAGX': 'TGX',
    'D TAG': 'DTAG'
  };
  const upper = clean.toUpperCase();
  if (known[upper]) return known[upper];

  let abbr = '';
  if (words.length === 1) {
    abbr = words[0].slice(0, 3).toUpperCase();
  } else {
    if (words[0].length <= 3 && words[0] === words[0].toUpperCase()) {
      abbr = words[0] + words.slice(1).map(w => w[0].toUpperCase()).join('');
    } else {
      abbr = words.map(w => w[0].toUpperCase()).join('');
    }
  }

  abbr = abbr.replace(/[^A-Z0-9]/g, '');
  if (abbr.length > 4) abbr = abbr.slice(0, 4);
  if (abbr.length < 2) abbr = (clean.slice(0, 3)).toUpperCase();
  return abbr || 'ITM';
}

// Generate customer-side order ID (e.g. "MGC01", "MGC02", "ARC01")
function getNextCustomerOrderId(customerOrCompanyOrAbbr, orders = []) {
  let abbr = 'ITM';
  if (typeof customerOrCompanyOrAbbr === 'string') {
    abbr = generateCustomerAbbr(customerOrCompanyOrAbbr);
  } else if (customerOrCompanyOrAbbr && typeof customerOrCompanyOrAbbr === 'object') {
    abbr = customerOrCompanyOrAbbr.abbr || generateCustomerAbbr(customerOrCompanyOrAbbr.company || customerOrCompanyOrAbbr.name);
  }

  let maxNum = 0;
  // Match MGC01 at the end of order ID or in customerOrderId: e.g. TGRS01-ORD-2026-MGC01 or MGC01 or ORD-MGC01
  const regex = new RegExp(`(?:^|[-_])${abbr}[-_]?([0-9]+)$`, 'i');

  (orders || []).forEach(o => {
    if (!o) return;
    const cid = o.customerOrderId || o.id || '';
    const match = cid.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });

  const nextNum = maxNum + 1;
  return `${abbr}${String(nextNum).padStart(2, '0')}`;
}

// Generate full Admin master order ID: TGRS01-ORD-2026-MGC01
function getNextAdminOrderId(customerOrCompanyOrAbbr, orders = []) {
  const custOrderId = getNextCustomerOrderId(customerOrCompanyOrAbbr, orders);
  
  let maxGlobal = 0;
  const tgrsRegex = /^TGRS([0-9]+)/i;

  (orders || []).forEach(o => {
    if (!o) return;
    const match = (o.id || '').match(tgrsRegex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxGlobal) {
        maxGlobal = num;
      }
    }
  });

  if (maxGlobal === 0 && Array.isArray(orders) && orders.length > 0) {
    maxGlobal = orders.length;
  }

  const nextGlobal = maxGlobal + 1;
  const year = 2026;
  return `TGRS${String(nextGlobal).padStart(2, '0')}-ORD-${year}-${custOrderId}`;
}

// Generate unique sequential item code for a customer (e.g. "MGC01", "MGC02")
function getNextItemCode(abbr, orders = [], stagedItems = []) {
  if (!abbr) abbr = 'ITM';
  let maxNum = 0;
  const regex = new RegExp(`^${abbr}[-_]?(\\d+)$`, 'i');

  const checkItem = (item) => {
    if (!item) return;
    const code = item.itemCode || item.name || '';
    const match = code.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  };

  (orders || []).forEach(o => (o.items || []).forEach(checkItem));
  (stagedItems || []).forEach(checkItem);

  const nextNum = maxNum + 1;
  return `${abbr}${String(nextNum).padStart(2, '0')}`;
}

window.uBMS.STAGES = STAGES;
window.uBMS.ROLES = ROLES;
window.uBMS.HANDWORK_DEFAULTS = HANDWORK_DEFAULTS;
window.uBMS.DataService = DataService;
window.uBMS.computeCustomerGeneralLedger = computeCustomerGeneralLedger;
window.uBMS.computeOutstandingLedger = computeOutstandingLedger;
window.uBMS.formatCurrency = formatCurrency;
window.uBMS.formatDate = formatDate;
window.uBMS.generateCustomerAbbr = generateCustomerAbbr;
window.uBMS.getNextItemCode = getNextItemCode;
window.uBMS.getNextCustomerOrderId = getNextCustomerOrderId;
window.uBMS.getNextAdminOrderId = getNextAdminOrderId;
window.uBMS.getNextOrderId = getNextAdminOrderId;


// Format Item Name according to formula: {Customer Abrevation}_{item_type}_{Brand Name}_{x}
function formatItemName(customerAbbr, itemType, brandName, itemIndex) {
  const abbr = (customerAbbr || 'ITM').trim().toUpperCase();
  const cleanType = (itemType || 'Item').trim().replace(/\s+/g, '_');
  const cleanBrand = (brandName && brandName.trim()) ? brandName.trim().replace(/\s+/g, '_') : 'Brand';
  const index = itemIndex || 1;
  return `${abbr}_${cleanType}_${cleanBrand}_${index}`;
}

// Calculate increasing number variable 'x' for items per customer
function getCustomerNextItemIndex(customer, orders = [], stagedItems = []) {
  if (!customer) return 1;
  const custId = customer.id;
  const custEmail = customer.email;
  const custName = customer.name;
  const custCompany = customer.company;
  const custAbbr = customer.abbr || generateCustomerAbbr(custCompany || custName);

  let maxIndex = 0;
  let totalCustomerItems = 0;

  // Regex to match item names ending in _(\d+) or formatted as {abbr}_{type}_{brand}_{x}
  const patternRegex = new RegExp(`^${custAbbr}_.+_(\\d+)$`, 'i');
  const genericIndexRegex = /_(\d+)$/;

  const inspectItem = (item) => {
    if (!item) return;
    totalCustomerItems++;
    const name = item.name || item.itemName || item.itemCode || '';

    const exactMatch = name.match(patternRegex);
    if (exactMatch) {
      const val = parseInt(exactMatch[1], 10);
      if (!isNaN(val) && val > maxIndex) {
        maxIndex = val;
      }
      return;
    }

    const genericMatch = name.match(genericIndexRegex);
    if (genericMatch) {
      const val = parseInt(genericMatch[1], 10);
      if (!isNaN(val) && val > maxIndex) {
        maxIndex = val;
      }
    }
  };

  (orders || []).forEach(o => {
    const isThisCust = (custId && o.customerId === custId) ||
                       (custEmail && o.customerEmail === custEmail) ||
                       (custName && o.customerName === custName) ||
                       (custCompany && o.customerCompany === custCompany);
    if (isThisCust && Array.isArray(o.items)) {
      o.items.forEach(inspectItem);
    }
  });

  (stagedItems || []).forEach(inspectItem);

  return Math.max(maxIndex + 1, totalCustomerItems + 1);
}

window.uBMS.formatItemName = formatItemName;
window.uBMS.getCustomerNextItemIndex = getCustomerNextItemIndex;

// --- TWO-TIER NAVIGATION ARCHITECTURE (Left Groups + Top Sub-Nav) ---
const CUSTOMER_NAV_GROUPS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    defaultTab: 'dashboard',
    tabs: [
      { key: 'dashboard', label: 'Dashboard Overview' }
    ]
  },
  {
    id: 'orders',
    label: 'Orders',
    defaultTab: 'order_register',
    tabs: [
      { key: 'place_order', label: 'Place Order' },
      { key: 'order_register', label: 'Order Register' }
    ]
  },
  {
    id: 'billing',
    label: 'Billing',
    defaultTab: 'invoice_register',
    tabs: [
      { key: 'invoice_register', label: 'Invoice Register' },
      { key: 'outstanding_ledger', label: 'Outstanding Ledger' },
      { key: 'general_ledger', label: 'General Ledger' }
    ]
  },
  {
    id: 'support',
    label: 'Support',
    defaultTab: 'chat',
    tabs: [
      { key: 'chat', label: 'Chat with Acc Manager' }
    ]
  }
];

const ADMIN_NAV_GROUPS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    defaultTab: 'dashboard',
    tabs: [
      { key: 'dashboard', label: 'Dashboard Overview' }
    ]
  },
  {
    id: 'orders',
    label: 'Orders',
    defaultTab: 'all_orders',
    tabs: [
      { key: 'place_order', label: 'Place Order' },
      { key: 'all_orders', label: 'Order Register' }
    ]
  },
  {
    id: 'operations',
    label: 'Operations',
    defaultTab: 'production',
    tabs: [
      { key: 'production', label: 'Production Flow' },
      { key: 'inventory', label: 'Raw Materials & Stock' },
      { key: 'payroll', label: 'Attendance & Payroll' },
      { key: 'label_config', label: 'Paper Catalogs & Types' }
    ]
  },
  {
    id: 'billing',
    label: 'Billing & Finance',
    defaultTab: 'all_invoices',
    tabs: [
      { key: 'all_invoices', label: 'All Invoices' },
      { key: 'create_invoice', label: 'Create Invoice' },
      { key: 'payments', label: 'Payment Entries' },
      { key: 'ledgers', label: 'Ledgers Hub' }
    ]
  }
];

function getCustomerGroupForTab(tab) {
  if (tab === 'profile') return 'dashboard';
  const grp = CUSTOMER_NAV_GROUPS.find(g => g.tabs.some(t => t.key === tab));
  return grp ? grp.id : 'orders';
}

function getAdminGroupForTab(tab) {
  if (tab === 'profile') return 'dashboard';
  const grp = ADMIN_NAV_GROUPS.find(g => g.tabs.some(t => t.key === tab));
  return grp ? grp.id : 'orders';
}

window.uBMS.CUSTOMER_NAV_GROUPS = CUSTOMER_NAV_GROUPS;
window.uBMS.ADMIN_NAV_GROUPS = ADMIN_NAV_GROUPS;
window.uBMS.getCustomerGroupForTab = getCustomerGroupForTab;
window.uBMS.getAdminGroupForTab = getAdminGroupForTab;
