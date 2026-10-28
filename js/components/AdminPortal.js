// Admin Portal: All 8 Admin Modules + Tags & Labels Manufacturing Types Config
window.uBMS = window.uBMS || {};

function AdminPortal({ 
  currentMember, 
  orders, 
  invoices, 
  payments, 
  production, 
  payroll, 
  users, 
  products, 
  labelTypes = [],
  catalogs = [],
  inventory = [],
  productionCycles = [],
  onUpdateLabelTypes,
  onUpdateInventory,
  onUpdateCatalogs,
  onUpdateProductionCycles,
  onUpdateOrder, 
  onSaveOrder, 
  onSaveInvoice, 
  onSavePayment, 
  onUpdateProduction, 
  onUpdatePayroll, 
  onOpenInvoice, 
  defaultTab = 'dashboard',
  currentTab,
  onTabChange
}) {
  const [internalTab, setInternalTab] = React.useState(defaultTab);
  const activeTab = currentTab !== undefined ? currentTab : internalTab;
  const setActiveTab = (tab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [viewMode, setViewMode] = React.useState('table'); // 'table' or 'kanban'
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = React.useState([]);
  const [previewArtworkUrl, setPreviewArtworkUrl] = React.useState(null);
  const [bulkTargetStatus, setBulkTargetStatus] = React.useState('approved');
  // Admin Order Register Search & Filter State (Same as Customer Side)
  const [adminOrderStatusFilter, setAdminOrderStatusFilter] = React.useState('all');
  const [adminSearchOrderId, setAdminSearchOrderId] = React.useState('');
  const [adminSearchCustomer, setAdminSearchCustomer] = React.useState('');
  const [adminSearchBrandSpecs, setAdminSearchBrandSpecs] = React.useState('');
  const [adminSearchDoriPlastic, setAdminSearchDoriPlastic] = React.useState('');
  const [adminSearchQty, setAdminSearchQty] = React.useState('');
  const [adminSearchRateTotal, setAdminSearchRateTotal] = React.useState('');
  const [bannerMinimized, setBannerMinimized] = React.useState(activeTab !== 'dashboard');

  // Inventory Management State
  const [inventoryFilter, setInventoryFilter] = React.useState('all');
  const [restockItem, setRestockItem] = React.useState(null);
  const [restockQty, setRestockQty] = React.useState('');
  const [restockSupplier, setRestockSupplier] = React.useState('');

  const handleRestockSubmit = (e) => {
    e.preventDefault();
    if (!restockItem || !restockQty || isNaN(Number(restockQty))) return;
    const addQty = Number(restockQty);
    const updated = inventory.map(item => item.id === restockItem.id ? {
      ...item,
      currentStock: (item.currentStock || 0) + addQty,
      supplier: restockSupplier || item.supplier,
      lastRestocked: new Date().toISOString().split('T')[0]
    } : item);
    if (onUpdateInventory) onUpdateInventory(updated);
    setRestockItem(null);
    setRestockQty('');
    setRestockSupplier('');
  };

  // Automatically minimize on non-dashboard tabs, expand on dashboard
  React.useEffect(() => {
    setBannerMinimized(activeTab !== 'dashboard');
  }, [activeTab]);

  const formatCurrency = window.uBMS.formatCurrency;
  const formatDate = window.uBMS.formatDate;
  const STAGES = window.uBMS.STAGES;

  // Admin Executive Dashboard Metrics
  const adminStats = React.useMemo(() => {
    const totalOrdersCount = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'placed');
    const approvedOrders = orders.filter(o => o.status === 'approved' || o.status === 'confirmed');
    const inProdOrders = orders.filter(o => o.status === 'in_production');
    const readyOrders = orders.filter(o => o.status === 'ready_dispatch');
    const shippedOrders = orders.filter(o => o.status === 'shipped');
    const deliveredOrders = orders.filter(o => o.status === 'delivered');

    const totalOrderRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalOutstanding = invoices.reduce((sum, i) => sum + (Number(i.balanceDue) || 0), 0);
    const totalClientsCount = (users?.customers || []).length;
    const activeStaffCount = (payroll?.staffSummary || []).length;

    return {
      totalOrdersCount,
      pendingOrders,
      pendingCount: pendingOrders.length,
      approvedOrdersCount: approvedOrders.length,
      inProdOrdersCount: inProdOrders.length,
      readyOrdersCount: readyOrders.length,
      shippedOrdersCount: shippedOrders.length,
      deliveredOrdersCount: deliveredOrders.length,
      totalOrderRevenue,
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalClientsCount,
      activeStaffCount
    };
  }, [orders, invoices, payments, users, payroll]);

  // Filtered Orders for Admin Order Register (Matching Customer Side Engine)
  const filteredAdminOrders = React.useMemo(() => {
    return orders.filter(o => {
      // 1. Status Filter
      if (adminOrderStatusFilter !== 'all') {
        const s = (o.status || '').toLowerCase();
        if (adminOrderStatusFilter === 'pending') {
          if (s !== 'pending' && s !== 'placed') return false;
        } else if (adminOrderStatusFilter === 'approved') {
          if (s !== 'approved' && s !== 'confirmed') return false;
        } else if (s !== adminOrderStatusFilter.toLowerCase()) {
          return false;
        }
      }

      // 2. Search: Order ID (matches admin TGRS ID or customer ID or creation date)
      if (adminSearchOrderId.trim()) {
        const q = adminSearchOrderId.trim().toLowerCase();
        const idMatch = (o.id || '').toLowerCase().includes(q);
        const custIdMatch = (o.customerOrderId || '').toLowerCase().includes(q);
        const dateMatch = (formatDate(o.createdAt) || '').toLowerCase().includes(q);
        if (!idMatch && !custIdMatch && !dateMatch) return false;
      }

      // 3. Search: Customer Name (matches company, contact person, email, phone)
      if (adminSearchCustomer.trim()) {
        const q = adminSearchCustomer.trim().toLowerCase();
        const compMatch = (o.customerCompany || '').toLowerCase().includes(q);
        const nameMatch = (o.customerName || '').toLowerCase().includes(q);
        const emailMatch = (o.customerEmail || '').toLowerCase().includes(q);
        const phoneMatch = (o.customerPhone || '').toLowerCase().includes(q);
        if (!compMatch && !nameMatch && !emailMatch && !phoneMatch) return false;
      }

      const items = o.items && o.items.length > 0 ? o.items : [{}];

      // 4. Search: Brand & Item Specs (matches brand name, item code, name, type, material)
      if (adminSearchBrandSpecs.trim()) {
        const q = adminSearchBrandSpecs.trim().toLowerCase();
        const specsMatch = items.some(item => {
          const brand = (item.brandName || '').toLowerCase();
          const itemCode = (item.itemCode || item.name || '').toLowerCase();
          const type = (item.type || '').toLowerCase();
          const mat = (item.material || '').toLowerCase();
          return brand.includes(q) || itemCode.includes(q) || type.includes(q) || mat.includes(q);
        });
        if (!specsMatch) return false;
      }

      // 5. Search: Dori & Plastic
      if (adminSearchDoriPlastic.trim()) {
        const q = adminSearchDoriPlastic.trim().toLowerCase();
        const dpMatch = items.some(item => {
          const dori = (item.dori || '').toLowerCase();
          const plastic = (item.plastic || '').toLowerCase();
          return dori.includes(q) || plastic.includes(q);
        });
        if (!dpMatch) return false;
      }

      // 6. Search: Quantity
      if (adminSearchQty.trim()) {
        const q = adminSearchQty.trim().replace(/[,pcs\s]/gi, '').toLowerCase();
        const matchesQty = items.some(item => {
          const qStr = String(item.quantity || '');
          return qStr.includes(q);
        });
        if (!matchesQty) return false;
      }

      // 7. Search: Rate & Total Amount
      if (adminSearchRateTotal.trim()) {
        const q = adminSearchRateTotal.trim().replace(/[\u20B9,\s]/g, '').toLowerCase();
        const totMatch = String(o.total || '').includes(q) || String(o.subtotal || '').includes(q);
        const matchesRate = items.some(item => {
          const rStr = String(item.unitPrice || '');
          return rStr.includes(q);
        });
        if (!totMatch && !matchesRate) return false;
      }

      return true;
    });
  }, [orders, adminOrderStatusFilter, adminSearchOrderId, adminSearchCustomer, adminSearchBrandSpecs, adminSearchDoriPlastic, adminSearchQty, adminSearchRateTotal]);

  const availableTypes = labelTypes.length > 0 ? labelTypes : [
    { id: 'TYPE-TAG', name: 'Tag', materials: ['100 GSM', '200 GSM', '300 GSM'], defaultRate: 2.50 },
    { id: 'TYPE-PULABEL', name: 'PU Label', materials: ['1.2', '1.8', '2.2'], defaultRate: 14.00 }
  ];

  const availableCatalogs = catalogs.length > 0 ? catalogs : [
    { id: 'CAT-PAPER0', code: 'Paper #01', name: 'Plastic', gsm: 250, finish: 'Gloss', sheetRate: 29.5, stockSheets: 350 },
    { id: 'CAT-PAPER02', code: 'Paper #02', name: 'Grey Velvet', gsm: 120, finish: 'Velvet', sheetRate: 59, stockSheets: 50 },
    { id: 'CAT-PAPER03', code: 'Paper #03', name: 'Al Grey Handmade', gsm: 250, finish: 'Matt', sheetRate: 29.5, stockSheets: 180 },
    { id: 'CAT-PAPER04', code: 'Paper #04', name: 'Sky Blue', gsm: 320, finish: 'Textured Chex', sheetRate: 30.7, stockSheets: 1050 },
    { id: 'CAT-PAPER05', code: 'Paper #05', name: 'Red Velvet', gsm: 280, finish: 'Velvet', sheetRate: 26, stockSheets: 2125 },
    { id: 'CAT-PAPER06', code: 'Paper #06', name: 'Al Greyish Green', gsm: 380, finish: 'Matt', sheetRate: 44, stockSheets: 2000 },
    { id: 'CAT-PAPER07', code: 'Paper #07', name: 'White Cloudy', gsm: 290, finish: 'Printed Matt', sheetRate: 26, stockSheets: 450 },
    { id: 'CAT-PAPER08', code: 'Paper #08', name: 'Al Light Green', gsm: 320, finish: 'Matt', sheetRate: 28.5, stockSheets: 2000 },
    { id: 'CAT-PAPER09', code: 'Paper #09', name: 'P Cream', gsm: 360, finish: 'Matt', sheetRate: 35.4, stockSheets: 30 },
    { id: 'CAT-PAPER10', code: 'Paper #10', name: 'Linning Cream', gsm: 220, finish: 'Linning', sheetRate: 26, stockSheets: 1000 },
    { id: 'CAT-PAPER11', code: 'Paper #11', name: 'Khakhi', gsm: 350, finish: 'Matt', sheetRate: 23.6, stockSheets: 700 },
    { id: 'CAT-PAPER12', code: 'Paper #12', name: 'Dark Blue (M.2094)', gsm: 350, finish: 'Matt', sheetRate: 33.1, stockSheets: 150 },
    { id: 'CAT-PAPER13', code: 'Paper #13', name: 'Al Brown', gsm: 290, finish: 'Matt', sheetRate: 24.8, stockSheets: 2400 },
    { id: 'CAT-PAPER14', code: 'Paper #14', name: 'BJ Green', gsm: 280, finish: 'Matt', sheetRate: 33.1, stockSheets: 0 },
    { id: 'CAT-PAPER15', code: 'Paper #15', name: 'Navy Blue', gsm: 300, finish: 'Matt', sheetRate: 25, stockSheets: 0 },
    { id: 'CAT-PAPER16', code: 'Paper #16', name: 'Burgandy', gsm: 290, finish: 'Matt', sheetRate: 29.5, stockSheets: 200 },
    { id: 'CAT-PAPER17', code: 'Paper #17', name: 'Grey Linning', gsm: 300, finish: 'Linnig', sheetRate: 35.4, stockSheets: 0 },
    { id: 'CAT-PAPER18', code: 'Paper #18', name: 'Light Grey', gsm: 320, finish: 'Matt', sheetRate: 37.8, stockSheets: 200 },
    { id: 'CAT-PAPER19', code: 'Paper #19', name: 'Dark Grey', gsm: 250, finish: 'Matt', sheetRate: 29.5, stockSheets: 130 },
    { id: 'CAT-PAPER20', code: 'Paper #20', name: 'SCM White Chex', gsm: 190, finish: 'Chex', sheetRate: 59, stockSheets: 100 },
    { id: 'CAT-PAPER21', code: 'Paper #21', name: 'Al White Chex', gsm: 230, finish: 'Self Chex', sheetRate: 13, stockSheets: 280 },
    { id: 'CAT-PAPER22', code: 'Paper #22', name: 'Al White Gloss', gsm: 220, finish: 'Gloss', sheetRate: 29.5, stockSheets: 450 },
    { id: 'CAT-PAPER23', code: 'Paper #23', name: 'SCM Black', gsm: 400, finish: 'Matt', sheetRate: 36, stockSheets: 0 },
    { id: 'CAT-PAPER24', code: 'Paper #24', name: 'Black Linning', gsm: 350, finish: 'Linning', sheetRate: 41.3, stockSheets: 100 },
    { id: 'CAT-PAPER25', code: 'Paper #25', name: 'SCM Black', gsm: 250, finish: 'Matt', sheetRate: 23.6, stockSheets: 0 },
    { id: 'CAT-PAPER26', code: 'Paper #26', name: 'Black Chex', gsm: 350, finish: 'Chex', sheetRate: 41.3, stockSheets: 900 },
    { id: 'CAT-PAPER27', code: 'Paper #27', name: 'Black Velvet', gsm: 220, finish: 'Velvet', sheetRate: 33.1, stockSheets: 0 },
    { id: 'CAT-PAPER28', code: 'Paper #28', name: 'Al Cream Handmade', gsm: 250, finish: 'Matt', sheetRate: 30.7, stockSheets: 700 },
    { id: 'CAT-PAPER29', code: 'Paper #29', name: 'Black Velvet', gsm: 540, finish: 'Velvet', sheetRate: 22, stockSheets: 3000 },
    { id: 'CAT-PAPER30', code: 'Paper #30', name: 'Fbb', gsm: 250, finish: 'Matt', sheetRate: 18.6, stockSheets: 3800 }
  ];

  // Default Manufacturing Production Cycles
  const DEFAULT_CYCLES = [
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
    },
    {
      id: 'CYCLE-DIRECT-4',
      name: 'Direct Tag Cycle (No Handwork)',
      isDefault: false,
      steps: [
        { key: 'cutting', name: 'Paper Cutting', stepNumber: 1, description: 'Guillotine sheet cutting & sizing' },
        { key: 'printing', name: 'Printing', stepNumber: 2, description: 'Offset / digital press ink application' },
        { key: 'punching', name: 'Punching & Packing', stepNumber: 3, description: 'Die-cutting, creasing & stripping' },
        { key: 'dispatch', name: 'Dispatch', stepNumber: 4, description: 'Quality check & dispatch packing' }
      ]
    }
  ];

  const availableCycles = (productionCycles && productionCycles.length > 0) ? productionCycles : DEFAULT_CYCLES;

  // Production Cycle Management State
  const [showCycleManagerModal, setShowCycleManagerModal] = React.useState(false);
  const [newCycleName, setNewCycleName] = React.useState('');
  const [selectedCycleSteps, setSelectedCycleSteps] = React.useState(['cutting', 'printing', 'punching', 'handwork', 'dispatch']);

  const handleSaveNewCycle = (e) => {
    e.preventDefault();
    if (!newCycleName.trim()) return alert('Please enter a Cycle Name');
    if (selectedCycleSteps.length === 0) return alert('Please select at least one process step for the cycle');

    const ALL_STEPS_DEF = {
      cutting: { key: 'cutting', name: 'Paper Cutting', description: 'Guillotine sheet cutting & sizing' },
      printing: { key: 'printing', name: 'Printing', description: 'Offset / digital press ink application' },
      punching: { key: 'punching', name: 'Punching & Packing', description: 'Die-cutting, creasing & stripping' },
      handwork: { key: 'handwork', name: 'Handwork Process', description: 'Dori attachment & plastic seal lock' },
      dispatch: { key: 'dispatch', name: 'Dispatch', description: 'Quality check & dispatch packing' }
    };

    const orderedSteps = ['cutting', 'printing', 'punching', 'handwork', 'dispatch']
      .filter(k => selectedCycleSteps.includes(k))
      .map((k, idx) => ({
        ...ALL_STEPS_DEF[k],
        stepNumber: idx + 1
      }));

    const newCycle = {
      id: 'CYCLE-' + Date.now().toString().slice(-4),
      name: newCycleName.trim(),
      isDefault: false,
      steps: orderedSteps
    };

    const updated = [...availableCycles, newCycle];
    if (onUpdateProductionCycles) {
      onUpdateProductionCycles(updated);
    }
    setShowCycleManagerModal(false);
    setNewCycleName('');
    setSelectedCycleSteps(['cutting', 'printing', 'punching', 'handwork', 'dispatch']);
  };

  const getNextCycleStep = (job, currentKey) => {
    const cycleObj = availableCycles.find(c => c.id === job.cycleId) || availableCycles[0];
    const steps = job.cycleSteps || (cycleObj?.steps) || DEFAULT_CYCLES[0].steps;
    const idx = steps.findIndex(s => s.key === currentKey);
    if (idx !== -1 && idx + 1 < steps.length) {
      return steps[idx + 1].key;
    }
    return 'completed';
  };

  // Paper Catalog Management State & Handlers
  const [catalogSubTab, setCatalogSubTab] = React.useState('catalogs'); // 'catalogs' or 'types'
  const [editingCatalog, setEditingCatalog] = React.useState(null);
  const [showCatalogModal, setShowCatalogModal] = React.useState(false);
  const [catCode, setCatCode] = React.useState('');
  const [catName, setCatName] = React.useState('');
  const [catGsm, setCatGsm] = React.useState(350);
  const [catFinish, setCatFinish] = React.useState('Silk Matte Coated');
  const [catRate, setCatRate] = React.useState(3.50);
  const [catStock, setCatStock] = React.useState(10000);

  const getNextPaperCode = () => {
    let maxNum = 0;
    let foundPaper = false;

    availableCatalogs.forEach(c => {
      const match = (c.code || '').match(/Paper\s*#?\s*(\d+)/i);
      if (match) {
        foundPaper = true;
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    if (foundPaper) {
      return `Paper #${String(maxNum + 1).padStart(2, '0')}`;
    }

    return 'Paper #01';
  };

  const handleOpenAddCatalog = () => {
    setEditingCatalog(null);
    setCatCode(getNextPaperCode());
    setCatName('');
    setCatGsm(350);
    setCatFinish('Silk Matte Coated');
    setCatRate(3.50);
    setCatStock(10000);
    setShowCatalogModal(true);
  };

  const handleOpenEditCatalog = (cat) => {
    setEditingCatalog(cat);
    setCatCode(cat.code || '');
    setCatName(cat.name || '');
    setCatGsm(cat.gsm || 300);
    setCatFinish(cat.finish || '');
    setCatRate(cat.sheetRate || 3.00);
    setCatStock(cat.stockSheets || 5000);
    setShowCatalogModal(true);
  };

  const handleSaveCatalogSubmit = (e) => {
    e.preventDefault();
    if (!catCode.trim() || !catName.trim()) return alert('Please enter Catalog Code and Name');

    let updatedCatalogs = [];
    let savedCatId = '';

    if (editingCatalog) {
      savedCatId = editingCatalog.id;
      updatedCatalogs = availableCatalogs.map(c => c.id === editingCatalog.id ? {
        ...c,
        code: catCode.trim(),
        name: catName.trim(),
        gsm: Number(catGsm) || 300,
        finish: catFinish.trim(),
        sheetRate: Number(catRate) || 1.0,
        stockSheets: Number(catStock) || 0
      } : c);
    } else {
      const cleanCode = catCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || Date.now().toString().slice(-4);
      savedCatId = 'CAT-' + cleanCode;
      if (availableCatalogs.some(c => c.id === savedCatId)) {
        savedCatId = `${savedCatId}-${Date.now().toString().slice(-4)}`;
      }
      const newCat = {
        id: savedCatId,
        code: catCode.trim(),
        name: catName.trim(),
        gsm: Number(catGsm) || 300,
        finish: catFinish.trim(),
        sheetRate: Number(catRate) || 1.0,
        stockSheets: Number(catStock) || 0
      };
      updatedCatalogs = [...availableCatalogs, newCat];
    }

    if (onUpdateCatalogs) onUpdateCatalogs(updatedCatalogs);

    // Also synchronize with Inventory
    if (onUpdateInventory && inventory) {
      const existingInv = inventory.find(i => i.catalogId === savedCatId || i.code === catCode.trim());
      if (existingInv) {
        const updatedInv = inventory.map(i => i.id === existingInv.id ? {
          ...i,
          name: catName.trim(),
          code: catCode.trim(),
          unitCost: Number(catRate) || 1.0,
          currentStock: Number(catStock) || i.currentStock
        } : i);
        onUpdateInventory(updatedInv);
      } else {
        const newInvItem = {
          id: 'INV-PPR-' + (inventory.length + 1).toString().padStart(2, '0'),
          category: 'paper',
          catalogId: savedCatId,
          name: catName.trim(),
          code: catCode.trim(),
          unit: 'Sheets',
          unitCost: Number(catRate) || 1.0,
          currentStock: Number(catStock) || 5000,
          reorderLevel: 1500,
          location: 'Aisle P-Rack ' + (inventory.length + 1),
          supplier: 'Direct Mill Order',
          lastRestocked: new Date().toISOString().split('T')[0]
        };
        onUpdateInventory([...inventory, newInvItem]);
      }
    }

    setShowCatalogModal(false);
  };

  const handleDeleteCatalog = (catId) => {
    if (availableCatalogs.length <= 1) {
      return alert('At least one paper catalog must remain active in the system.');
    }
    if (confirm('Are you sure you want to delete this paper catalog?')) {
      const updated = availableCatalogs.filter(c => c.id !== catId);
      if (onUpdateCatalogs) onUpdateCatalogs(updated);
    }
  };

  // Move to Production (with Sheet Qty Allocation & Bulk Support)
  const [prodModalOrders, setProdModalOrders] = React.useState(null); // array of orders
  const [prodSheetAllocations, setProdSheetAllocations] = React.useState({}); // key: `${orderId}_${itemIdx}_${cardIdx}` -> job card details
  const [selectedProdCycleId, setSelectedProdCycleId] = React.useState('CYCLE-STD-5');

  // Wastage Rule: 200 extra tags per 5000 tags (5000 -> 5200, 10000 -> 10400, and so on).
  // Exact sheets are issued from this total tags without adding any extra sheets after that.
  const getWastageTags = (qty) => {
    const n = Number(qty) || 0;
    if (n <= 0) return 0;
    return Math.round((n / 5000) * 200);
  };

  // Compact Job Card Number Generator: JO_01_P1, JO_01_P2, etc.
  const formatJobCardNumber = (jobOrOrd, itemIdx = 0, cardIdx = 0, totalCards = 1) => {
    if (typeof jobOrOrd === 'string') {
      if (/^JO_\d+_P\d+$/i.test(jobOrOrd)) return jobOrOrd;
      if (/^JO_\d+$/i.test(jobOrOrd)) return `${jobOrOrd}_P${cardIdx + 1}`;
    }
    const existingNum = jobOrOrd?.jobNumber || jobOrOrd?.jobId;
    if (existingNum && /^JO_\d+_P\d+$/i.test(existingNum)) return existingNum;
    if (existingNum && /^JO_\d+$/i.test(existingNum)) {
      const pIdx = (jobOrOrd?.cardIndex !== undefined) ? jobOrOrd.cardIndex : (cardIdx + 1);
      return `${existingNum}_P${pIdx}`;
    }

    const custRef = jobOrOrd?.customerOrderId || (jobOrOrd?.orderNumber || jobOrOrd?.orderId || jobOrOrd?.id || '').split('-').pop() || '01';
    const numMatch = custRef.match(/\d+/g);
    const seqDigits = numMatch ? numMatch[numMatch.length - 1].padStart(2, '0') : String(itemIdx + 1).padStart(2, '0');
    const partIdx = (jobOrOrd?.cardIndex !== undefined) ? jobOrOrd.cardIndex : (cardIdx + 1);
    return `JO_${seqDigits}_P${partIdx}`;
  };

  // Crop & Artwork States for Production Job Cards
  const [cropJobTarget, setCropJobTarget] = React.useState(null); // { jobId, imageSrc }

  const handleUpdateJobImage = (jobId, croppedUrl) => {
    const updated = production.map(j => j.jobId === jobId ? { ...j, image: croppedUrl } : j);
    onUpdateProduction(updated);
  };

  const handleUploadJobArtwork = (jobId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      handleUpdateJobImage(jobId, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateJobOperator = (jobId, stageKey, newOperator) => {
    setSheetInput(jobId, `${stageKey}Operator`, newOperator);
    const updated = production.map(j => j.jobId === jobId ? {
      ...j,
      [stageKey]: {
        ...(j[stageKey] || {}),
        operatorName: newOperator
      }
    } : j);
    onUpdateProduction(updated);
  };

  // Dynamically populated operator lists with defaults
  const cuttingOperators = React.useMemo(() => {
    const teamOps = (users?.team || []).filter(u => u.role === 'cutting' || u.roleLabel?.toLowerCase().includes('cut')).map(u => u.name);
    return Array.from(new Set([...teamOps, 'Ramesh', 'Dilip', 'Sunil', 'Kanu']));
  }, [users]);

  const printingOperators = React.useMemo(() => {
    const teamOps = (users?.team || []).filter(u => u.role === 'printing' || u.roleLabel?.toLowerCase().includes('print')).map(u => u.name);
    return Array.from(new Set([...teamOps, 'Kanu', 'Manoj Kumar', 'Prakash', 'Sunil']));
  }, [users]);

  const punchingOperators = React.useMemo(() => {
    const teamOps = (users?.team || []).filter(u => u.role === 'punching' || u.roleLabel?.toLowerCase().includes('punch')).map(u => u.name);
    return Array.from(new Set([...teamOps, 'Shivakant', 'Dilip Yadav', 'Mohan', 'Sanjay']));
  }, [users]);

  const handleOpenMoveToProduction = (orderOrOrders) => {
    const list = Array.isArray(orderOrOrders) ? orderOrOrders : [orderOrOrders];
    if (list.length === 0) return alert('No orders selected for production.');

    // Initialize allocations with the 9 mandatory fields & sheet calculations
    const todayStr = new Date().toISOString().split('T')[0];
    const initialAlloc = {};
    list.forEach(ord => {
      (ord.items || []).forEach((item, itemIdx) => {
        const pcs = Number(item.quantity) || 1000;
        const defaultUps = 10;
        const wastage = getWastageTags(pcs); // e.g. 200 for 5000, 400 for 10000
        const totalProdTags = pcs + wastage;  // e.g. 5200 for 5000, 10400 for 10000
        const defaultSheets = Math.ceil(totalProdTags / defaultUps); // e.g. 520 sheets (no extra sheets added after)

        const custOrdCode = ord.customerOrderId || (ord.id ? ord.id.split('-').pop() : '01');

        if (item.isMultiCard && item.cards && item.cards.length > 0) {
          item.cards.forEach((card, cardIdx) => {
            const key = `${ord.id}_${itemIdx}_${cardIdx}`;
            let paper = card.catalogCode || card.material || item.material || 'Paper #01 (Art Card 350 GSM)';
            const matchedCat = availableCatalogs.find(c => c.code === paper || c.name === paper || c.id === card.catalogId);
            if (matchedCat) {
              paper = `${matchedCat.code || ''} ${matchedCat.name || ''}`.trim();
            }

            const compactJob = formatJobCardNumber(ord, itemIdx, cardIdx, item.cards.length);
            const cardImg = card.image || card.artwork || item.image || item.artwork || ord.artwork || null;

            initialAlloc[key] = {
              date: todayStr,
              jobNumber: compactJob,
              orderNumber: ord.id,
              customerOrderId: custOrdCode,
              partyName: ord.customerCompany || ord.customerName || 'Standard Client',
              paperName: paper,
              orderQty: pcs,
              wastageQty: wastage,
              productionQty: totalProdTags,
              numPrintingColors: 4,
              namePrintingColors: 'CMYK (Full Color)',
              priority: ord.priority || 'standard',
              cycleId: selectedProdCycleId || 'CYCLE-STD-5',
              ups: defaultUps,
              sheets: defaultSheets,
              orderPieces: pcs,
              cardTitle: card.title || `Card #${cardIdx + 1}`,
              catalogCode: paper,
              image: cardImg
            };
          });
        } else {
          const key = `${ord.id}_${itemIdx}_0`;
          let paper = item.catalogCode || item.material || 'Paper #01 (Art Card 350 GSM)';
          const matchedCat = availableCatalogs.find(c => c.code === paper || c.name === paper);
          if (matchedCat) {
            paper = `${matchedCat.code || ''} ${matchedCat.name || ''}`.trim();
          }

          const compactJob = formatJobCardNumber(ord, itemIdx, 0, 1);
          const cardImg = item.image || item.artwork || ord.artwork || null;

          initialAlloc[key] = {
            date: todayStr,
            jobNumber: compactJob,
            orderNumber: ord.id,
            customerOrderId: custOrdCode,
            partyName: ord.customerCompany || ord.customerName || 'Standard Client',
            paperName: paper,
            orderQty: pcs,
            wastageQty: wastage,
            productionQty: totalProdTags,
            numPrintingColors: 4,
            namePrintingColors: 'CMYK (Full Color)',
            priority: ord.priority || 'standard',
            cycleId: selectedProdCycleId || 'CYCLE-STD-5',
            ups: defaultUps,
            sheets: defaultSheets,
            orderPieces: pcs,
            cardTitle: item.name || item.itemCode || 'Single Card Tag',
            catalogCode: paper,
            image: cardImg
          };
        }
      });
    });

    setProdSheetAllocations(initialAlloc);
    setProdModalOrders(list);
  };

  const handleUpdateSheetAlloc = (key, field, value) => {
    setProdSheetAllocations(prev => {
      const current = prev[key] || { ups: 10, sheets: 100, orderPieces: 1000, orderQty: 1000 };
      if (field === 'ups') {
        const newUps = Math.max(1, Number(value) || 1);
        const ordQ = Number(current.orderQty || current.orderPieces || 1000);
        const wasteQ = getWastageTags(ordQ);
        const totQ = ordQ + wasteQ;
        const newSheets = Math.ceil(totQ / newUps);
        return {
          ...prev,
          [key]: { ...current, ups: newUps, sheets: newSheets }
        };
      }
      if (field === 'sheets') {
        const newSheets = Math.max(1, Number(value) || 1);
        return {
          ...prev,
          [key]: { ...current, sheets: newSheets }
        };
      }
      if (field === 'orderQty') {
        const newQty = Math.max(1, Number(value) || 1);
        const wasteQ = getWastageTags(newQty);
        const totQ = newQty + wasteQ;
        const newSheets = Math.ceil(totQ / (current.ups || 10));
        return {
          ...prev,
          [key]: { 
            ...current, 
            orderQty: newQty, 
            orderPieces: newQty, 
            wastageQty: wasteQ,
            productionQty: totQ,
            sheets: newSheets 
          }
        };
      }
      return {
        ...prev,
        [key]: { ...current, [field]: value }
      };
    });
  };

  const handleConfirmMoveToProduction = () => {
    if (!prodModalOrders || prodModalOrders.length === 0) return;
    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    let createdJobs = [];

    const cycleObj = availableCycles.find(c => c.id === selectedProdCycleId) || availableCycles[0];
    const cycleSteps = cycleObj?.steps || DEFAULT_CYCLES[0].steps;
    const initialStage = cycleSteps[0]?.key || 'cutting';

    prodModalOrders.forEach(order => {
      // 1. Update Order Status to in_production
      const updatedOrder = {
        ...order,
        status: 'in_production',
        timeline: [
          ...(order.timeline || []),
          {
            stage: 'in_production',
            title: 'Production Job Form Created',
            description: `Production job cards created by ${currentMember.name}. Assigned to ${cycleObj?.name || 'Production Cycle'}.`,
            timestamp: formattedDate,
            author: currentMember.name
          }
        ]
      };
      onUpdateOrder(updatedOrder);

      // 2. Generate Production Job Forms - SEPARATE JOB CARD PER PAPER COMPONENT!
      (order.items || []).forEach((item, itemIdx) => {
        const pcs = Number(item.quantity) || 1000;
        const isMulti = !!item.isMultiCard;
        const cardsList = isMulti && item.cards && item.cards.length > 0 ? item.cards : [
          {
            cardIndex: 1,
            title: item.name || item.itemCode || 'Single Card Tag',
            catalogCode: item.catalogCode || item.material || 'Paper #01 (Art Card 350 GSM)',
            gsm: 300,
            finish: 'Matte'
          }
        ];

        cardsList.forEach((card, cardIdx) => {
          const key = `${order.id}_${itemIdx}_${cardIdx}`;
          const alloc = prodSheetAllocations[key] || {};
          const baseOrderQty = Number(alloc.orderQty) || pcs;
          const wastageTags = alloc.wastageQty !== undefined ? Number(alloc.wastageQty) : getWastageTags(baseOrderQty);
          const totalProdTags = alloc.productionQty || (baseOrderQty + wastageTags); // 5000 -> 5200, 10000 -> 10400
          const ups = Number(alloc.ups) || 10;
          const requiredSheets = Number(alloc.sheets) || Math.ceil(totalProdTags / ups); // 520 sheets (no extra sheets added after!)
          const floor = Math.ceil(baseOrderQty / ups); // Minimum sheets to fulfill order

          const defaultJobNum = formatJobCardNumber(order, itemIdx, cardIdx, cardsList.length);
          const finalJobId = alloc.jobNumber || defaultJobNum;
          const custOrdCode = order.customerOrderId || (order.id ? order.id.split('-').pop() : '01');
          const finalDate = alloc.date || new Date().toISOString().split('T')[0];
          const finalPartyName = alloc.partyName || order.customerCompany || order.customerName || 'Valued Client';
          const finalPaperName = alloc.paperName || card.catalogCode || card.title || 'Paper #01 (Art Card 350 GSM)';
          const finalNumColors = Number(alloc.numPrintingColors) || 4;
          const finalNameColors = alloc.namePrintingColors || 'CMYK (Full Color)';
          const finalPriority = alloc.priority || order.priority || 'standard';
          const finalImage = alloc.image || card.image || card.artwork || item.image || item.artwork || order.artwork || null;

          createdJobs.push({
            jobId: finalJobId,
            jobNumber: finalJobId,
            customerOrderId: custOrdCode,
            image: finalImage,
            date: finalDate,
            orderId: order.id,
            orderNumber: order.id,
            partyName: finalPartyName,
            customerCompany: finalPartyName,
            customerName: order.customerName,
            paperName: finalPaperName,
            catalogCode: finalPaperName,
            orderQty: baseOrderQty,
            wastageQty: wastageTags,
            productionQty: totalProdTags,
            targetQty: totalProdTags,
            numPrintingColors: finalNumColors,
            namePrintingColors: finalNameColors,
            priority: finalPriority,
            cycleId: cycleObj.id,
            cycleName: cycleObj.name,
            cycleSteps: cycleSteps,
            currentStage: initialStage,
            itemName: item.name || item.itemCode || `Item #${itemIdx + 1}`,
            cardTitle: card.title || `Card #${cardIdx + 1}`,
            cardIndex: cardIdx + 1,
            totalCardsInSet: cardsList.length,
            isMultiCardComponent: cardsList.length > 1,
            type: item.type || 'Tag',
            ups: ups,
            targetSheets: requiredSheets,
            bufferSheets: 0,
            issuedSheets: requiredSheets,
            minimumAllowedFloor: floor,
            cutting: {
              status: initialStage === 'cutting' ? 'pending' : 'locked',
              operatorName: 'Ramesh',
              startTime: null,
              completedTime: null,
              goodSheetsCut: null,
              wasteSheets: null
            },
            printing: {
              status: initialStage === 'printing' ? 'pending' : 'locked',
              operatorName: 'Kanu',
              startTime: null,
              completedTime: null,
              goodSheetsPrinted: null,
              wasteSheets: null
            },
            punching: {
              status: initialStage === 'punching' ? 'pending' : 'locked',
              operatorName: 'Shivakant',
              startTime: null,
              completedTime: null,
              goodSheetsPunched: null,
              wasteSheets: null
            },
            handwork: {
              status: initialStage === 'handwork' ? 'pending' : 'locked',
              doriType: item.dori || 'Reg. Cotton Dori',
              doriRate: item.doriRate || 0.20,
              plasticType: item.plastic || 'Reg. Plastic Lock',
              plasticRate: item.plasticRate || 0.10,
              totalRatePerTag: (item.doriRate || 0.20) + (item.plasticRate || 0.10),
              assignedLabourerId: null,
              assignedLabourerName: null,
              startTime: null,
              completedTime: null,
              completedPieces: null,
              earnedPayout: null
            },
            dispatch: {
              status: initialStage === 'dispatch' ? 'pending' : 'locked',
              readyTime: null,
              dispatchedTime: null,
              verifiedPieces: null,
              carrier: null,
              trackingNumber: null
            },
            godown: {
              status: 'pending',
              location: 'Bay 01 - Finished Goods'
            }
          });
        });
      });
    });

    onUpdateProduction([...createdJobs, ...production]);
    setProdModalOrders(null);
    setProdSheetAllocations({});
    setSelectedOrderIds([]);
    setActiveTab('production');
  };

  // --- MODULE 1: PRODUCTION ORDER STUDIO (ADMIN ON-BEHALF) STATE ---
  const [adminOrderCustId, setAdminOrderCustId] = React.useState(users.customers[0]?.id || '');
  const selectedCust = users.customers.find(c => c.id === adminOrderCustId) || users.customers[0];

  // Customer Party Search & Suggestion State (Identical to Brand Name Entry)
  const [adminCustomerPartyQuery, setAdminCustomerPartyQuery] = React.useState(selectedCust?.company || '');
  const [adminCustomerInputFocused, setAdminCustomerInputFocused] = React.useState(false);

  const filteredCustomerSuggestions = React.useMemo(() => {
    const q = (adminCustomerPartyQuery || '').trim().toLowerCase();
    if (!q) return users.customers || [];
    return (users.customers || []).filter(c => {
      const comp = (c.company || '').toLowerCase();
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const abbr = (c.abbr || '').toLowerCase();
      return comp.includes(q) || name.includes(q) || phone.includes(q) || abbr.includes(q);
    });
  }, [users.customers, adminCustomerPartyQuery]);

  const handleSelectCustomerParty = (cust) => {
    if (!cust) return;
    setAdminOrderCustId(cust.id);
    setAdminCustomerPartyQuery(cust.company);
    setAdminBrandName(cust.company);
    setAdminRepeatSelectedItemCode('');
    setAdminRepeatSelectedItemName('');
    setAdminRepeatSearchQuery('');
    setAdminCustomerInputFocused(false);
  };

  const [adminOrderType, setAdminOrderType] = React.useState('New Order'); // 'New Order' or 'Repeat Order'
  const [adminBrandName, setAdminBrandName] = React.useState(selectedCust?.company || '');
  const [adminBrandInputFocused, setAdminBrandInputFocused] = React.useState(false);
  const [adminItemCode, setAdminItemCode] = React.useState('');
  const [adminItemCodeManual, setAdminItemCodeManual] = React.useState(false);

  const [adminSelectedType, setAdminSelectedType] = React.useState(availableTypes[0]?.name || 'Tag');
  const adminTypeObj = availableTypes.find(t => t.name === adminSelectedType) || availableTypes[0];
  const [adminSelectedMaterial, setAdminSelectedMaterial] = React.useState(adminTypeObj?.materials[0] || '100 GSM');
  const [adminSelectedCatalogId, setAdminSelectedCatalogId] = React.useState(availableCatalogs[0]?.id || 'CAT-IV350');

  // Single Card Dimension
  const [adminSingleCardDimension, setAdminSingleCardDimension] = React.useState('');

  // Multi-Card Tag composition
  const [adminIsMultiCard, setAdminIsMultiCard] = React.useState(false);
  const [adminTagCards, setAdminTagCards] = React.useState([
    { id: 1, title: 'Tag 1 (Base Tag)', catalogId: availableCatalogs[0]?.id || 'CAT-IV350', dimension: '' },
    { id: 2, title: 'Tag 2 (Upper Tag)', catalogId: availableCatalogs[1]?.id || 'CAT-KF280', dimension: '' }
  ]);

  // PU Leather options
  const [adminPuOrigin, setAdminPuOrigin] = React.useState('Indian'); // 'Indian' or 'Imported'
  const [adminPuThickness, setAdminPuThickness] = React.useState('1.8'); // '1.2', '1.8', '2.2'

  // Commercials & Trims
  const [adminQty, setAdminQty] = React.useState(0);
  const [adminRate, setAdminRate] = React.useState(0);
  const [adminOrderImage, setAdminOrderImage] = React.useState('');
  const [adminDoriOption, setAdminDoriOption] = React.useState('reg'); // 'none', 'reg', 'custom'
  const [adminDoriCustom, setAdminDoriCustom] = React.useState('');
  const [adminPlasticOption, setAdminPlasticOption] = React.useState('reg'); // 'none', 'reg', 'custom'
  const [adminPlasticCustom, setAdminPlasticCustom] = React.useState('');

  // Repeat Order State & Autocomplete
  const [adminRepeatSelectedItemCode, setAdminRepeatSelectedItemCode] = React.useState('');
  const [adminRepeatSelectedItemName, setAdminRepeatSelectedItemName] = React.useState('');
  const [adminRepeatSearchQuery, setAdminRepeatSearchQuery] = React.useState('');
  const [adminRepeatInputFocused, setAdminRepeatInputFocused] = React.useState(false);

  // Batch items & notes
  const [adminOrderItems, setAdminOrderItems] = React.useState([]);
  const [adminOrderDiscount, setAdminOrderDiscount] = React.useState(0);
  const [adminOrderNotes, setAdminOrderNotes] = React.useState('');
  const [adminStepValidationErrors, setAdminStepValidationErrors] = React.useState({});
  const [adminIsSubmitting, setAdminIsSubmitting] = React.useState(false);
  const [adminShowCropModal, setAdminShowCropModal] = React.useState(false);

  // Rejection Modal & Shortage Alert States
  const [rejectionModalOrder, setRejectionModalOrder] = React.useState(null);
  const [rejectionReasonChoice, setRejectionReasonChoice] = React.useState('Paper Catalog temporarily out of stock');
  const [rejectionReasonCustom, setRejectionReasonCustom] = React.useState('');
  const [shortageAlertJob, setShortageAlertJob] = React.useState(null);

  // Collect all saved brands for selected customer
  const adminCustomerSavedBrands = React.useMemo(() => {
    const brandSet = new Set();
    if (selectedCust?.brands && Array.isArray(selectedCust.brands)) {
      selectedCust.brands.forEach(b => {
        if (b && typeof b === 'string' && b.trim()) brandSet.add(b.trim());
      });
    }
    if (selectedCust?.company && typeof selectedCust.company === 'string' && selectedCust.company.trim()) {
      brandSet.add(selectedCust.company.trim());
    }
    (orders || []).forEach(o => {
      const isThisCust = (o.customerId && selectedCust?.id && o.customerId === selectedCust.id) ||
                         (o.customerCompany && selectedCust?.company && o.customerCompany === selectedCust.company);
      if (isThisCust && Array.isArray(o.items)) {
        o.items.forEach(item => {
          if (item.brandName && typeof item.brandName === 'string' && item.brandName.trim()) {
            brandSet.add(item.brandName.trim());
          }
        });
      }
    });
    return Array.from(brandSet).sort();
  }, [selectedCust, orders]);

  // Filtered brand suggestions for selected customer
  const adminFilteredBrandSuggestions = React.useMemo(() => {
    if (!adminCustomerSavedBrands || adminCustomerSavedBrands.length === 0) return [];
    const query = (adminBrandName || '').trim().toLowerCase();
    if (!query) return adminCustomerSavedBrands;
    return adminCustomerSavedBrands.filter(b => b.toLowerCase().includes(query));
  }, [adminCustomerSavedBrands, adminBrandName]);

  // List of all previous items ordered by this selected customer for Repeat Order selection
  const adminCustomerPastItems = React.useMemo(() => {
    const list = [];
    const seen = new Set();
    (orders || []).forEach(o => {
      const isThisCust = (o.customerId && selectedCust?.id && o.customerId === selectedCust.id) ||
                         (o.customerCompany && selectedCust?.company && o.customerCompany === selectedCust.company);
      if (isThisCust && Array.isArray(o.items)) {
        o.items.forEach(item => {
          const code = item.itemCode || item.name || item.id;
          if (code && !seen.has(code)) {
            seen.add(code);
            list.push({
              ...item,
              orderId: o.id,
              orderDate: o.createdAt
            });
          }
        });
      }
    });
    return list;
  }, [orders, selectedCust]);

  // Filtered list of past items based on admin search query
  const adminFilteredRepeatItems = React.useMemo(() => {
    if (!adminCustomerPastItems || adminCustomerPastItems.length === 0) return [];
    const q = (adminRepeatSearchQuery || '').trim().toLowerCase();
    if (!q) return adminCustomerPastItems;
    return adminCustomerPastItems.filter(item => {
      const code = (item.itemCode || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const brand = (item.brandName || '').toLowerCase();
      const type = (item.type || '').toLowerCase();
      const mat = (item.material || '').toLowerCase();
      return code.includes(q) || name.includes(q) || brand.includes(q) || type.includes(q) || mat.includes(q);
    });
  }, [adminCustomerPastItems, adminRepeatSearchQuery]);

  const handleAdminSelectRepeatItem = (code) => {
    setAdminRepeatSelectedItemCode(code);
    if (adminStepValidationErrors.repeatSelectedItemCode) {
      setAdminStepValidationErrors(prev => ({ ...prev, repeatSelectedItemCode: null }));
    }
    const found = adminCustomerPastItems.find(i => (i.itemCode || i.name) === code);
    if (found) {
      const displayName = found.name || found.itemCode || code;
      const displayLabel = found.itemCode && found.name && found.itemCode !== found.name ? found.name + ' (' + found.itemCode + ')' : displayName;
      setAdminRepeatSearchQuery(displayLabel);
      setAdminRepeatSelectedItemName(displayName);
      if (found.brandName) setAdminBrandName(found.brandName);
      if (found.type) {
        setAdminSelectedType(found.type);
        const typeObj = availableTypes.find(t => t.name === found.type);
        if (typeObj && typeObj.materials) setAdminSelectedMaterial(found.material || typeObj.materials[0]);
      }
      if (found.catalogId) setAdminSelectedCatalogId(found.catalogId);
      if (found.material && found.material.includes('Indian PU')) {
        setAdminPuOrigin('Indian');
        if (found.material.includes('1.2')) setAdminPuThickness('1.2');
        else if (found.material.includes('2.2')) setAdminPuThickness('2.2');
        else setAdminPuThickness('1.8');
      } else if (found.material && (found.material.includes('Imported') || found.material.includes('PU'))) {
        setAdminPuOrigin('Imported');
      }
      if (found.image) setAdminOrderImage(found.image);
      if (found.unitPrice) setAdminRate(found.unitPrice);
      if (found.quantity) setAdminQty(found.quantity);
      if (found.dori) {
        if (found.dori === 'None') {
          setAdminDoriOption('none');
          setAdminDoriCustom('');
        } else if (found.dori.startsWith('Custom:')) {
          setAdminDoriOption('custom');
          setAdminDoriCustom(found.dori.replace('Custom:', '').trim());
        } else {
          setAdminDoriOption('reg');
          setAdminDoriCustom('');
        }
      }
      if (found.plastic) {
        if (found.plastic === 'None') {
          setAdminPlasticOption('none');
          setAdminPlasticCustom('');
        } else if (found.plastic.startsWith('Custom:')) {
          setAdminPlasticOption('custom');
          setAdminPlasticCustom(found.plastic.replace('Custom:', '').trim());
        } else {
          setAdminPlasticOption('reg');
          setAdminPlasticCustom('');
        }
      }
      if (found.isMultiCard && found.cards && found.cards.length > 0) {
        setAdminIsMultiCard(true);
        setAdminTagCards(found.cards.map((c, i) => ({
          id: i + 1,
          title: c.title || (i === 0 ? 'Tag 1 (Base Tag)' : i === 1 ? 'Tag 2 (Upper Tag)' : 'Tag 3 (Overlay Tag)'),
          catalogId: c.catalogId || availableCatalogs[0]?.id,
          dimension: c.dimension || ''
        })));
      } else {
        setAdminIsMultiCard(false);
      }
    }
  };

  // Auto-calculated unique Item Code for Admin Order
  const adminPartyName = selectedCust?.company || selectedCust?.name || adminBrandName;
  const adminCustomerAbbr = selectedCust?.abbr || window.uBMS.generateCustomerAbbr(adminPartyName);
  const currentAdminItemCode = (adminItemCodeManual && adminItemCode)
    ? adminItemCode.trim().toUpperCase()
    : window.uBMS.getNextItemCode(adminCustomerAbbr, orders, adminOrderItems);
  const currentAdminOrderId = window.uBMS.getNextAdminOrderId(selectedCust, orders);
  const adminCustomerItemIndex = window.uBMS.getCustomerNextItemIndex(selectedCust, orders, adminOrderItems);
  const currentAdminDraftItemName = window.uBMS.formatItemName(adminCustomerAbbr, adminSelectedType, adminBrandName, adminCustomerItemIndex);

  // Type change handler
  const handleAdminTypeChange = (newType) => {
    setAdminSelectedType(newType);
    const typeObj = availableTypes.find(t => t.name === newType);
    if (typeObj) {
      setAdminSelectedMaterial(typeObj.materials[0] || '');
      if (typeObj.defaultRate && (!adminRate || Number(adminRate) === 0)) {
        setAdminRate(typeObj.defaultRate);
      }
    }
  };

  const handleAdminUpdateCardCatalog = (cardIndex, newCatId) => {
    setAdminTagCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, catalogId: newCatId } : c));
  };
  const handleAdminUpdateCardDimension = (cardIndex, newDim) => {
    setAdminTagCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, dimension: newDim } : c));
  };
  const handleAdminAddThirdCard = () => {
    if (adminTagCards.length >= 3) return;
    setAdminTagCards(prev => [
      ...prev,
      { id: 3, title: 'Tag 3 (Overlay Tag)', catalogId: availableCatalogs[3]?.id || 'CAT-TR115', dimension: '' }
    ]);
  };
  const handleAdminRemoveThirdCard = () => {
    setAdminTagCards(prev => prev.slice(0, 2));
  };

  // Image Upload handler for Admin
  const handleAdminImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAdminOrderImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Form Validation
  const validateAdminOrderForm = () => {
    const errors = {};
    if (adminOrderType === 'Repeat Order') {
      if (!adminRepeatSelectedItemCode) {
        errors.repeatSelectedItemCode = 'Please select a past manufactured item to repeat.';
      }
    } else {
      if (!adminBrandName || !adminBrandName.trim()) {
        errors.brandName = 'Please enter a brand name.';
      }
    }
    if (!adminSelectedType) {
      errors.selectedType = 'Please select a category.';
    }
    if (adminSelectedType === 'Tag' || adminSelectedType === 'Tag Kit') {
      if (!adminIsMultiCard && !adminSelectedCatalogId) {
        errors.selectedCatalogId = 'Please select a paper catalog.';
      }
    } else if (adminSelectedType === 'PU Label' && !adminSelectedMaterial) {
      errors.selectedMaterial = 'Please select a material gauge.';
    }
    if (adminDoriOption === 'custom' && (!adminDoriCustom || !adminDoriCustom.trim())) {
      errors.doriCustom = 'Please specify custom dori details.';
    }
    if (adminPlasticOption === 'custom' && (!adminPlasticCustom || !adminPlasticCustom.trim())) {
      errors.plasticCustom = 'Please specify custom plastic lock details.';
    }
    if (!adminQty || Number(adminQty) <= 0) {
      errors.qty = 'Please enter a valid quantity in pieces (greater than 0).';
    }
    if (!adminRate || Number(adminRate) <= 0) {
      errors.rate = 'Please enter a valid rate per piece (greater than 0).';
    }
    setAdminStepValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Live Current Draft Item Object
  const adminCurrentDraftItem = React.useMemo(() => {
    let finalMaterial = adminSelectedMaterial;
    let chosenCards = [];
    let primaryCatalogId = null;
    let primaryCatalogCode = null;

    if (adminSelectedType === 'Tag' || adminSelectedType === 'Tag Kit') {
      if (adminIsMultiCard) {
        chosenCards = adminTagCards.map((c, i) => {
          const cat = availableCatalogs.find(x => x.id === c.catalogId) || availableCatalogs[0];
          return {
            cardIndex: i + 1,
            title: c.title,
            catalogId: cat.id,
            catalogCode: cat.code,
            name: cat.name,
            gsm: cat.gsm,
            finish: cat.finish,
            dimension: c.dimension || ''
          };
        });
        finalMaterial = `${adminTagCards.length}-Card Set: ` + chosenCards.map(c => c.catalogCode.split(' - ')[1] || c.catalogCode).join(' + ');
        primaryCatalogId = chosenCards[0]?.catalogId;
        primaryCatalogCode = chosenCards[0]?.catalogCode;
      } else {
        const cat = availableCatalogs.find(x => x.id === adminSelectedCatalogId) || availableCatalogs[0];
        chosenCards = [{
          cardIndex: 1,
          title: 'Single Card Tag',
          catalogId: cat.id,
          catalogCode: cat.code,
          name: cat.name,
          gsm: cat.gsm,
          finish: cat.finish,
          dimension: adminSingleCardDimension || ''
        }];
        finalMaterial = `${cat.code} (${cat.finish})`;
        primaryCatalogId = cat.id;
        primaryCatalogCode = cat.code;
      }
    } else if (adminSelectedType === 'PU Label') {
      if (adminPuOrigin === 'Indian') {
        finalMaterial = `Indian PU - ${adminPuThickness}mm`;
      } else {
        finalMaterial = 'Imported PU (Standard Quality)';
      }
    }

    const activeItemCode = (adminOrderType === 'Repeat Order' && adminRepeatSelectedItemCode)
      ? adminRepeatSelectedItemCode
      : currentAdminItemCode;
    const activeItemName = (adminOrderType === 'Repeat Order' && adminRepeatSelectedItemCode)
      ? (adminRepeatSelectedItemName || adminRepeatSelectedItemCode)
      : currentAdminDraftItemName;

    const isTagKit = adminSelectedType === 'Tag Kit';
    const doriValue = isTagKit
      ? 'None'
      : adminDoriOption === 'custom'
        ? `Custom: ${adminDoriCustom.trim()}`
        : adminDoriOption === 'none'
          ? 'None'
          : 'Reg. (₹0.20/pc)';
    const plasticValue = isTagKit
      ? 'None'
      : adminPlasticOption === 'custom'
        ? `Custom: ${adminPlasticCustom.trim()}`
        : adminPlasticOption === 'none'
          ? 'None'
          : 'Reg. (₹0.10/pc)';

    const quantityNum = Number(adminQty) || 0;
    const rateNum = Number(adminRate) || 0;
    const itemTotal = quantityNum * rateNum;

    return {
      id: 'ITEM-' + Date.now().toString().slice(-4),
      itemCode: activeItemCode,
      name: activeItemName,
      brandName: (adminBrandName || selectedCust?.company || '').trim(),
      type: adminSelectedType,
      isMultiCard: (adminSelectedType === 'Tag' || adminSelectedType === 'Tag Kit') ? adminIsMultiCard : false,
      cards: chosenCards,
      catalogId: primaryCatalogId,
      catalogCode: primaryCatalogCode,
      material: finalMaterial,
      dori: doriValue,
      doriRate: isTagKit || adminDoriOption === 'none' ? 0 : 0.20,
      plastic: plasticValue,
      plasticRate: isTagKit || adminPlasticOption === 'none' ? 0 : 0.10,
      image: adminOrderImage || 'https://placehold.co/120x120/1e293b/ffffff?text=' + encodeURIComponent(adminSelectedType),
      quantity: quantityNum,
      unitPrice: rateNum,
      total: itemTotal
    };
  }, [
    adminSelectedType,
    adminSelectedMaterial,
    adminSelectedCatalogId,
    adminIsMultiCard,
    adminTagCards,
    adminSingleCardDimension,
    availableCatalogs,
    adminPuOrigin,
    adminPuThickness,
    adminDoriOption,
    adminDoriCustom,
    adminPlasticOption,
    adminPlasticCustom,
    adminQty,
    adminRate,
    adminBrandName,
    selectedCust,
    adminOrderType,
    adminRepeatSelectedItemCode,
    adminRepeatSelectedItemName,
    currentAdminItemCode,
    currentAdminDraftItemName,
    adminOrderImage
  ]);

  // Calculations
  const adminStagedTotal = adminOrderItems.reduce((acc, i) => acc + i.total, 0);
  const adminDraftTotal = (Number(adminQty) || 0) * (Number(adminRate) || 0);
  const adminGrossTotal = adminStagedTotal + (adminOrderItems.length > 0 && (!adminBrandName.trim() || Number(adminQty) <= 0) ? 0 : adminDraftTotal);
  const adminFinalTotal = Math.max(0, adminGrossTotal - Number(adminOrderDiscount || 0));

  // Add Item to Staged Items
  const handleAdminAddItem = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateAdminOrderForm()) return;
    setAdminOrderItems(prev => [...prev, adminCurrentDraftItem]);

    // Reset inputs for next item
    setAdminBrandName('');
    setAdminOrderImage('');
    setAdminSingleCardDimension('');
    setAdminItemCodeManual(false);
    const defaultType = availableTypes[0];
    setAdminSelectedType(defaultType?.name || 'Tag');
    setAdminSelectedMaterial(defaultType?.materials[0] || '100 GSM');
    setAdminSelectedCatalogId(availableCatalogs[0]?.id || 'CAT-IV350');
    setAdminIsMultiCard(false);
    setAdminTagCards([
      { id: 1, title: 'Tag 1 (Base Tag)', catalogId: availableCatalogs[0]?.id || 'CAT-IV350', dimension: '' },
      { id: 2, title: 'Tag 2 (Upper Tag)', catalogId: availableCatalogs[1]?.id || 'CAT-KF280', dimension: '' }
    ]);
    setAdminQty(0);
    setAdminRate(0);
    setAdminDoriOption('reg');
    setAdminDoriCustom('');
    setAdminPlasticOption('reg');
    setAdminPlasticCustom('');
    setAdminStepValidationErrors({});
    const fileInput = document.getElementById('admin-file-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleAdminRemoveItem = (id) => {
    setAdminOrderItems(prev => prev.filter(i => i.id !== id));
  };

  // Submit Final Order (Single Click or Batch)
  const handleAdminSubmitOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (adminIsSubmitting) return;

    let itemsToSubmit = [...adminOrderItems];
    if (adminBrandName.trim() && Number(adminQty) > 0 && Number(adminRate) > 0) {
      itemsToSubmit.push(adminCurrentDraftItem);
    }

    if (itemsToSubmit.length === 0) {
      if (!validateAdminOrderForm()) return;
    }

    setAdminIsSubmitting(true);
    try {
      const orderId = window.uBMS.getNextAdminOrderId(selectedCust, orders);
      const customerOrderId = window.uBMS.getNextCustomerOrderId(selectedCust, orders);
      const nowIso = new Date().toISOString();
      const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      const orderGross = itemsToSubmit.reduce((acc, i) => acc + i.total, 0);
      const orderFinal = Math.max(0, orderGross - Number(adminOrderDiscount || 0));

      const newOrder = {
        id: orderId,
        customerOrderId: customerOrderId,
        orderType: adminOrderType || 'New Order',
        customerId: selectedCust.id,
        customerName: selectedCust.name,
        customerCompany: selectedCust.company || itemsToSubmit[0]?.brandName || adminBrandName,
        customerEmail: selectedCust.email,
        customerPhone: selectedCust.phone,
        status: 'confirmed',
        paymentStatus: 'pending',
        priority: 'standard',
        createdAt: nowIso,
        expectedDelivery: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        assignedTo: currentMember.name,
        assignedToId: currentMember.id,
        items: itemsToSubmit.map(i => ({
          id: i.id || ('ITEM-' + Date.now().toString().slice(-4)),
          itemCode: i.itemCode || i.name,
          name: i.name || i.itemCode,
          brandName: i.brandName,
          type: i.type,
          isMultiCard: !!i.isMultiCard,
          cards: i.cards || [],
          catalogId: i.catalogId || null,
          catalogCode: i.catalogCode || null,
          material: i.material,
          dori: i.dori,
          doriRate: i.doriRate || 0.20,
          plastic: i.plastic,
          plasticRate: i.plasticRate || 0.10,
          image: i.image,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total
        })),
        subtotal: orderGross,
        tax: 0,
        shipping: 0,
        discount: Number(adminOrderDiscount || 0),
        total: orderFinal,
        tracking: {
          carrier: 'Standard Logistics',
          trackingNumber: 'Processing',
          status: 'Order Booked by ' + currentMember.name,
          lastUpdate: formattedDate
        },
        timeline: [
          {
            stage: 'confirmed',
            title: 'Order Booked by Admin',
            description: `Booked by ${currentMember.name} for ${selectedCust.company} (${itemsToSubmit.length} item(s)).`,
            timestamp: formattedDate,
            author: currentMember.name
          }
        ],
        internalNotes: adminOrderNotes ? [
          { id: 'N-1', author: currentMember.name, text: adminOrderNotes, timestamp: formattedDate }
        ] : [],
        customerNotes: adminOrderNotes
      };

      let bookedOrder = null;
      if (window.uBMS.DataService && window.uBMS.DataService.createOrder) {
        bookedOrder = await window.uBMS.DataService.createOrder(newOrder);
      }
      onSaveOrder(bookedOrder || newOrder);

      // Reset
      setAdminOrderItems([]);
      setAdminOrderDiscount(0);
      setAdminOrderNotes('');
      setAdminBrandName(selectedCust?.company || '');
      setAdminOrderImage('');
      setAdminSingleCardDimension('');
      setAdminQty(0);
      setAdminRate(0);
      setAdminDoriOption('reg');
      setAdminDoriCustom('');
      setAdminPlasticOption('reg');
      setAdminPlasticCustom('');
      setAdminStepValidationErrors({});
      setAdminRepeatSelectedItemCode('');
      setAdminRepeatSelectedItemName('');
      setAdminRepeatSearchQuery('');
      setAdminIsSubmitting(false);

      setActiveTab('all_orders');
    } catch (err) {
      console.error(err);
      setAdminIsSubmitting(false);
    }
  };

  // --- MODULE 9: TAGS & LABELS CONFIG (ADD TYPES & MATERIALS) ---
  const [newTypeName, setNewTypeName] = React.useState('');
  const [newTypeMaterials, setNewTypeMaterials] = React.useState('');
  const [newTypeDefaultRate, setNewTypeDefaultRate] = React.useState(3.00);

  const [addMatTargetType, setAddMatTargetType] = React.useState(availableTypes[0]?.name || 'Tag');
  const [addMatName, setAddMatName] = React.useState('');

  const handleCreateNewType = (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    const materialsArray = newTypeMaterials
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    const newTypeObj = {
      id: 'TYPE-' + Date.now().toString().slice(-4),
      name: newTypeName.trim(),
      materials: materialsArray.length > 0 ? materialsArray : ['Standard'],
      defaultRate: Number(newTypeDefaultRate) || 2.00
    };

    const updated = [...availableTypes, newTypeObj];
    onUpdateLabelTypes(updated);
    setNewTypeName('');
    setNewTypeMaterials('');
    alert(`Type "${newTypeObj.name}" added with ${newTypeObj.materials.length} material(s)!`);
  };

  const handleAddMaterialToType = (e) => {
    e.preventDefault();
    if (!addMatName.trim()) return;

    const updated = availableTypes.map(t => {
      if (t.name === addMatTargetType) {
        if (t.materials.includes(addMatName.trim())) {
          alert('Material already exists under this type.');
          return t;
        }
        return {
          ...t,
          materials: [...t.materials, addMatName.trim()]
        };
      }
      return t;
    });

    onUpdateLabelTypes(updated);
    setAddMatName('');
    alert(`Added material "${addMatName.trim()}" to type "${addMatTargetType}"!`);
  };

  const handleRemoveMaterial = (typeName, materialToRemove) => {
    const updated = availableTypes.map(t => {
      if (t.name === typeName) {
        return {
          ...t,
          materials: t.materials.filter(m => m !== materialToRemove)
        };
      }
      return t;
    });
    onUpdateLabelTypes(updated);
  };

  // --- MODULE 3: CREATE INVOICE STATE ---
  const [invOrderId, setInvOrderId] = React.useState(orders[0]?.id || '');
  const [invDueDate, setInvDueDate] = React.useState('');
  const targetOrder = orders.find(o => o.id === invOrderId) || orders[0];

  const handleCreateInvoiceSubmit = (e) => {
    e.preventDefault();
    if (!targetOrder) return;

    const invId = 'INV-2026-0' + Math.floor(100 + Math.random() * 900);
    const newInv = {
      id: invId,
      orderId: targetOrder.id,
      customerId: targetOrder.customerId,
      customerName: targetOrder.customerName,
      customerCompany: targetOrder.customerCompany,
      issueDate: new Date().toISOString(),
      dueDate: invDueDate ? new Date(invDueDate).toISOString() : new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
      items: targetOrder.items,
      subtotal: targetOrder.subtotal,
      tax: targetOrder.tax,
      shipping: targetOrder.shipping,
      total: targetOrder.total,
      paidAmount: targetOrder.paymentStatus === 'paid' ? targetOrder.total : 0,
      balanceDue: targetOrder.paymentStatus === 'paid' ? 0 : targetOrder.total,
      status: targetOrder.paymentStatus === 'paid' ? 'paid' : 'unpaid'
    };

    onSaveInvoice(newInv);
    alert(`Tax Invoice ${invId} created for order ${targetOrder.id}!`);
    setActiveTab('all_invoices');
  };

  // --- MODULE 5: LEDGERS PARTY SELECTION ---
  const [selectedLedgerPartyId, setSelectedLedgerPartyId] = React.useState(users.customers[0]?.id || '');
  const partyLedger = React.useMemo(() => {
    return window.uBMS.computeCustomerGeneralLedger(selectedLedgerPartyId, invoices, payments);
  }, [selectedLedgerPartyId, invoices, payments]);

  // --- MODULE 6: PAYMENT ENTRIES STATE ---
  const [payCustId, setPayCustId] = React.useState(users.customers[0]?.id || '');
  const [payInvId, setPayInvId] = React.useState('');
  const [payAmount, setPayAmount] = React.useState('');
  const [payMode, setPayMode] = React.useState('NEFT / Bank Transfer');
  const [payRefNo, setPayRefNo] = React.useState('');
  const [payNotes, setPayNotes] = React.useState('');

  const custPendingInvoices = invoices.filter(i => i.customerId === payCustId && i.balanceDue > 0);

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return alert('Enter a valid payment amount.');

    const payCust = users.customers.find(c => c.id === payCustId);
    const payId = 'PAY-2026-0' + Math.floor(100 + Math.random() * 900);
    const amt = Number(payAmount);

    const newPayment = {
      id: payId,
      invoiceId: payInvId || 'General Account',
      orderId: 'N/A',
      customerId: payCustId,
      customerName: payCust?.name || 'Customer',
      customerCompany: payCust?.company || 'Company',
      date: new Date().toISOString(),
      amount: amt,
      paymentMode: payMode,
      referenceNumber: payRefNo.trim() || ('TXN-' + Date.now().toString().slice(-6)),
      receivedBy: currentMember.name,
      notes: payNotes.trim()
    };

    onSavePayment(newPayment, payInvId, amt);
    setPayAmount('');
    setPayRefNo('');
    setPayNotes('');
    alert(`Payment of ${formatCurrency(amt)} recorded under Receipt ${payId}!`);
  };

  // --- MODULE 7: SHOP-FLOOR PRODUCTION PIPELINE HANDLERS ---
  const [productionFilterStage, setProductionFilterStage] = React.useState('all');
  const [sheetInputs, setSheetInputs] = React.useState({}); // { [jobId]: { printed: '', waste: '', punched: '', pieces: '', doriRate: 0.20, plasticRate: 0.10, labourerId: '' } }
  const [dispatchModalOrder, setDispatchModalOrder] = React.useState(null);
  const [dispatchCarrier, setDispatchCarrier] = React.useState('Bluedart Express');
  const [dispatchTrackingNo, setDispatchTrackingNo] = React.useState('');

  const getSheetInput = (jobId, field, defaultValue = '') => {
    return sheetInputs[jobId]?.[field] !== undefined ? sheetInputs[jobId][field] : defaultValue;
  };

  const setSheetInput = (jobId, field, value) => {
    setSheetInputs(prev => ({
      ...prev,
      [jobId]: {
        ...(prev[jobId] || {}),
        [field]: value
      }
    }));
  };

  // 1. Paper Cutting Handlers
  const handleStartCutting = (job) => {
    const operator = getSheetInput(job.jobId, 'cuttingOperator', job.cutting?.operatorName || 'Ramesh');
    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      cutting: {
        ...(j.cutting || {}),
        status: 'in_progress',
        operatorName: operator,
        startTime: new Date().toISOString()
      }
    } : j);
    onUpdateProduction(updated);
  };

  const handleCompleteCutting = (job) => {
    const issued = Number(job.issuedSheets || job.targetSheets || 520);
    const rawCut = getSheetInput(job.jobId, 'cutSheets');
    const cutCount = (rawCut !== undefined && rawCut !== '') ? Number(rawCut) : issued;
    // System automatically calculates cutting waste
    const wasteCount = Math.max(0, issued - cutCount);
    const operator = getSheetInput(job.jobId, 'cuttingOperator', job.cutting?.operatorName || 'Ramesh');

    const nextStage = getNextCycleStep(job, 'cutting');

    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      currentStage: nextStage,
      cutting: {
        ...(j.cutting || {}),
        status: 'completed',
        operatorName: operator,
        completedTime: new Date().toISOString(),
        goodSheetsCut: cutCount,
        wasteSheets: wasteCount
      },
      ...(nextStage !== 'completed' && nextStage in j ? {
        [nextStage]: {
          ...(j[nextStage] || {}),
          status: 'pending'
        }
      } : {})
    } : j);
    onUpdateProduction(updated);
  };

  // 2. Printing Handlers
  const handleStartPrinting = (job) => {
    const operator = getSheetInput(job.jobId, 'printingOperator', job.printing?.operatorName || 'Kanu');
    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      printing: {
        ...(j.printing || {}),
        status: 'in_progress',
        operatorName: operator,
        startTime: new Date().toISOString()
      }
    } : j);
    onUpdateProduction(updated);
  };

  const handleCompletePrinting = (job) => {
    const rawPrinted = getSheetInput(job.jobId, 'printed');
    const printedCount = Number(rawPrinted);
    if (!rawPrinted || isNaN(printedCount) || printedCount <= 0) {
      return alert('Mandatory: Please write down the exact number of sheets printed before proceeding.');
    }

    const inputSheets = Number(job.cutting?.goodSheetsCut || job.issuedSheets || job.targetSheets || 520);
    // System automatically calculates printing waste
    const wasteCount = Math.max(0, inputSheets - printedCount);
    const operator = getSheetInput(job.jobId, 'printingOperator', job.printing?.operatorName || 'Kanu');

    // Spoilage / Threshold Check against customer net order sheets
    const floor = job.minimumAllowedFloor || Math.ceil((job.orderQty || 1000) / (job.ups || 10));
    if (printedCount < floor) {
      setShortageAlertJob({
        job,
        printedSheets: printedCount,
        wasteSheets: wasteCount
      });
      return;
    }

    const nextStage = getNextCycleStep(job, 'printing');

    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      currentStage: nextStage,
      printing: {
        ...(j.printing || {}),
        status: 'completed',
        operatorName: operator,
        completedTime: new Date().toISOString(),
        goodSheetsPrinted: printedCount,
        wasteSheets: wasteCount
      },
      ...(nextStage !== 'completed' && nextStage in j ? {
        [nextStage]: {
          ...(j[nextStage] || {}),
          status: 'pending'
        }
      } : {})
    } : j);
    onUpdateProduction(updated);

    // Auto-deplete paper sheets from inventory
    if (onUpdateInventory && inventory && inventory.length > 0) {
      const sheetsToDeduct = (printedCount + wasteCount) || job.issuedSheets || job.targetSheets || 520;
      const targetCatId = job.catalogId || (job.subCards && job.subCards[0]?.catalogId);
      const updatedInv = inventory.map(item => {
        if (item.category === 'paper' && (item.catalogId === targetCatId || (targetCatId && item.id.includes(targetCatId)))) {
          return {
            ...item,
            currentStock: Math.max(0, (item.currentStock || 0) - sheetsToDeduct),
            lastDeductedDate: new Date().toISOString().split('T')[0],
            lastDeductedJob: job.jobId
          };
        }
        return item;
      });
      onUpdateInventory(updatedInv);
    }
  };

  const handleResolveShortageAlert = (decision) => {
    if (!shortageAlertJob) return;
    const { job, printedSheets, wasteSheets } = shortageAlertJob;
    if (decision === 'accept_short') {
      const nextStage = getNextCycleStep(job, 'printing');
      const updated = production.map(j => j.jobId === job.jobId ? {
        ...j,
        currentStage: nextStage,
        printing: {
          ...(j.printing || {}),
          status: 'completed',
          completedTime: new Date().toISOString(),
          goodSheetsPrinted: printedSheets,
          wasteSheets: wasteSheets,
          shortageApproved: true
        },
        ...(nextStage !== 'completed' && nextStage in j ? {
          [nextStage]: {
            ...(j[nextStage] || {}),
            status: 'pending'
          }
        } : {})
      } : j);
      onUpdateProduction(updated);

      // Auto-deplete paper sheets from inventory
      if (onUpdateInventory && inventory && inventory.length > 0) {
        const sheetsToDeduct = (printedSheets + wasteSheets) || job.issuedSheets || job.targetSheets || 520;
        const targetCatId = job.catalogId || (job.subCards && job.subCards[0]?.catalogId);
        const updatedInv = inventory.map(item => {
          if (item.category === 'paper' && (item.catalogId === targetCatId || (targetCatId && item.id.includes(targetCatId)))) {
            return {
              ...item,
              currentStock: Math.max(0, (item.currentStock || 0) - sheetsToDeduct),
              lastDeductedDate: new Date().toISOString().split('T')[0],
              lastDeductedJob: job.jobId
            };
          }
          return item;
        });
        onUpdateInventory(updatedInv);
      }

      setShortageAlertJob(null);
    } else {
      const floor = job.minimumAllowedFloor || Math.ceil((job.orderQty || 1000) / (job.ups || 10));
      alert(`Reprint ticket created for missing ${(floor - printedSheets)} sheets.`);
      setShortageAlertJob(null);
    }
  };

  // 3. Punching & Packing Handlers
  const handleStartPunching = (job) => {
    const operator = getSheetInput(job.jobId, 'punchingOperator', job.punching?.operatorName || 'Shivakant');
    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      punching: {
        ...(j.punching || {}),
        status: 'in_progress',
        operatorName: operator,
        startTime: new Date().toISOString()
      }
    } : j);
    onUpdateProduction(updated);
  };

  const handleCompletePunching = (job) => {
    const inputSheets = Number(job.printing?.goodSheetsPrinted || job.cutting?.goodSheetsCut || job.issuedSheets || job.targetSheets || 520);
    const rawPunched = getSheetInput(job.jobId, 'punched');
    const punchedCount = Number(rawPunched);
    if (!rawPunched || isNaN(punchedCount) || punchedCount <= 0) {
      return alert('Mandatory: Please write down the number of sheets punched before proceeding.');
    }

    // System automatically calculates punching waste
    const wasteCount = Math.max(0, inputSheets - punchedCount);
    const operator = getSheetInput(job.jobId, 'punchingOperator', job.punching?.operatorName || 'Shivakant');

    const nextStage = getNextCycleStep(job, 'punching');

    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      currentStage: nextStage,
      punching: {
        ...(j.punching || {}),
        status: 'completed',
        operatorName: operator,
        completedTime: new Date().toISOString(),
        goodSheetsPunched: punchedCount,
        wasteSheets: wasteCount
      },
      ...(nextStage !== 'completed' && nextStage in j ? {
        [nextStage]: {
          ...(j[nextStage] || {}),
          status: 'pending'
        }
      } : {})
    } : j);
    onUpdateProduction(updated);
  };

  // 4. Handwork (Dori & Plastic) Handlers
  const handleAssignHandwork = (job) => {
    const labourerId = getSheetInput(job.jobId, 'labourerId');
    const labourer = users.team.find(u => u.id === labourerId);
    if (!labourer) return alert('Please select a labourer to assign this handwork job.');

    const dRate = Number(getSheetInput(job.jobId, 'doriRate', job.handwork?.doriRate || 0.20));
    const pRate = Number(getSheetInput(job.jobId, 'plasticRate', job.handwork?.plasticRate || 0.10));
    const totRate = dRate + pRate;

    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      handwork: {
        ...(j.handwork || {}),
        assignedLabourerId: labourer.id,
        assignedLabourerName: labourer.name,
        doriRate: dRate,
        plasticRate: pRate,
        totalRatePerTag: totRate
      }
    } : j);
    onUpdateProduction(updated);
  };

  const handleStartHandwork = (job) => {
    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      handwork: {
        ...(j.handwork || {}),
        status: 'in_progress',
        startTime: new Date().toISOString()
      }
    } : j);
    onUpdateProduction(updated);
  };

  const handleCompleteHandwork = (job) => {
    const ups = Number(job.ups || 10);
    const receivedTags = Number((job.punching?.goodSheetsPunched || job.targetSheets || 520) * ups);
    const rawPieces = getSheetInput(job.jobId, 'handworkPieces');
    const pieces = Number(rawPieces);
    if (!rawPieces || isNaN(pieces) || pieces <= 0) {
      return alert('Mandatory: Please enter the final completed tags count (pcs) before proceeding.');
    }
    // System automatically calculates handwork tag wastage
    const wasteTags = Math.max(0, receivedTags - pieces);
    const rate = Number(job.handwork?.totalRatePerTag) || 0.30;
    const earnedPayout = pieces * rate;

    const nextStage = getNextCycleStep(job, 'handwork');

    // 1. Update Job Stage
    const updatedProd = production.map(j => j.jobId === job.jobId ? {
      ...j,
      currentStage: nextStage,
      handwork: {
        ...(j.handwork || {}),
        status: 'completed',
        completedTime: new Date().toISOString(),
        completedPieces: pieces,
        wastePieces: wasteTags,
        earnedPayout: earnedPayout
      },
      ...(nextStage === 'dispatch' || nextStage === 'godown' ? {
        dispatch: {
          ...(j.dispatch || {}),
          status: 'pending'
        },
        godown: {
          status: 'ready_dispatch',
          receivedTime: new Date().toISOString(),
          verifiedCount: pieces,
          location: 'Bay 01 - Finished Goods'
        }
      } : nextStage !== 'completed' && nextStage in j ? {
        [nextStage]: {
          ...(j[nextStage] || {}),
          status: 'pending'
        }
      } : {})
    } : j);
    onUpdateProduction(updatedProd);

    // 2. Update Order to ready_dispatch
    const parentOrder = orders.find(o => o.id === job.orderId);
    if (parentOrder) {
      const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      const updatedOrder = {
        ...parentOrder,
        status: 'ready_dispatch',
        timeline: [
          ...(parentOrder.timeline || []),
          {
            stage: 'ready_dispatch',
            title: 'Dori & Plastic Handwork Completed',
            description: `${pieces} tags completed by ${job.handwork?.assignedLabourerName || 'Artisan'}. Moved to godown / dispatch stage.`,
            timestamp: formattedDate,
            author: job.handwork?.assignedLabourerName || currentMember.name
          }
        ]
      };
      onUpdateOrder(updatedOrder);
    }

    // 3. Auto-Credit Labourer in Payroll
    if (job.handwork?.assignedLabourerId) {
      const workerId = job.handwork.assignedLabourerId;
      const workerName = job.handwork.assignedLabourerName;
      const today = new Date().toISOString().split('T')[0];
      const newLedgerItem = {
        date: today,
        jobId: job.jobId,
        orderId: job.orderId,
        staffId: workerId,
        name: workerName,
        piecesCompleted: pieces,
        ratePerTag: rate,
        earnedAmount: earnedPayout,
        status: 'Earned'
      };

      const existingStaff = (payroll.staffSummary || []).find(s => s.staffId === workerId);
      let updatedSummary = payroll.staffSummary || [];
      if (existingStaff) {
        updatedSummary = updatedSummary.map(s => s.staffId === workerId ? {
          ...s,
          netPayable: (s.netPayable || 0) + earnedPayout,
          bonus: (s.bonus || 0) + earnedPayout
        } : s);
      } else {
        updatedSummary = [
          ...updatedSummary,
          {
            staffId: workerId,
            name: workerName,
            role: 'Handwork Artisan (Dori & Plastic)',
            department: 'Handwork Assembly',
            monthlySalary: 0,
            workingDays: 26,
            presentDays: 26,
            netPayable: earnedPayout,
            status: 'Processing'
          }
        ];
      }

      onUpdatePayroll({
        ...payroll,
        staffSummary: updatedSummary,
        pieceRateLedger: [newLedgerItem, ...(payroll.pieceRateLedger || [])]
      });
    }

    // Auto-deplete dori cords and plastic locks from inventory
    if (onUpdateInventory && inventory && inventory.length > 0) {
      const updatedInv = inventory.map(item => {
        if (item.category === 'dori') {
          return {
            ...item,
            currentStock: Math.max(0, (item.currentStock || 0) - pieces),
            lastDeductedDate: new Date().toISOString().split('T')[0],
            lastDeductedJob: job.jobId
          };
        }
        if (item.category === 'plastic') {
          return {
            ...item,
            currentStock: Math.max(0, (item.currentStock || 0) - pieces),
            lastDeductedDate: new Date().toISOString().split('T')[0],
            lastDeductedJob: job.jobId
          };
        }
        return item;
      });
      onUpdateInventory(updatedInv);
    }
  };

  // 5. Shop-Floor Production Dispatch Completion
  const handleCompleteDispatch = (job) => {
    const rawCarrier = getSheetInput(job.jobId, 'dispatchCarrier', 'BlueDart Express');
    const rawTrk = getSheetInput(job.jobId, 'dispatchTracking', 'TRK-' + Math.floor(100000 + Math.random() * 900000));
    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      currentStage: 'completed',
      dispatch: {
        ...(j.dispatch || {}),
        status: 'completed',
        dispatchedTime: new Date().toISOString(),
        carrier: rawCarrier,
        trackingNumber: rawTrk,
        verifiedPieces: j.handwork?.completedPieces || j.targetQty || 1000
      },
      godown: {
        ...(j.godown || {}),
        status: 'shipped'
      }
    } : j);
    onUpdateProduction(updated);

    const otherJobsOfOrder = updated.filter(j => j.orderId === job.orderId && j.jobId !== job.jobId);
    const allDone = otherJobsOfOrder.every(j => j.currentStage === 'completed');
    if (allDone) {
      const parentOrder = orders.find(o => o.id === job.orderId);
      if (parentOrder) {
        onUpdateOrder({
          ...parentOrder,
          status: 'shipped',
          tracking: {
            carrier: rawCarrier,
            trackingNumber: rawTrk,
            status: 'Dispatched from Factory',
            lastUpdate: formattedDate
          },
          timeline: [
            ...(parentOrder.timeline || []),
            {
              stage: 'shipped',
              title: 'All Production Jobs Completed & Dispatched',
              description: `Job ${job.jobId} completed dispatch via ${rawCarrier} (${rawTrk}).`,
              timestamp: formattedDate,
              author: currentMember.name
            }
          ]
        });
      }
    }
  };

  // 6. Godown Dispatch Modal Handler
  const handleDispatchOrderSubmit = (e) => {
    e.preventDefault();
    if (!dispatchModalOrder) return;
    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const finalTracking = dispatchTrackingNo.trim() || ('TRK-' + Math.floor(100000 + Math.random() * 900000));

    const updated = {
      ...dispatchModalOrder,
      status: 'shipped',
      tracking: {
        carrier: dispatchCarrier,
        trackingNumber: finalTracking,
        status: 'Dispatched from Factory Godown',
        lastUpdate: formattedDate
      },
      timeline: [
        ...(dispatchModalOrder.timeline || []),
        {
          stage: 'shipped',
          title: 'Order Dispatched from Factory Godown',
          description: `Dispatched via ${dispatchCarrier} (Tracking: ${finalTracking}) following invoice & billing verification.`,
          timestamp: formattedDate,
          author: currentMember.name
        }
      ]
    };
    onUpdateOrder(updated);
    setDispatchModalOrder(null);
    setDispatchTrackingNo('');
  };

  // --- MODULE 8: ATTENDANCE TOGGLE ---
  const handleToggleAttendance = (staffId, newStatus) => {
    const updatedDaily = payroll.dailyAttendance.map(a => {
      if (a.staffId === staffId) {
        return { ...a, status: newStatus };
      }
      return a;
    });
    onUpdatePayroll({ ...payroll, dailyAttendance: updatedDaily });
  };

  // --- ADMIN ORDER REGISTER: APPROVE, REJECT & BULK ACTIONS ---
  const handleToggleSelectOrder = (orderId) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length > 0 && selectedOrderIds.length === filteredAdminOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredAdminOrders.map(o => o.id));
    }
  };

  const createProductionJobsForOrder = (order) => {
    let createdJobs = [];
    const defaultCycle = availableCycles[0] || DEFAULT_CYCLES[0];
    const cycleSteps = defaultCycle.steps;
    const initialStage = cycleSteps[0]?.key || 'cutting';
    const todayStr = new Date().toISOString().split('T')[0];

    (order.items || []).forEach((item, itemIdx) => {
      const pcs = Number(item.quantity) || 1000;
      const isMulti = !!item.isMultiCard;
      const cardsList = isMulti && item.cards && item.cards.length > 0 ? item.cards : [
        {
          cardIndex: 1,
          title: item.name || item.itemCode || 'Single Card Tag',
          catalogCode: item.catalogCode || item.material || 'Paper #01 (Art Card 350 GSM)',
          gsm: 300,
          finish: 'Matte'
        }
      ];

      cardsList.forEach((card, cardIdx) => {
        let paper = card.catalogCode || card.material || item.material || 'Paper #01 (Art Card 350 GSM)';
        const matchedCat = availableCatalogs.find(c => c.code === paper || c.name === paper || c.id === card.catalogId);
        if (matchedCat) {
          paper = `${matchedCat.code || ''} ${matchedCat.name || ''}`.trim();
        }

        const wastage = getWastageTags(pcs);
        const totalProdTags = pcs + wastage;
        const ups = 10;
        const totalSheets = Math.ceil(totalProdTags / ups);
        const floor = Math.ceil(pcs / ups);
        const jobNum = formatJobCardNumber(order, itemIdx, cardIdx, cardsList.length);
        const custOrdCode = order.customerOrderId || (order.id ? order.id.split('-').pop() : '01');
        const cardImg = card.image || card.artwork || item.image || item.artwork || order.artwork || null;
        const party = order.customerCompany || order.customerName || 'Standard Client';

        createdJobs.push({
          jobId: jobNum,
          jobNumber: jobNum,
          customerOrderId: custOrdCode,
          image: cardImg,
          date: todayStr,
          orderId: order.id,
          orderNumber: order.id,
          partyName: party,
          customerCompany: party,
          customerName: order.customerName,
          paperName: paper,
          catalogCode: paper,
          orderQty: pcs,
          wastageQty: wastage,
          productionQty: totalProdTags,
          targetQty: totalProdTags,
          numPrintingColors: 4,
          namePrintingColors: 'CMYK (Full Color)',
          priority: order.priority || 'standard',
          cycleId: defaultCycle.id,
          cycleName: defaultCycle.name,
          cycleSteps: cycleSteps,
          currentStage: initialStage,
          itemName: item.name || item.itemCode || `Item #${itemIdx + 1}`,
          cardTitle: card.title || `Card #${cardIdx + 1}`,
          cardIndex: cardIdx + 1,
          totalCardsInSet: cardsList.length,
          isMultiCardComponent: cardsList.length > 1,
          type: item.type || 'Tag',
          ups: ups,
          targetSheets: totalSheets,
          bufferSheets: 0,
          issuedSheets: totalSheets,
          minimumAllowedFloor: floor,
          cutting: {
            status: initialStage === 'cutting' ? 'pending' : 'locked',
            operatorName: 'Ramesh',
            startTime: null,
            completedTime: null,
            goodSheetsCut: null,
            wasteSheets: null
          },
          printing: {
            status: initialStage === 'printing' ? 'pending' : 'locked',
            operatorName: 'Kanu',
            startTime: null,
            completedTime: null,
            goodSheetsPrinted: null,
            wasteSheets: null
          },
          punching: {
            status: initialStage === 'punching' ? 'pending' : 'locked',
            operatorName: 'Shivakant',
            startTime: null,
            completedTime: null,
            goodSheetsPunched: null,
            wasteSheets: null
          },
          handwork: {
            status: initialStage === 'handwork' ? 'pending' : 'locked',
            doriType: item.dori || 'Reg. Cotton Dori',
            doriRate: item.doriRate || 0.20,
            plasticType: item.plastic || 'Reg. Plastic Lock',
            plasticRate: item.plasticRate || 0.10,
            totalRatePerTag: (item.doriRate || 0.20) + (item.plasticRate || 0.10),
            assignedLabourerId: null,
            assignedLabourerName: null,
            startTime: null,
            completedTime: null,
            completedPieces: null,
            earnedPayout: null
          },
          dispatch: {
            status: initialStage === 'dispatch' ? 'pending' : 'locked',
            readyTime: null,
            dispatchedTime: null,
            verifiedPieces: null,
            carrier: null,
            trackingNumber: null
          },
          godown: {
            status: 'pending',
            location: 'Bay 01 - Finished Goods'
          }
        });
      });
    });
    return createdJobs;
  };

  const handleApproveOrder = (order) => {
    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const updated = {
      ...order,
      status: 'in_production',
      timeline: [
        ...(order.timeline || []),
        {
          stage: 'approved',
          title: 'Order Approved by Admin',
          description: `Approved by ${currentMember.name}. Auto-moved to production.`,
          timestamp: formattedDate,
          author: currentMember.name
        },
        {
          stage: 'in_production',
          title: 'Production Job Form Created',
          description: 'Production job cards created. Scheduled for printing.',
          timestamp: formattedDate,
          author: currentMember.name
        }
      ]
    };
    onUpdateOrder(updated);

    const newJobs = createProductionJobsForOrder(order);
    if (newJobs.length > 0) {
      onUpdateProduction([...newJobs, ...(production || [])]);
    }
  };

  const handleOpenRejectModal = (order) => {
    setRejectionModalOrder(order);
    setRejectionReasonChoice('Paper Catalog temporarily out of stock');
    setRejectionReasonCustom('');
  };

  const handleConfirmRejection = () => {
    if (!rejectionModalOrder) return;
    const finalReason = rejectionReasonChoice === 'Other' 
      ? (rejectionReasonCustom.trim() || 'Specification revision required') 
      : rejectionReasonChoice;
    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const updated = {
      ...rejectionModalOrder,
      status: 'rejected',
      rejectionReason: finalReason,
      timeline: [
        ...(rejectionModalOrder.timeline || []),
        {
          stage: 'rejected',
          title: 'Order Rejected by Admin',
          description: `Rejected by ${currentMember.name}: ${finalReason}`,
          timestamp: formattedDate,
          author: currentMember.name
        }
      ]
    };
    onUpdateOrder(updated);
    setRejectionModalOrder(null);
    setRejectionReasonCustom('');
  };

  // Forward order to the Sheet Quantity Allocation & Production Modal
  const handleMoveToProduction = (order) => {
    handleOpenMoveToProduction(order);
  };

  const handleBulkStatusChange = (newStatus) => {
    if (selectedOrderIds.length === 0) return;
    const formattedStage = newStatus.replace(/_/g, ' ');
    if (!confirm(`Are you sure you want to move ${selectedOrderIds.length} order(s) to "${formattedStage}"?`)) return;
    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    
    selectedOrderIds.forEach(orderId => {
      const o = orders.find(x => x.id === orderId);
      if (o) {
        const updated = {
          ...o,
          status: newStatus,
          timeline: [
            ...(o.timeline || []),
            {
              stage: newStatus,
              title: `Bulk Status Update to ${formattedStage}`,
              description: `Bulk status update executed by ${currentMember.name}.`,
              timestamp: formattedDate,
              author: currentMember.name
            }
          ]
        };
        onUpdateOrder(updated);
      }
    });
    setSelectedOrderIds([]);
  };

  // Two-Tier Navigation: Active Group & its Sub-Tabs
  const currentGroupId = window.uBMS.getAdminGroupForTab ? window.uBMS.getAdminGroupForTab(activeTab) : 'orders';
  const activeGroup = (window.uBMS.ADMIN_NAV_GROUPS || []).find(g => g.id === currentGroupId) || (window.uBMS.ADMIN_NAV_GROUPS && window.uBMS.ADMIN_NAV_GROUPS[1]);
  const groupTabs = activeGroup?.tabs || [];

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Minimized Compact Bar (hidden on AI dashboard) */}
      {activeTab !== 'dashboard' && (bannerMinimized ? (
        <div className="bg-white/95 rounded-2xl px-4 py-2.5 text-slate-800 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3 animate-fade-in sticky top-16 z-30 backdrop-blur-md">
          {/* Navigation Sub-Tabs for Active Group */}
          <div className="flex items-center space-x-2 overflow-x-auto py-0.5 scrollbar-none flex-1 min-w-[280px]">
            <span className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg shrink-0">
              {activeGroup?.label || 'Orders'}
            </span>
            <span className="text-slate-300 text-xs">/</span>
            {groupTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white font-medium shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-normal'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Right: Quick actions & expand toggle */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setActiveTab('place_order')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-all flex items-center space-x-1"
              title="Book Order"
            >
              <span>+ Order</span>
            </button>

            <button
              onClick={() => setBannerMinimized(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 transition-all flex items-center space-x-1"
              title="Expand full operations banner"
            >
              <span className="text-[11px]">Expand &darr;</span>
            </button>
          </div>
        </div>
      ) : (
        /* Full Hero Banner (on Dashboard or when manually expanded) */
        <div className="bg-white rounded-2xl p-6 sm:p-7 text-slate-800 shadow-xs border border-slate-200 relative animate-fade-in">
          {/* Minimize Toggle in Top Right */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <button
              onClick={() => setBannerMinimized(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 transition-all flex items-center space-x-1"
              title="Minimize header banner to save screen space"
            >
              <span className="text-[11px]">Minimize &uarr;</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-16 sm:pr-24">
            <div>
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium mb-2 border border-slate-200">
                <span>Tags &amp; Labels Operations Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Enterprise Operations Control
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Logged in: <strong className="text-slate-900">{currentMember.name}</strong> ({currentMember.roleLabel || currentMember.role}) &bull; Department: {currentMember.department}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('place_order')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1"
              >
                <span>+ Book Order</span>
              </button>
              <button
                onClick={() => setActiveTab('label_config')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3.5 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1 border border-slate-200"
              >
                <span>Paper &amp; Types</span>
              </button>
            </div>
          </div>

          {/* Modular Sub-Navigation Bar */}
          <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
            <span className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-lg shrink-0">
              {activeGroup?.label || 'Orders'}
            </span>
            <span className="text-slate-300 text-xs">/</span>
            {groupTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white font-medium shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-normal'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* MODULE 0: DASHBOARD V18 & PROFILE (Exact Replica of Video UI) */}
      {(activeTab === 'dashboard' || activeTab === 'profile') && (
        <window.uBMS.DashboardV18
          activeTab={activeTab}
          portalType="admin"
          persona={currentMember}
          orders={orders}
          users={users}
          onNavigateTab={setActiveTab}
        />
      )}

      {/* MODULE 1: PRODUCTION ORDER STUDIO (ADMIN ON-BEHALF STUDIO) */}
      {activeTab === 'place_order' && (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
          
          {/* Studio Top Header: Refined uBMS Design */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Production Order Studio
                </h1>
                <span className="text-xs bg-slate-900 text-white font-mono font-bold px-2.5 py-1 rounded-md shadow-xs" title="Auto-generated sequential Order ID">
                  {currentAdminOrderId}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-medium">
                  Admin Entry Console
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Precision manufacturing order entry with dynamic materials, custom trims, prepress proof &amp; instant booking.
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleAdminSubmitOrder}
                disabled={adminIsSubmitting}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
              >
                {adminIsSubmitting ? (
                  <span>Booking Order...</span>
                ) : (
                  <>
                    <span>Confirm &amp; Book Order</span>
                    <span className="font-bold">&rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main Studio Workspace: 2-Column Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            
            {/* LEFT COLUMN (7 cols): The Production Specification Sheet */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* SECTION 1: Customer Account & Production Run Type */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                
                {/* Customer Account Party Selection - Structured Same as Brand Name Entry */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Customer Account Party <span className="text-rose-500">*</span>
                    </label>
                    {users.customers.length > 0 && (
                      <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                        <span>Parties:</span>
                        {users.customers.slice(0, 4).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomerParty(c)}
                            className={`px-2 py-0.5 rounded transition-colors cursor-pointer font-medium ${
                              selectedCust?.id === c.id 
                                ? 'bg-slate-900 text-white shadow-2xs' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {c.company}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type customer party name (e.g. MG Creation / Aariya Creation / TagX)..."
                      value={adminCustomerPartyQuery}
                      onFocus={() => setAdminCustomerInputFocused(true)}
                      onChange={(e) => {
                        setAdminCustomerPartyQuery(e.target.value);
                        setAdminCustomerInputFocused(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setAdminCustomerInputFocused(false), 200);
                      }}
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 focus:ring-slate-400 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 font-medium shadow-2xs transition-all"
                      autoComplete="off"
                    />
                    {/* Floating Customer Suggestions */}
                    {adminCustomerInputFocused && filteredCustomerSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 max-h-56 overflow-y-auto">
                        <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                          <span>Registered Customer Parties</span>
                          <span>{filteredCustomerSuggestions.length} found</span>
                        </div>
                        {filteredCustomerSuggestions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectCustomerParty(c);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${
                              selectedCust?.id === c.id ? 'bg-indigo-50/70' : ''
                            }`}
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-900">{c.company}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {c.name} {c.phone ? `• ${c.phone}` : ''} {c.abbr ? `[${c.abbr}]` : ''}
                              </div>
                            </div>
                            <span className="text-[10px] text-brand-600 font-semibold">
                              {selectedCust?.id === c.id ? '✓ Selected' : 'Select →'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      Production Run Type
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Choose whether you are booking a new design run or repeating a past manufactured order.
                    </p>
                  </div>
                </div>

                {/* Elegant Segmented Switcher */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminOrderType('New Order');
                      setAdminRepeatSelectedItemCode('');
                      setAdminRepeatSelectedItemName('');
                      setAdminRepeatSearchQuery('');
                      if (adminStepValidationErrors.orderType) {
                        setAdminStepValidationErrors(prev => ({ ...prev, orderType: null }));
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      adminOrderType === 'New Order'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>+ New Design Order</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminOrderType('Repeat Order');
                      if (adminStepValidationErrors.orderType) {
                        setAdminStepValidationErrors(prev => ({ ...prev, orderType: null }));
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      adminOrderType === 'Repeat Order'
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>&#8635; Repeat Past Item</span>
                  </button>
                </div>

                {/* IF REPEAT ORDER: Searchable Autocomplete Picker */}
                {adminOrderType === 'Repeat Order' && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Select Item to Repeat for {selectedCust?.company} <span className="text-rose-500">*</span>
                      </label>
                      {adminRepeatSelectedItemCode && (
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            &#10003; {adminRepeatSelectedItemCode} Loaded
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminRepeatSelectedItemCode('');
                              setAdminRepeatSelectedItemName('');
                              setAdminRepeatSearchQuery('');
                            }}
                            className="text-[10px] text-slate-400 hover:text-rose-600 underline font-medium cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                    {adminCustomerPastItems.length > 0 ? (
                      <div className="relative">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Type to search customer's past items by code, brand, or name..."
                            value={adminRepeatSearchQuery}
                            onFocus={() => setAdminRepeatInputFocused(true)}
                            onChange={(e) => {
                              setAdminRepeatSearchQuery(e.target.value);
                              setAdminRepeatInputFocused(true);
                              if (!e.target.value.trim()) {
                                setAdminRepeatSelectedItemCode('');
                                setAdminRepeatSelectedItemName('');
                              }
                              if (adminStepValidationErrors.repeatSelectedItemCode) {
                                setAdminStepValidationErrors(prev => ({ ...prev, repeatSelectedItemCode: null }));
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => setAdminRepeatInputFocused(false), 200);
                            }}
                            className={`w-full bg-slate-50/70 hover:bg-white focus:bg-white border ${adminStepValidationErrors.repeatSelectedItemCode ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-slate-400'} rounded-xl px-3.5 py-2.5 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 font-medium shadow-2xs transition-all`}
                            autoComplete="off"
                          />
                          {adminRepeatSearchQuery && (
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setAdminRepeatSearchQuery('');
                                setAdminRepeatSelectedItemCode('');
                                setAdminRepeatSelectedItemName('');
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                              title="Clear search"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                        {/* Floating Suggestion Cards */}
                        {adminRepeatInputFocused && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 max-h-60 overflow-y-auto">
                            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                              <span>Previously Manufactured Items ({selectedCust?.company})</span>
                              <span>{adminFilteredRepeatItems.length} found</span>
                            </div>
                            {adminFilteredRepeatItems.length > 0 ? (
                              adminFilteredRepeatItems.map((item, idx) => {
                                const code = item.itemCode || item.name;
                                const isSelected = adminRepeatSelectedItemCode === code;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleAdminSelectRepeatItem(code);
                                      setAdminRepeatInputFocused(false);
                                    }}
                                    className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${
                                      isSelected ? 'bg-indigo-50/70' : ''
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.name || code}
                                          className="w-9 h-9 rounded-lg object-contain bg-slate-100 border border-slate-200 shrink-0"
                                        />
                                      ) : (
                                        <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                                          {(item.type || 'TAG').slice(0, 3).toUpperCase()}
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <div className="flex items-center space-x-2">
                                          <span className="font-mono font-bold text-xs text-slate-900 truncate">{code}</span>
                                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">{item.type || 'Tag'}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                          {item.brandName ? <strong className="text-slate-700 font-semibold">{item.brandName}</strong> : 'Item'} &bull; {item.material || 'Standard Board'}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                      <div className="text-xs font-mono font-bold text-slate-900">{formatCurrency(item.unitPrice || 0)}</div>
                                      <span className="text-[10px] text-brand-600 font-semibold">{isSelected ? '✓ Loaded' : 'Select →'}</span>
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-4 text-center text-xs text-slate-500">
                                No previous items matching "{adminRepeatSearchQuery}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                        No previous manufactured orders found for this customer. Switch to <strong>+ New Design Order</strong> to create an article.
                      </div>
                    )}
                    {adminStepValidationErrors.repeatSelectedItemCode && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        &#9888; {adminStepValidationErrors.repeatSelectedItemCode}
                      </p>
                    )}
                  </div>
                )}

                {/* IF NEW ORDER: Brand Name & Automatic Article Identification */}
                {adminOrderType === 'New Order' && (
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Brand / Client Label <span className="text-rose-500">*</span>
                        </label>
                        {adminCustomerSavedBrands.length > 0 && (
                          <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                            <span>Saved:</span>
                            {adminCustomerSavedBrands.slice(0, 3).map((sb, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setAdminBrandName(sb);
                                  if (adminStepValidationErrors.brandName) {
                                    setAdminStepValidationErrors(prev => ({ ...prev, brandName: null }));
                                  }
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                              >
                                {sb}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Type brand name (e.g. Urban Stitch / Denim Club)..."
                          value={adminBrandName}
                          onFocus={() => setAdminBrandInputFocused(true)}
                          onChange={(e) => {
                            setAdminBrandName(e.target.value);
                            setAdminBrandInputFocused(true);
                            if (adminStepValidationErrors.brandName) {
                              setAdminStepValidationErrors(prev => ({ ...prev, brandName: null }));
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => setAdminBrandInputFocused(false), 200);
                          }}
                          className={`w-full bg-slate-50/70 hover:bg-white focus:bg-white border ${adminStepValidationErrors.brandName ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:ring-slate-400'} rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 font-medium shadow-2xs transition-all`}
                          autoComplete="off"
                        />
                        {/* Floating Brand Suggestions */}
                        {adminBrandInputFocused && adminFilteredBrandSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 max-h-48 overflow-y-auto">
                            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                              Saved Brands ({selectedCust?.company})
                            </div>
                            {adminFilteredBrandSuggestions.map((sb, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setAdminBrandName(sb);
                                  setAdminBrandInputFocused(false);
                                  if (adminStepValidationErrors.brandName) {
                                    setAdminStepValidationErrors(prev => ({ ...prev, brandName: null }));
                                  }
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs text-slate-800 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer"
                              >
                                <span>{sb}</span>
                                <span className="text-[10px] text-slate-400">Select &rarr;</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {adminStepValidationErrors.brandName && (
                        <p className="text-[11px] text-rose-600 font-medium mt-1">
                          &#9888; {adminStepValidationErrors.brandName}
                        </p>
                      )}
                    </div>

                    {/* Auto-Assigned Article Reference */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Assigned Production Reference:</span>
                        <span className="font-mono font-bold text-slate-900 ml-2">{currentAdminDraftItemName}</span>
                      </div>
                      <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 font-medium">
                        Standardized Naming
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Product Category & Structural Specifications */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Product Architecture &amp; Specifications
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select the garment accessory category and configure physical dimensions and paper board qualities.
                  </p>
                </div>

                {/* Category & Piece Format Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                      Product Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={adminSelectedType}
                      onChange={(e) => handleAdminTypeChange(e.target.value)}
                      className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium shadow-2xs transition-all"
                    >
                      {availableTypes.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Format / Pieces (For Hangtags & Tag Kits) */}
                  {(adminSelectedType === 'Tag' || adminSelectedType === 'Tag Kit') ? (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                        Piece Composition / Format
                      </label>
                      <select
                        value={adminIsMultiCard ? (adminTagCards.length === 3 ? '3 PC' : '2 PC') : '1 PC'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '1 PC') {
                            setAdminIsMultiCard(false);
                          } else if (val === '2 PC') {
                            setAdminIsMultiCard(true);
                            if (adminTagCards.length > 2) handleAdminRemoveThirdCard();
                          } else if (val === '3 PC') {
                            setAdminIsMultiCard(true);
                            if (adminTagCards.length < 3) handleAdminAddThirdCard();
                          }
                        }}
                        className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium shadow-2xs transition-all"
                      >
                        <option value="1 PC">1 PC (Single Tag)</option>
                        <option value="2 PC">2 PC (2-Piece Tag Set)</option>
                        <option value="3 PC">3 PC (3-Piece Tag Kit)</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                        Format
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="Single Unit Patch"
                        className="w-full bg-slate-100/70 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-600 font-medium cursor-not-allowed"
                      />
                    </div>
                  )}
                </div>

                {/* MATERIAL ENGINEERING: Hangtag / Tag Kit vs PU Label */}
                <div className="pt-2 border-t border-slate-100">
                  {(adminSelectedType === 'Tag' || adminSelectedType === 'Tag Kit') ? (
                    <div className="space-y-3">
                      {!adminIsMultiCard ? (
                        /* Single Card Tag */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                              Paper Catalog Board <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={adminSelectedCatalogId}
                              onChange={(e) => {
                                setAdminSelectedCatalogId(e.target.value);
                                if (adminStepValidationErrors.selectedCatalogId) {
                                  setAdminStepValidationErrors(prev => ({ ...prev, selectedCatalogId: null }));
                                }
                              }}
                              className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium shadow-2xs transition-all"
                            >
                              {availableCatalogs.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.code} - {cat.gsm} GSM ({cat.finish})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                              Die-Cut Dimensions (Size L x Size B)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 50 x 90 mm or 55 x 110 mm"
                              value={adminSingleCardDimension}
                              onChange={(e) => setAdminSingleCardDimension(e.target.value)}
                              className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium shadow-2xs transition-all"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Multi-Card Tag Configuration */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              Multi-Piece Layer Configuration ({adminTagCards.length} Pieces)
                            </span>
                            {adminTagCards.length < 3 && (
                              <button
                                type="button"
                                onClick={handleAdminAddThirdCard}
                                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
                              >
                                + Add 3rd Piece
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {adminTagCards.map((card, idx) => (
                              <div key={card.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">
                                    {card.title}
                                  </span>
                                  {idx === 2 && (
                                    <button
                                      type="button"
                                      onClick={handleAdminRemoveThirdCard}
                                      className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                                    >
                                      &times; Remove
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                                      Paper Board Quality
                                    </label>
                                    <select
                                      value={card.catalogId}
                                      onChange={(e) => handleAdminUpdateCardCatalog(idx, e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                                    >
                                      {availableCatalogs.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                          {cat.code} - {cat.gsm} GSM
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                                      Finished Dimensions
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={idx === 0 ? "e.g. 55 x 110 mm" : "e.g. 45 x 90 mm"}
                                      value={card.dimension}
                                      onChange={(e) => handleAdminUpdateCardDimension(idx, e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 font-medium"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* PU Label Leather Material Options */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                            PU Leather Origin
                          </label>
                          <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                            <button
                              type="button"
                              onClick={() => setAdminPuOrigin('Indian')}
                              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                adminPuOrigin === 'Indian'
                                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Indian PU
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminPuOrigin('Imported')}
                              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                adminPuOrigin === 'Imported'
                                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Imported PU
                            </button>
                          </div>
                        </div>
                        {adminPuOrigin === 'Indian' ? (
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                              Thickness Gauge
                            </label>
                            <select
                              value={adminPuThickness}
                              onChange={(e) => setAdminPuThickness(e.target.value)}
                              className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium shadow-2xs"
                            >
                              <option value="1.2">1.2 mm (Standard)</option>
                              <option value="1.8">1.8 mm (Medium Heavy)</option>
                              <option value="2.2">2.2 mm (Ultra Heavy Duty)</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                              Imported Grade
                            </label>
                            <input
                              type="text"
                              readOnly
                              value="Premium Imported Synthetic Grain"
                              className="w-full bg-slate-100/70 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-600 font-medium cursor-not-allowed"
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                          Patch Finished Size (L x B)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 45 x 70 mm or 50 x 85 mm"
                          value={adminSingleCardDimension}
                          onChange={(e) => setAdminSingleCardDimension(e.target.value)}
                          className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 font-medium shadow-2xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: Handwork Fasteners & Attachments */}
              {adminSelectedType !== 'Tag Kit' && (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      Handwork Fasteners &amp; Attachments
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Configure tag hanging cords (Dori) and molded barcode seal locks.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Dori */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">Dori (String)</span>
                        <div className="flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminDoriOption('none');
                              setAdminDoriCustom('');
                            }}
                            className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                              adminDoriOption === 'none' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            None
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminDoriOption('reg');
                              setAdminDoriCustom('');
                            }}
                            className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                              adminDoriOption === 'reg' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Reg. (₹0.20)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminDoriOption('custom')}
                            className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                              adminDoriOption === 'custom' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Custom
                          </button>
                        </div>
                      </div>
                      {adminDoriOption === 'custom' ? (
                        <input
                          type="text"
                          placeholder="Specify custom dori (e.g. Waxed Cotton / Satin cord)"
                          value={adminDoriCustom}
                          onChange={(e) => setAdminDoriCustom(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 font-medium"
                        />
                      ) : (
                        <div className="text-[11px] text-slate-500">
                          {adminDoriOption === 'none' ? 'No string attachment required' : 'Standard cotton string included (₹0.20/pc)'}
                        </div>
                      )}
                    </div>

                    {/* Barcode Plastic Seal */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800">Barcode Plastic Seal</span>
                        <div className="flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminPlasticOption('none');
                              setAdminPlasticCustom('');
                            }}
                            className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                              adminPlasticOption === 'none' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            None
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdminPlasticOption('reg');
                              setAdminPlasticCustom('');
                            }}
                            className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                              adminPlasticOption === 'reg' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Reg. (₹0.10)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminPlasticOption('custom')}
                            className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                              adminPlasticOption === 'custom' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Custom
                          </button>
                        </div>
                      </div>
                      {adminPlasticOption === 'custom' ? (
                        <input
                          type="text"
                          placeholder="Specify custom seal (e.g. Embossed Square Seal)"
                          value={adminPlasticCustom}
                          onChange={(e) => setAdminPlasticCustom(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 font-medium"
                        />
                      ) : (
                        <div className="text-[11px] text-slate-500">
                          {adminPlasticOption === 'none' ? 'No seal lock required' : 'Standard molded barcode seal lock (₹0.10/pc)'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: Production Volume & Commercial Rates */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                    Production Volume &amp; Commercials
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Specify required pieces and agreed unit manufacturing pricing.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                  {/* Quantity Input with Presets */}
                  <div className="sm:col-span-6 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Order Quantity (Pcs) <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1000, 2500, 5000, 10000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setAdminQty(val);
                              if (adminStepValidationErrors.qty) setAdminStepValidationErrors(prev => ({ ...prev, qty: null }));
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              Number(adminQty) === val
                                ? 'bg-slate-900 text-white border-slate-900 font-bold'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                          >
                            {val >= 1000 ? `${val / 1000}k` : val}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={adminQty || ''}
                      onChange={(e) => {
                        setAdminQty(e.target.value);
                        if (adminStepValidationErrors.qty) setAdminStepValidationErrors(prev => ({ ...prev, qty: null }));
                      }}
                      className={`w-full bg-slate-50/70 hover:bg-white focus:bg-white border ${adminStepValidationErrors.qty ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400`}
                    />
                    {adminStepValidationErrors.qty && (
                      <p className="text-[11px] text-rose-600 font-medium">&#9888; {adminStepValidationErrors.qty}</p>
                    )}
                  </div>

                  {/* Rate Input */}
                  <div className="sm:col-span-6 space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-700 block">
                      Agreed Unit Rate (₹/pc) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="e.g. 3.50"
                      value={adminRate || ''}
                      onChange={(e) => {
                        setAdminRate(e.target.value);
                        if (adminStepValidationErrors.rate) setAdminStepValidationErrors(prev => ({ ...prev, rate: null }));
                      }}
                      className={`w-full bg-slate-50/70 hover:bg-white focus:bg-white border ${adminStepValidationErrors.rate ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400`}
                    />
                    {adminStepValidationErrors.rate && (
                      <p className="text-[11px] text-rose-600 font-medium">&#9888; {adminStepValidationErrors.rate}</p>
                    )}
                  </div>
                </div>

                {/* Packaging Instructions */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Packaging Instructions / Special Production Notes (Optional)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="e.g. Bundle packaging in 100s, urgent dispatch deadline, shrink wrap rolls..."
                    value={adminOrderNotes}
                    onChange={(e) => setAdminOrderNotes(e.target.value)}
                    className="w-full bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium shadow-2xs"
                  />
                </div>

                {/* Staged Additional Items Table (if any) */}
                {adminOrderItems.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Staged Batch Items ({adminOrderItems.length})
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                      {adminOrderItems.map((item, idx) => (
                        <div key={idx} className="p-3 border-b border-slate-100 last:border-0 flex items-center justify-between">
                          <div>
                            <span className="font-mono font-bold text-slate-900 mr-2">{item.itemCode || item.name}</span>
                            <span className="font-semibold text-slate-800 mr-2">{item.brandName}</span>
                            <span className="text-slate-500 font-mono">({item.quantity} pcs @ {formatCurrency(item.unitPrice)})</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-mono font-bold text-slate-900">{formatCurrency(item.total)}</span>
                            <button
                              type="button"
                              onClick={() => handleAdminRemoveItem(item.id)}
                              className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Batch Item Button */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAdminAddItem}
                    className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <span>+ Add Another Article to this Order Batch</span>
                  </button>
                  <span className="text-[11px] text-slate-400">
                    Combine multiple tag references into one job card
                  </span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (5 cols): Visual Artwork Proof Canvas & Production Job Ticket */}
            <div className="lg:col-span-5 space-y-6 sticky top-20">
              
              {/* COMPONENT 1: Interactive Artwork Proof Canvas */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Artwork &amp; Prepress Proof</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Visual framing and prepress alignment for offset printing.
                    </p>
                  </div>
                  {adminOrderImage && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      &#10003; Print File Ready
                    </span>
                  )}
                </div>

                {/* Artwork Framing Area */}
                {!adminOrderImage ? (
                  <div className="bg-slate-50/70 hover:bg-white border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-7 min-h-[240px] flex flex-col items-center justify-center text-center relative group transition-all cursor-pointer">
                    <input
                      id="admin-file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAdminImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    {/* Simulated Hangtag Silhouette */}
                    <div className="w-16 h-24 rounded-xl border-2 border-slate-300 group-hover:border-slate-500 bg-white shadow-2xs flex flex-col items-center justify-between p-2 mb-3 transition-colors">
                      <div className="w-2 h-2 rounded-full border border-slate-300 bg-slate-100"></div>
                      <div className="text-xl font-light text-slate-400 group-hover:text-slate-800 transition-colors">+</div>
                      <div className="w-8 h-1 rounded bg-slate-100"></div>
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Upload Production Artwork
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                      Drag &amp; drop customer logo or tag artwork file (JPG, PNG, WEBP).
                    </p>
                    <span className="text-[10px] text-slate-400 mt-2 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                      Optional: Offset studio generates prepress proof if blank
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-h-[220px]">
                      {/* Realistic Hangtag Frame */}
                      <div className="relative group w-40 h-56 bg-white rounded-2xl border-2 border-slate-300/80 shadow-md flex flex-col items-center justify-between p-3 overflow-hidden">
                        {/* Simulated Tag Hole Punch Guide */}
                        <div className="w-3 h-3 rounded-full border border-slate-300 bg-slate-200/70 shrink-0 z-10" title="Drill Hole Guide (3mm)"></div>
                        
                        {/* Artwork Preview Image */}
                        <div 
                          onClick={() => setPreviewArtworkUrl(adminOrderImage)}
                          className="w-full flex-1 flex items-center justify-center overflow-hidden cursor-pointer py-1"
                          title="Click to inspect enlarged artwork"
                        >
                          <img
                            src={adminOrderImage}
                            alt="Order Artwork Proof"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        {/* Tag Dimensions Badge */}
                        <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest shrink-0">
                          {adminSingleCardDimension || '50 x 90 mm'}
                        </div>
                      </div>
                    </div>

                    {/* Prepress Toolstrip */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setAdminShowCropModal(true)}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Crop &amp; Frame</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewArtworkUrl(adminOrderImage)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Inspect Lightbox
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-slate-600 hover:text-slate-900 underline text-xs cursor-pointer font-medium">
                          Replace
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAdminImageUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-slate-300">&bull;</span>
                        <button
                          type="button"
                          onClick={() => setAdminOrderImage('')}
                          className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* COMPONENT 2: Production Job Ticket (Manufacturing Order Summary) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-400 font-bold">#</span>
                    <h3 className="font-bold text-slate-900 text-sm">Production Job Ticket</h3>
                  </div>
                  <div>
                    <span className="text-[10px] bg-slate-900 text-white px-2.5 py-1 rounded font-mono font-bold" title="Order ID">
                      {currentAdminOrderId}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Customer Party:</span>
                    <span className="font-bold text-slate-900 text-right">{selectedCust?.company}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Brand:</span>
                    <span className="font-semibold text-slate-900 text-right">{adminBrandName || selectedCust?.company || '-'}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Product:</span>
                    <span className="font-semibold text-slate-900 text-right">{adminSelectedType}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Composition:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {adminSelectedType === 'Tag' || adminSelectedType === 'Tag Kit' ? (adminIsMultiCard ? `${adminTagCards.length}-Piece Set` : 'Single Card Tag') : 'Standard Unit'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Material Board:</span>
                    <span className="font-semibold text-slate-900 text-right text-[11px] max-w-[160px] truncate">
                      {adminSelectedType === 'Tag' || adminSelectedType === 'Tag Kit'
                        ? (availableCatalogs.find(c => c.id === adminSelectedCatalogId)?.code || 'Stock Board')
                        : `${adminPuOrigin} PU (${adminPuThickness}mm)`}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Volume:</span>
                    <span className="font-semibold font-mono text-slate-900 text-right">{Number(adminQty || 0).toLocaleString()} pcs</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Unit Rate:</span>
                    <span className="font-semibold font-mono text-slate-900 text-right">{formatCurrency(Number(adminRate || 0))}/pc</span>
                  </div>
                  
                  {adminSelectedType !== 'Tag Kit' && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-slate-500 text-[11px]">Handwork Attachments:</span>
                      <span className="text-[11px] text-slate-600 text-right">
                        Dori ({adminDoriOption === 'custom' ? 'Custom' : adminDoriOption === 'none' ? 'None' : '₹0.20'}) | Seal ({adminPlasticOption === 'custom' ? 'Custom' : adminPlasticOption === 'none' ? 'None' : '₹0.10'})
                      </span>
                    </div>
                  )}

                  {/* Commercial Adjustments */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-600">Special Discount (₹):</label>
                      <input
                        type="number"
                        min="0"
                        value={adminOrderDiscount || ''}
                        onChange={(e) => setAdminOrderDiscount(Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Estimated Total:</span>
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {formatCurrency(adminFinalTotal)}
                    </span>
                  </div>
                </div>

                {/* Primary Booking Action */}
                <button
                  type="button"
                  onClick={handleAdminSubmitOrder}
                  disabled={adminIsSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {adminIsSubmitting ? (
                    <span>Booking Manufacturing Order...</span>
                  ) : (
                    <>
                      <span>Confirm &amp; Book Order</span>
                      <span className="font-bold">&rarr;</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                  Direct manufacturing entry. Press cards and jobs will be scheduled immediately.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* MODULE 9: PAPER CATALOGS MASTER & TAGS/LABELS CONFIG */}
      {activeTab === 'label_config' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Sub-tab Navigation: Paper Catalogs Master vs Types & Materials */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setCatalogSubTab('catalogs')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs ${
                  catalogSubTab === 'catalogs'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Paper Catalogs Master ({availableCatalogs.length})
              </button>
              <button
                type="button"
                onClick={() => setCatalogSubTab('types')}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs ${
                  catalogSubTab === 'types'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Product Types &amp; Materials ({availableTypes.length})
              </button>
            </div>

            {catalogSubTab === 'catalogs' && (
              <button
                type="button"
                onClick={handleOpenAddCatalog}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all self-start sm:self-auto"
              >
                <span>+ Add New Paper Catalog</span>
              </button>
            )}
          </div>

          {/* SUB-TAB 1: PAPER CATALOGS MASTER */}
          {catalogSubTab === 'catalogs' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
                <div className="pb-4 border-b border-slate-100 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg md:text-xl">
                      Paper Catalogs &amp; Swatches Master
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Physical paper swatch books provided to customers for hangtag selection. Sheet rates and opening stocks automatically feed into the production order forms and inventory.
                    </p>
                  </div>
                  <span className="text-sm font-mono text-slate-800 font-bold bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-auto shadow-2xs">
                    {availableCatalogs.length} Active Swatches
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {availableCatalogs.map(cat => (
                    <div 
                      key={cat.id} 
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-400 hover:shadow-xs transition-all group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="font-mono text-sm font-bold text-slate-900 bg-white border border-slate-200/90 px-3 py-1 rounded-lg inline-block shadow-2xs">
                              {cat.code}
                            </span>
                            <h4 className="font-bold text-slate-900 text-base md:text-lg mt-2 leading-snug">{cat.name}</h4>
                          </div>
                          <span className="px-3 py-1 rounded-lg bg-white text-slate-900 font-mono font-bold text-sm md:text-base border border-slate-200/90 shadow-2xs shrink-0 whitespace-nowrap">
                            ₹{Number(cat.sheetRate || 0).toFixed(2)} <span className="text-xs font-normal text-slate-500 font-sans">/ sheet</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3.5">
                          <span className="bg-white text-slate-800 border border-slate-200 px-3 py-1 rounded-lg text-xs md:text-sm font-bold font-mono shadow-2xs">
                            {cat.gsm} GSM
                          </span>
                          <span className="bg-white text-slate-800 border border-slate-200 px-3 py-1 rounded-lg text-xs md:text-sm font-medium shadow-2xs">
                            {cat.finish}
                          </span>
                          {cat.stockSheets !== undefined && (
                            <span className="bg-white text-slate-800 border border-slate-200 px-3 py-1 rounded-lg text-xs md:text-sm font-semibold font-mono shadow-2xs">
                              Stock: {Number(cat.stockSheets).toLocaleString()} shts
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200/90">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCatalog(cat)}
                          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-900 border border-slate-200 text-xs md:text-sm font-semibold shadow-2xs transition-all"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCatalog(cat.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-slate-200 hover:border-rose-300 text-xs md:text-sm font-semibold shadow-2xs transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: PRODUCT TYPES & MATERIAL THICKNESS */}
          {catalogSubTab === 'types' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Create New Type Form */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800 space-y-3">
                <h3 className="font-bold text-slate-900 text-base">
                  Add New Product Type
                </h3>
                <p className="text-xs text-slate-500 mb-2">Create a new manufacturing classification (e.g. Woven Label, Heat Transfer, Satin Tape).</p>

                <form onSubmit={handleCreateNewType} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Type Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Woven Label / Sticker"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Materials (comma separated) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Damask 50D, Satin, Taffeta"
                      value={newTypeMaterials}
                      onChange={(e) => setNewTypeMaterials(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Default Unit Rate (₹)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={newTypeDefaultRate}
                      onChange={(e) => setNewTypeDefaultRate(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl shadow-xs transition-all"
                  >
                    Add Type to Catalog
                  </button>
                </form>
              </div>

              {/* Add Material to Existing Type Form */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800 space-y-3">
                <h3 className="font-bold text-slate-900 text-base">
                  Add Material Thickness / Variant
                </h3>
                <p className="text-xs text-slate-500 mb-2">Add a new material or GSM to an existing type (e.g. add 400 GSM to Tag, or 2.5 to PU Label).</p>

                <form onSubmit={handleAddMaterialToType} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Select Type *</label>
                    <select
                      value={addMatTargetType}
                      onChange={(e) => setAddMatTargetType(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500"
                    >
                      {availableTypes.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">New Material / Specification Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 400 GSM / 2.5 / Holographic"
                      value={addMatName}
                      onChange={(e) => setAddMatName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl shadow-xs transition-all"
                  >
                    Add Material to {addMatTargetType}
                  </button>
                </form>
              </div>

              {/* Active Types & Materials Overview Cards */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
                <h3 className="font-bold text-slate-900 text-base mb-1">Active Types Matrix</h3>
                <p className="text-xs text-slate-500 mb-3">{availableTypes.length} configured types available for order booking.</p>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {availableTypes.map(type => (
                    <div key={type.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-900">{type.name}</span>
                        <span className="text-[11px] text-slate-600 font-mono">Rate: ₹{type.defaultRate}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Materials:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {type.materials.map((mat, i) => (
                            <span
                              key={i}
                              className="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center space-x-1"
                            >
                              <span>{mat}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMaterial(type.name, mat)}
                                className="text-slate-400 hover:text-rose-600 font-bold ml-1"
                                title="Delete Material"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* MODULE 2: VIEW ALL ORDERS (ADMIN ORDER REGISTER) */}
      {activeTab === 'all_orders' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* BULK ACTION BAR (Visible when 1 or more orders are selected) */}
          {selectedOrderIds.length > 0 && (
            <div className="sticky top-20 z-20 bg-white/95 border-2 border-slate-900 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md animate-fade-in">
              <div className="flex items-center space-x-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-900"></span>
                </span>
                <span className="font-semibold text-slate-900 text-xs">
                  <strong className="text-slate-900 font-mono text-sm">{selectedOrderIds.length}</strong> Order(s) Selected for Bulk Movement
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('approved')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1"
                >
                  <span>Bulk Approve</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const selectedOrdersList = orders.filter(o => selectedOrderIds.includes(o.id));
                    handleOpenMoveToProduction(selectedOrdersList);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1"
                >
                  <span>Bulk Start Production</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('rejected')}
                  className="bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 font-medium px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition-all flex items-center space-x-1"
                >
                  <span>Bulk Reject</span>
                </button>

                <div className="h-5 w-px bg-slate-200 mx-1"></div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-600 font-medium">Move Status to:</span>
                  <select
                    value={bulkTargetStatus}
                    onChange={(e) => setBulkTargetStatus(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-500"
                  >
                    {STAGES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange(bulkTargetStatus)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-xl text-xs shadow-xs transition-all"
                  >
                    Move
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrderIds([])}
                  className="text-xs text-slate-500 hover:text-slate-900 underline ml-2"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Admin Order Register</h3>
                <p className="text-xs text-slate-500">Complete registry with artwork inspection, 1-click Approve/Reject, and bulk status movement.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Status Dropdown Filter */}
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Status:</span>
                  <select
                    value={adminOrderStatusFilter}
                    onChange={(e) => setAdminOrderStatusFilter(e.target.value)}
                    className="bg-transparent text-xs text-slate-800 font-semibold outline-none cursor-pointer pr-1"
                  >
                    <option value="all" className="bg-white text-slate-800">All Statuses ({orders.length})</option>
                    <option value="pending" className="bg-white text-slate-800">Pending Approval ({orders.filter(o => o.status === 'pending' || o.status === 'placed').length})</option>
                    <option value="approved" className="bg-white text-slate-800">Approved ({orders.filter(o => o.status === 'approved' || o.status === 'confirmed').length})</option>
                    <option value="in_production" className="bg-white text-slate-800">In Production ({orders.filter(o => o.status === 'in_production').length})</option>
                    <option value="ready_dispatch" className="bg-white text-slate-800">Ready / QC ({orders.filter(o => o.status === 'ready_dispatch').length})</option>
                    <option value="shipped" className="bg-white text-slate-800">Dispatched ({orders.filter(o => o.status === 'shipped').length})</option>
                    <option value="delivered" className="bg-white text-slate-800">Delivered ({orders.filter(o => o.status === 'delivered').length})</option>
                    <option value="rejected" className="bg-white text-slate-800">Rejected ({orders.filter(o => o.status === 'rejected').length})</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                {(adminOrderStatusFilter !== 'all' || adminSearchOrderId || adminSearchCustomer || adminSearchBrandSpecs || adminSearchDoriPlastic || adminSearchQty || adminSearchRateTotal) && (
                  <button
                    onClick={() => {
                      setAdminOrderStatusFilter('all');
                      setAdminSearchOrderId('');
                      setAdminSearchCustomer('');
                      setAdminSearchBrandSpecs('');
                      setAdminSearchDoriPlastic('');
                      setAdminSearchQty('');
                      setAdminSearchRateTotal('');
                    }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors font-medium flex items-center space-x-1"
                    title="Reset all search and status filters"
                  >
                    <span>Clear Filters</span>
                  </button>
                )}

                <span className="text-xs text-slate-700 font-mono bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
                  {filteredAdminOrders.length} of {orders.length} Order(s)
                </span>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 ml-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Table View
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${viewMode === 'kanban' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Kanban View
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'table' ? (
              <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200 bg-white">
                <table className="w-full table-fixed min-w-[1240px] text-left text-xs text-slate-700">
                  <colgroup>
                    <col style={{ width: '44px' }} />
                    <col style={{ width: '130px' }} />
                    <col style={{ width: '84px' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '95px' }} />
                    <col style={{ width: '135px' }} />
                    <col style={{ width: '230px' }} />
                  </colgroup>
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200 font-bold">
                    <tr>
                      <th style={{ width: '44px' }} className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={filteredAdminOrders.length > 0 && selectedOrderIds.length === filteredAdminOrders.length}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 cursor-pointer"
                          title="Select / Deselect All Orders"
                        />
                      </th>
                      <th style={{ width: '130px' }} className="py-3 px-3 font-semibold">Order ID</th>
                      <th style={{ width: '84px' }} className="py-3 px-3 text-center font-semibold">Artwork</th>
                      <th style={{ width: '150px' }} className="py-3 px-3 font-semibold">Customer Name</th>
                      <th className="py-3 px-4 font-semibold">Brand &amp; Item Specs</th>
                      <th style={{ width: '150px' }} className="py-3 px-3 font-semibold">Dori &amp; Plastic</th>
                      <th style={{ width: '95px' }} className="py-3 px-3 text-right font-semibold">Qty</th>
                      <th style={{ width: '135px' }} className="py-3 px-3 text-right font-semibold">Rate &amp; Total</th>
                      <th style={{ width: '230px' }} className="py-3 px-4 text-center font-semibold">Status</th>
                    </tr>
                    {/* Individual search bar below columns matching Customer Side Order Register */}
                    <tr className="bg-slate-50/70 border-b border-slate-200">
                      <th className="py-2.5 px-3 text-center font-normal"></th>
                      {/* Search: Order ID (Compact) */}
                      <th className="py-2.5 px-3 font-normal">
                        <div className="relative">
                          <input
                            type="text"
                            value={adminSearchOrderId}
                            onChange={(e) => setAdminSearchOrderId(e.target.value)}
                            placeholder="Search ID..."
                            className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-2 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors normal-case font-normal font-mono"
                          />
                          {adminSearchOrderId && (
                            <button
                              onClick={() => setAdminSearchOrderId('')}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                              title="Clear"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      </th>
                      {/* Artwork column spacer */}
                      <th className="py-2.5 px-3 font-normal"></th>
                      {/* Search: Customer Name */}
                      <th className="py-2.5 px-3 font-normal">
                        <div className="relative">
                          <input
                            type="text"
                            value={adminSearchCustomer}
                            onChange={(e) => setAdminSearchCustomer(e.target.value)}
                            placeholder="Search customer..."
                            className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-2 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors normal-case font-normal"
                          />
                          {adminSearchCustomer && (
                            <button
                              onClick={() => setAdminSearchCustomer('')}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                              title="Clear"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      </th>
                      {/* Search: Brand & Item Specs */}
                      <th className="py-2.5 px-4 font-normal">
                        <div className="relative">
                          <input
                            type="text"
                            value={adminSearchBrandSpecs}
                            onChange={(e) => setAdminSearchBrandSpecs(e.target.value)}
                            placeholder="Search specs..."
                            className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors normal-case font-normal"
                          />
                          {adminSearchBrandSpecs && (
                            <button
                              onClick={() => setAdminSearchBrandSpecs('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                              title="Clear"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      </th>
                      {/* Search: Dori & Plastic */}
                      <th className="py-2.5 px-3 font-normal">
                        <div className="relative">
                          <input
                            type="text"
                            value={adminSearchDoriPlastic}
                            onChange={(e) => setAdminSearchDoriPlastic(e.target.value)}
                            placeholder="Search dori / plastic..."
                            className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-2 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors normal-case font-normal"
                          />
                          {adminSearchDoriPlastic && (
                            <button
                              onClick={() => setAdminSearchDoriPlastic('')}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                              title="Clear"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      </th>
                      {/* Search: Qty */}
                      <th className="py-2.5 px-3 font-normal">
                        <div className="relative">
                          <input
                            type="text"
                            value={adminSearchQty}
                            onChange={(e) => setAdminSearchQty(e.target.value)}
                            placeholder="Filter qty..."
                            className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-2 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors normal-case font-normal text-right font-mono"
                          />
                          {adminSearchQty && (
                            <button
                              onClick={() => setAdminSearchQty('')}
                              className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                              title="Clear"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      </th>
                      {/* Search: Rate & Total Amount */}
                      <th className="py-2.5 px-3 font-normal">
                        <div className="relative">
                          <input
                            type="text"
                            value={adminSearchRateTotal}
                            onChange={(e) => setAdminSearchRateTotal(e.target.value)}
                            placeholder="Filter rate..."
                            className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-2 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors normal-case font-normal text-right font-mono"
                          />
                          {adminSearchRateTotal && (
                            <button
                              onClick={() => setAdminSearchRateTotal('')}
                              className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                              title="Clear"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      </th>
                      {/* Clear Button */}
                      <th className="py-2.5 px-4 text-center font-normal">
                        {(adminOrderStatusFilter !== 'all' || adminSearchOrderId || adminSearchCustomer || adminSearchBrandSpecs || adminSearchDoriPlastic || adminSearchQty || adminSearchRateTotal) && (
                          <button
                            onClick={() => {
                              setAdminOrderStatusFilter('all');
                              setAdminSearchOrderId('');
                              setAdminSearchCustomer('');
                              setAdminSearchBrandSpecs('');
                              setAdminSearchDoriPlastic('');
                              setAdminSearchQty('');
                              setAdminSearchRateTotal('');
                            }}
                            className="text-[11px] text-slate-700 hover:text-slate-900 font-semibold underline"
                            title="Reset search fields"
                          >
                            Clear
                          </button>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredAdminOrders.length === 0 && (
                      <tr>
                        <td colSpan="9" className="py-12 text-center text-slate-400 text-xs">
                          No orders match the current search filters.
                        </td>
                      </tr>
                    )}
                    {filteredAdminOrders.map(o => {
                      const firstItem = o.items[0] || {};
                      const isSelected = selectedOrderIds.includes(o.id);
                      const isApproved = o.status === 'approved';
                      const isRejected = o.status === 'rejected';

                      return (
                        <tr 
                          key={o.id} 
                          className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-slate-50/90' : ''}`}
                        >
                          {/* 0. BULK SELECT CHECKBOX */}
                          <td className="py-4 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOrder(o.id)}
                              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 cursor-pointer"
                            />
                          </td>

                          {/* 1. ORDER ID (COMPACT) */}
                          <td className="py-4 px-3 w-32 align-top">
                            <div className="font-mono font-bold text-slate-900 text-xs leading-tight tracking-tight break-all" title={o.id}>
                              {o.id}
                            </div>
                            {o.customerOrderId && (
                              <div className="font-mono font-bold text-[10px] text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded inline-block mt-1">
                                {o.customerOrderId}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">
                              {formatDate(o.createdAt)}
                            </div>
                          </td>

                          {/* 2. ARTWORK (CLICK TO ENLARGE LIGHTBOX) */}
                          <td className="py-4 px-3 w-20 align-top text-center">
                            {firstItem.image ? (
                              <div 
                                onClick={() => setPreviewArtworkUrl(firstItem.image)}
                                className="relative group cursor-pointer inline-block"
                                title="Click to inspect enlarged artwork"
                              >
                                <img 
                                  src={firstItem.image} 
                                  alt="Artwork" 
                                  className="w-16 h-16 object-contain rounded-xl border border-slate-200 bg-white shadow-2xs group-hover:border-slate-400 group-hover:scale-105 transition-all" 
                                />
                                <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                                  Zoom
                                </div>
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-400 mx-auto">
                                ART
                              </div>
                            )}
                          </td>

                          {/* 3. CUSTOMER NAME */}
                          <td className="py-4 px-3 w-36 align-top">
                            <div className="font-bold text-slate-900 text-sm leading-snug">{o.customerCompany}</div>
                          </td>

                          {/* 4. BRAND AND ITEM SPECS (CLEANED - NO REDUNDANT QTY/RATE) */}
                          <td className="py-4 px-4 align-top">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                                {firstItem.itemCode || firstItem.name || 'ITEM'}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">
                                {firstItem.brandName || o.customerCompany}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[11px]">
                                {firstItem.type || 'Tag'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                                {firstItem.material || 'Standard'}
                              </span>
                            </div>
                            {o.items.length > 1 && (
                              <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                                + {o.items.length - 1} more item(s)
                              </span>
                            )}
                          </td>

                          {/* 5. DORI AND PLASTIC */}
                          <td className="py-4 px-3 w-36 align-top text-xs space-y-1">
                            <div className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                              Dori: <strong>{firstItem.dori || 'Reg.'}</strong>
                            </div>
                            <div className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                              Plastic: <strong>{firstItem.plastic || 'Reg.'}</strong>
                            </div>
                          </td>

                          {/* 6. QTY (SEPARATE COLUMN) */}
                          <td className="py-4 px-3 w-24 align-top text-right">
                            <div className="font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                              {Number(firstItem.quantity || 0).toLocaleString()}
                            </div>
                            <span className="text-[11px] text-slate-400">pcs</span>
                            {o.items.length > 1 && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5" title="Total pieces across all items">
                                ({o.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0).toLocaleString()} tot)
                              </div>
                            )}
                          </td>

                          {/* 7. RATE & TOTAL AMOUNT (MERGED COLUMN) */}
                          <td className="py-4 px-3 w-32 align-top text-right">
                            <div className="font-mono font-semibold text-slate-700 text-xs whitespace-nowrap">
                              {formatCurrency(firstItem.unitPrice || 0)} <span className="text-[10px] text-slate-400 font-normal">/pc</span>
                            </div>
                            <div className="font-mono font-bold text-slate-900 text-sm mt-1 whitespace-nowrap">
                              {formatCurrency(o.total)}
                            </div>
                          </td>

                          {/* 7. STATUS & ACTIONS (LAST COLUMN) */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              {/* Status Pill Badge */}
                              <div>
                                <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase inline-flex items-center space-x-1.5 shadow-2xs ${
                                  o.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                  o.status === 'rejected' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                                  o.status === 'in_production' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                                  o.status === 'ready_dispatch' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                                  o.status === 'shipped' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                                  o.status === 'delivered' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                                  o.status === 'pending' || o.status === 'placed' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                  'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    o.status === 'approved' ? 'bg-emerald-500' :
                                    o.status === 'rejected' ? 'bg-rose-500' :
                                    o.status === 'in_production' ? 'bg-sky-500 animate-pulse' :
                                    o.status === 'ready_dispatch' ? 'bg-indigo-500' :
                                    o.status === 'shipped' ? 'bg-blue-500' :
                                    o.status === 'delivered' ? 'bg-purple-500' :
                                    'bg-amber-500'
                                  }`}></span>
                                  <span>{STAGES.find(s => s.key === o.status)?.label || (o.status || 'PENDING').replace(/_/g, ' ').toUpperCase()}</span>
                                </span>
                              </div>

                              {/* Unapproved / Pending Orders: Show Start Production, Approve & Reject buttons */}
                              {(!o.status || o.status === 'pending' || o.status === 'placed') ? (
                                <div className="flex flex-col items-center justify-center gap-1.5 w-full max-w-[160px]">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenMoveToProduction(o)}
                                    className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs hover:shadow transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                                    title="Create Job Card & Start Production directly"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Start Production</span>
                                  </button>
                                  <div className="flex items-center justify-center gap-1.5 w-full">
                                    <button
                                      type="button"
                                      onClick={() => handleApproveOrder(o)}
                                      className="flex-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                                      title="Approve order & auto-move to production"
                                    >
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenRejectModal(o)}
                                      className="flex-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                                      title="Reject this order with structured reason"
                                    >
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                </div>
                              ) : o.status === 'approved' ? (
                                <div className="flex flex-col items-center gap-1.5 w-full max-w-[150px]">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenMoveToProduction(o)}
                                    className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs hover:shadow transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                                    title="Create job card & start production"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Start Production</span>
                                  </button>
                                  <select
                                    value={o.status}
                                    onChange={(e) => {
                                      const newStg = e.target.value;
                                      const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                                      const updated = { 
                                        ...o, 
                                        status: newStg,
                                        timeline: [
                                          ...(o.timeline || []),
                                          {
                                            stage: newStg,
                                            title: `Status Changed to ${newStg.replace(/_/g, ' ')}`,
                                            description: `Updated by ${currentMember.name}.`,
                                            timestamp: formattedDate,
                                            author: currentMember.name
                                          }
                                        ]
                                      };
                                      onUpdateOrder(updated);
                                    }}
                                    className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[11px] text-slate-800 focus:outline-none focus:border-slate-500 w-full"
                                  >
                                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                  </select>
                                </div>
                              ) : o.status === 'in_production' ? (
                                <div className="flex flex-col items-center gap-1.5 w-full max-w-[150px]">
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('production')}
                                    className="w-full px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors flex items-center justify-center space-x-1"
                                    title="View this job in production flow"
                                  >
                                    <span>Production Flow &rarr;</span>
                                  </button>
                                  <select
                                    value={o.status}
                                    onChange={(e) => {
                                      const newStg = e.target.value;
                                      const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                                      const updated = { 
                                        ...o, 
                                        status: newStg,
                                        timeline: [
                                          ...(o.timeline || []),
                                          {
                                            stage: newStg,
                                            title: `Status Changed to ${newStg.replace(/_/g, ' ')}`,
                                            description: `Updated by ${currentMember.name}.`,
                                            timestamp: formattedDate,
                                            author: currentMember.name
                                          }
                                        ]
                                      };
                                      onUpdateOrder(updated);
                                    }}
                                    className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[11px] text-slate-800 focus:outline-none focus:border-slate-500 w-full"
                                  >
                                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                  </select>
                                </div>
                              ) : (
                                <div className="w-full max-w-[150px] space-y-1">
                                  {o.status === 'rejected' && o.rejectionReason && (
                                    <div className="text-[10px] text-rose-600 truncate max-w-[140px] mx-auto font-medium" title={o.rejectionReason}>
                                      {o.rejectionReason}
                                    </div>
                                  )}
                                  <select
                                    value={o.status}
                                    onChange={(e) => {
                                      const newStg = e.target.value;
                                      const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                                      const updated = { 
                                        ...o, 
                                        status: newStg,
                                        timeline: [
                                          ...(o.timeline || []),
                                          {
                                            stage: newStg,
                                            title: `Status Changed to ${newStg.replace(/_/g, ' ')}`,
                                            description: `Updated by ${currentMember.name}.`,
                                            timestamp: formattedDate,
                                            author: currentMember.name
                                          }
                                        ]
                                      };
                                      onUpdateOrder(updated);
                                    }}
                                    className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[11px] text-slate-800 focus:outline-none focus:border-slate-500 w-full"
                                  >
                                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                  </select>
                                </div>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {/* Kanban Quick Search Bar */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={adminSearchBrandSpecs}
                      onChange={(e) => setAdminSearchBrandSpecs(e.target.value)}
                      placeholder="Search specs, brand, or item..."
                      className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors"
                    />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <input
                      type="text"
                      value={adminSearchCustomer}
                      onChange={(e) => setAdminSearchCustomer(e.target.value)}
                      placeholder="Filter by customer name..."
                      className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors"
                    />
                  </div>
                  <div className="w-48">
                    <input
                      type="text"
                      value={adminSearchOrderId}
                      onChange={(e) => setAdminSearchOrderId(e.target.value)}
                      placeholder="Search Order ID..."
                      className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors font-mono"
                    />
                  </div>
                  {(adminSearchBrandSpecs || adminSearchCustomer || adminSearchOrderId) && (
                    <button
                      onClick={() => {
                        setAdminSearchBrandSpecs('');
                        setAdminSearchCustomer('');
                        setAdminSearchOrderId('');
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-2"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['pending', 'approved', 'in_production', 'delivered'].map(stg => {
                  const stageOrders = filteredAdminOrders.filter(o => {
                    if (stg === 'pending') return o.status === 'pending' || o.status === 'placed';
                    if (stg === 'approved') return o.status === 'approved' || o.status === 'confirmed';
                    return o.status === stg;
                  });
                  return (
                  <div key={stg} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
                      <span>{stg.replace('_', ' ')}</span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                        {stageOrders.length}
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {stageOrders.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-xs italic">
                          No orders in this stage
                        </div>
                      )}
                      {stageOrders.map(o => (
                        <div key={o.id} className="bg-white border border-slate-200 rounded-xl p-3 text-xs space-y-2 shadow-2xs">
                          <div className="flex justify-between font-mono font-bold text-slate-900">
                            <span>{o.id}</span>
                            <span>{formatCurrency(o.total)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {o.items[0]?.image && (
                              <img src={o.items[0].image} alt="Art" className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white" />
                            )}
                            <div>
                              <div className="font-semibold text-slate-900">{o.customerCompany}</div>
                              <div className="text-[10px] text-slate-500">
                                {o.items[0]?.brandName} &bull; {o.items[0]?.type}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                            <span className="text-[10px] text-slate-500">{o.items[0]?.dori || 'Reg.'}</span>
                            <div className="space-x-1">
                              {o.status === 'approved' && (
                                <button 
                                  type="button" 
                                  onClick={() => handleOpenMoveToProduction(o)} 
                                  className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white px-2 py-0.5 rounded font-medium shadow-xs"
                                  title="Create Job Card &amp; Start Production"
                                >
                                  Start Production
                                </button>
                              )}
                              {o.status !== 'approved' && o.status !== 'in_production' && (
                                <>
                                  <button 
                                    type="button"
                                    onClick={() => handleOpenMoveToProduction(o)} 
                                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white px-2 py-0.5 rounded font-medium shadow-xs"
                                    title="Start Production directly"
                                  >
                                    Start Production
                                  </button>
                                  <button onClick={() => handleApproveOrder(o)} className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded font-medium">Approve</button>
                                </>
                              )}
                              {o.status !== 'rejected' && o.status !== 'in_production' && (
                                <button onClick={() => handleOpenRejectModal(o)} className="text-[10px] bg-white text-rose-700 border border-slate-200 px-2 py-0.5 rounded font-medium">Reject</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })}
              </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODULE 3: CREATE INVOICE */}
      {activeTab === 'create_invoice' && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs text-slate-800 animate-fade-in space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Generate Commercial Invoice</h3>
            <p className="text-xs text-slate-500">Issue an invoice against a completed manufacturing order.</p>
          </div>

          <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Select Order to Bill</label>
              <select
                value={invOrderId}
                onChange={(e) => setInvOrderId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.id} &bull; {o.customerCompany} &bull; {formatCurrency(o.total)} ({o.status})
                  </option>
                ))}
              </select>
            </div>

            {targetOrder && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-semibold text-slate-900">{targetOrder.customerCompany} ({targetOrder.customerName})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Items:</span>
                  <span className="text-slate-700">{targetOrder.items.map(i => i.name).join(', ')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total Billable:</span>
                  <span className="text-slate-900 font-mono">{formatCurrency(targetOrder.total)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Payment Due Date</label>
              <input
                type="date"
                value={invDueDate}
                onChange={(e) => setInvDueDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 rounded-xl transition-colors"
            >
              Generate Commercial Invoice
            </button>
          </form>
        </div>
      )}

      {/* MODULE 4: VIEW ALL INVOICES */}
      {activeTab === 'all_invoices' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
            <h3 className="font-bold text-slate-900 text-base mb-1">Commercial Invoices Register</h3>
            <p className="text-xs text-slate-500 mb-4">Master record of all tax invoices and payment collections.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Invoice No</th>
                    <th className="py-3 px-4 font-semibold">Customer Party</th>
                    <th className="py-3 px-4 font-semibold">Order Ref</th>
                    <th className="py-3 px-4 font-semibold">Issue Date</th>
                    <th className="py-3 px-4 font-semibold">Total Amount</th>
                    <th className="py-3 px-4 font-semibold">Collected</th>
                    <th className="py-3 px-4 font-semibold">Balance Due</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{inv.id}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{inv.customerCompany || inv.customerName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{inv.orderId}</td>
                      <td className="py-3.5 px-4 text-slate-600">{formatDate(inv.issueDate)}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{formatCurrency(inv.total)}</td>
                      <td className="py-3.5 px-4 text-emerald-700 font-medium">{formatCurrency(inv.paidAmount)}</td>
                      <td className="py-3.5 px-4 font-bold text-amber-700">{formatCurrency(inv.balanceDue)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            const linkedOrder = orders.find(o => o.id === inv.orderId) || { ...inv, shippingAddress: 'Client Registered Address', priority: 'standard' };
                            onOpenInvoice(linkedOrder);
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                        >
                          Print / View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 5: LEDGERS HUB */}
      {activeTab === 'ledgers' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Party-Wise Customer Ledgers</h3>
                <p className="text-xs text-slate-500">Statement of Account with double-entry debits and credits.</p>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-slate-600">Select Party:</label>
                <select
                  value={selectedLedgerPartyId}
                  onChange={(e) => setSelectedLedgerPartyId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  {users.customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[11px] text-slate-500 uppercase font-semibold block tracking-wider">Total Invoiced (Debits)</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(partyLedger.totalDebited)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[11px] text-slate-500 uppercase font-semibold block tracking-wider">Total Received (Credits)</span>
                <span className="text-lg font-bold text-emerald-700">{formatCurrency(partyLedger.totalCredited)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <span className="text-[11px] text-slate-500 uppercase font-semibold block tracking-wider">Current Net Balance</span>
                <span className="text-lg font-bold text-slate-900">{formatCurrency(partyLedger.closingBalance)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Transaction / Type</th>
                    <th className="py-3 px-4 font-semibold">Ref / Doc No</th>
                    <th className="py-3 px-4 font-semibold">Particulars</th>
                    <th className="py-3 px-4 text-right font-semibold">Debit (₹)</th>
                    <th className="py-3 px-4 text-right font-semibold">Credit (₹)</th>
                    <th className="py-3 px-4 text-right font-semibold">Running Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partyLedger.journal.map((j, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-500">{formatDate(j.date)}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{j.type}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{j.refNo}</td>
                      <td className="py-3 px-4 text-slate-600">{j.particulars}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">{j.debit > 0 ? formatCurrency(j.debit) : '—'}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700">{j.credit > 0 ? formatCurrency(j.credit) : '—'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(j.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 6: PAYMENT ENTRIES */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
            <h3 className="font-bold text-slate-900 text-base mb-1">Record Inward Payment</h3>
            <p className="text-xs text-slate-500 mb-4">Post client collections to update outstanding ledgers.</p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Customer Party</label>
                <select
                  value={payCustId}
                  onChange={(e) => setPayCustId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  {users.customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Knock-off Invoice (Optional)</label>
                <select
                  value={payInvId}
                  onChange={(e) => setPayInvId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="">General On-Account Advance</option>
                  {custPendingInvoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.id} (Due: {formatCurrency(inv.balanceDue)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="NEFT / Bank Transfer">NEFT / RTGS</option>
                    <option value="UPI (Corporate)">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Reference / UTR No</label>
                <input
                  type="text"
                  value={payRefNo}
                  onChange={(e) => setPayRefNo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Remarks</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors mt-2"
              >
                Post Payment Receipt
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
            <h3 className="font-bold text-slate-900 text-base mb-1">Recent Collections Log</h3>
            <p className="text-xs text-slate-500 mb-4">Historical receipts posted to accounts.</p>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                <tr>
                  <th className="py-3 px-4 font-semibold">Receipt No</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Mode & Ref</th>
                  <th className="py-3 px-4 text-right font-semibold">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{p.id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{p.customerCompany || p.customerName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{formatDate(p.date)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.paymentMode} ({p.referenceNumber})</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* MODULE 7: PRODUCTION FLOW MANAGER (FULL SHOP-FLOOR SEQUENTIAL PIPELINE) */}
      {activeTab === 'production' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header & Role Context Banner */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 text-base">Shop-Floor Production Flow Manager</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Live Pipeline
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Sequential 5-Step Flow: <strong>1. Paper Cutting</strong> &rarr; <strong>2. Printing</strong> &rarr; <strong>3. Punching &amp; Packing</strong> &rarr; <strong>4. Handwork Process</strong> &rarr; <strong>5. Dispatch</strong>.
                </p>
              </div>

              {/* Action Buttons & Persona Badge */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCycleManagerModal(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs hover:shadow transition-all flex items-center space-x-1.5 cursor-pointer"
                  title="Configure & create production cycles"
                >
                  <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Production Cycles ({availableCycles.length})</span>
                </button>

                <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500">Operator:</span>
                  <span className="font-semibold text-xs text-slate-900">{currentMember.name}</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                    {currentMember.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage Filter Tabs (Executive & Role-based) */}
            <div className="flex flex-wrap gap-2 pt-4">
              <button
                type="button"
                onClick={() => setProductionFilterStage('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  productionFilterStage === 'all' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>All Active Jobs</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-mono">
                  {production.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProductionFilterStage('cutting')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  productionFilterStage === 'cutting' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>1. Paper Cutting</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-mono">
                  {production.filter(j => (j.currentStage || 'cutting') === 'cutting').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProductionFilterStage('printing')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  productionFilterStage === 'printing' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>2. Printing Press</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-mono">
                  {production.filter(j => j.currentStage === 'printing').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProductionFilterStage('punching')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  productionFilterStage === 'punching' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>3. Punching &amp; Packing</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-mono">
                  {production.filter(j => j.currentStage === 'punching').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProductionFilterStage('handwork')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  productionFilterStage === 'handwork' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>4. Handwork Process</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-mono">
                  {production.filter(j => j.currentStage === 'handwork').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProductionFilterStage('dispatch')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  productionFilterStage === 'dispatch' || productionFilterStage === 'godown'
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>5. Dispatch / Ready</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-mono">
                  {production.filter(j => j.currentStage === 'dispatch' || j.currentStage === 'godown' || j.stage === 'packaged').length}
                </span>
              </button>
            </div>
          </div>

          {/* Sequential Job Cards Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {production
              .filter(job => {
                const stage = job.currentStage || (job.stage === 'packaged' ? 'dispatch' : job.stage === 'quality_checked' ? 'handwork' : 'cutting');
                if (currentMember.role === 'cutting') return stage === 'cutting';
                if (currentMember.role === 'printing') return stage === 'printing';
                if (currentMember.role === 'punching') return stage === 'punching';
                if (currentMember.role === 'labourer') {
                  return stage === 'handwork' && (!job.handwork?.assignedLabourerId || job.handwork?.assignedLabourerId === currentMember.id);
                }
                if (productionFilterStage !== 'all') {
                  if (productionFilterStage === 'dispatch') return stage === 'dispatch' || stage === 'godown' || job.stage === 'packaged';
                  return stage === productionFilterStage;
                }
                return true;
              })
              .map(job => {
                const stage = job.currentStage || (job.stage === 'packaged' ? 'dispatch' : job.stage === 'quality_checked' ? 'handwork' : 'cutting');
                const isCutting = stage === 'cutting';
                const isPrinting = stage === 'printing';
                const isPunching = stage === 'punching';
                const isHandwork = stage === 'handwork';
                const isDispatch = stage === 'dispatch' || stage === 'godown' || job.stage === 'packaged';

                // Stepper definition based on assigned cycle
                const jobCycle = availableCycles.find(c => c.id === job.cycleId) || DEFAULT_CYCLES[0];
                const cycleSteps = job.cycleSteps || jobCycle.steps;

                // Mandatory 9 Fields Resolution
                const displayDate = job.date || (job.createdAt ? formatDate(job.createdAt) : new Date().toISOString().split('T')[0]);
                const displayJobNumber = formatJobCardNumber(job);
                const displayCustomerOrderId = job.customerOrderId || orders.find(o => o.id === (job.orderId || job.orderNumber))?.customerOrderId || (job.orderNumber || job.orderId || '').split('-').pop() || 'MGC01';
                const displayOrderNumber = job.orderNumber || job.orderId;
                const displayPartyName = job.partyName || job.customerCompany || job.customerName || 'Valued Client';
                const displayPaperName = job.paperName || job.catalogCode || (job.cards && job.cards[0]?.catalogCode) || 'Paper #01 (Art Card 350 GSM)';
                const displayOrderQty = Number(job.orderQty || job.targetQty || 1000);
                const displayWastageQty = job.wastageQty !== undefined ? Number(job.wastageQty) : getWastageTags(displayOrderQty);
                const displayProdQty = Number(job.productionQty || (displayOrderQty + displayWastageQty));
                const displayUps = Number(job.ups || 10);
                const displayIssuedSheets = Number(job.issuedSheets || job.targetSheets || Math.ceil(displayProdQty / displayUps));
                const displayMinFloor = Number(job.minimumAllowedFloor || Math.ceil(displayOrderQty / displayUps));
                const displayNumColors = job.numPrintingColors || 4;
                const displayNameColors = job.namePrintingColors || 'CMYK (Full Color)';
                const displayPriority = job.priority || 'standard';

                // Artwork image resolution
                const parentOrder = orders.find(o => o.id === (job.orderId || job.orderNumber));
                const parentItem = parentOrder?.items?.find(it => it.id === job.itemId || it.name === job.itemName) || parentOrder?.items?.[0];
                const displayImage = job.image || (job.subCards && job.subCards[0]?.image) || parentItem?.cards?.[job.cardIndex ? job.cardIndex - 1 : 0]?.image || parentItem?.image || parentItem?.artwork || parentOrder?.artwork || null;

                return (
                  <div 
                    key={job.jobId} 
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all text-slate-800"
                  >
                    <div>
                      {/* Card Top Banner: Artwork Thumbnail Preview, Date, Compact Job ID, Order ID & Priority */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Artwork Thumbnail Preview with Hover Crop Action */}
                          <div className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 shadow-2xs">
                            {displayImage ? (
                              <>
                                <img 
                                  src={displayImage} 
                                  alt="Tag Artwork" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                                  onClick={() => setCropJobTarget({ jobId: job.jobId, imageSrc: displayImage })}
                                  title="Click to Crop / Adjust Artwork"
                                />
                                <button
                                  type="button"
                                  onClick={() => setCropJobTarget({ jobId: job.jobId, imageSrc: displayImage })}
                                  className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-medium"
                                >
                                  <span>✂️ Crop</span>
                                  <span className="text-[8px] text-slate-300">Adjust</span>
                                </button>
                              </>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors p-1 text-center">
                                <span className="text-base leading-none">🖼️</span>
                                <span className="text-[9px] font-semibold mt-1">+ Artwork</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleUploadJobArtwork(job.jobId, e)}
                                />
                              </label>
                            )}
                          </div>

                          {/* Job Card Title & Compact Number */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col items-start gap-0.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-lg">
                                  {displayJobNumber}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Date: {displayDate}
                                </span>
                              </div>
                              
                              {/* Customer Order Number directly below Job Card Number */}
                              <div className="text-[11px] font-mono text-slate-600 font-semibold mt-0.5">
                                Order: <span className="text-slate-900 font-bold bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded">{displayCustomerOrderId}</span>
                              </div>
                            </div>
                            
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base mt-1 truncate" title={job.itemName}>
                              {job.itemName}
                            </h4>
                            
                            <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span className="text-slate-500">Party:</span>
                              <span className="font-bold text-slate-900">{displayPartyName}</span>
                              {job.isMultiCardComponent && (
                                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                                  Component: {job.cardTitle || `Card #${job.cardIndex || 1}`} ({job.cardIndex || 1} of {job.totalCardsInSet || 2})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            displayPriority === 'urgent' 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : displayPriority === 'high'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {displayPriority}
                          </span>
                          <span className="text-[9px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                            {job.cycleName || jobCycle.name}
                          </span>
                          {displayImage && (
                            <label className="text-[9px] text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium underline">
                              Change Image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleUploadJobArtwork(job.jobId, e)}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* MANDATORY 9 JOB CARD FIELDS STRUCTURED SPECIFICATION BOX */}
                      <div className="mt-3.5 bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-200/70 pb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Job Card Specification Record
                          </span>
                          <span className="text-[10px] font-mono text-slate-600">
                            {displayDate}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Party Name</span>
                            <span className="font-semibold text-slate-900 truncate block" title={displayPartyName}>
                              {displayPartyName}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Paper Name</span>
                            <span className="font-bold text-slate-900 truncate block text-indigo-950" title={displayPaperName}>
                              {displayPaperName}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Order Quantity</span>
                            <span className="font-mono font-bold text-slate-900">
                              {displayOrderQty.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">pcs</span>
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Printing Colors</span>
                            <span className="font-semibold text-slate-900 font-mono">
                              {displayNumColors} {displayNumColors === 1 ? 'Color' : 'Colors'}
                            </span>
                          </div>

                          <div className="col-span-2">
                            <span className="text-[10px] text-slate-400 block font-medium">Name of Printing Colors</span>
                            <span className="font-medium text-slate-900 truncate block" title={displayNameColors}>
                              {displayNameColors}
                            </span>
                          </div>
                        </div>

                        {/* Sheet Wastage & Issuance Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-center font-mono text-xs">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Net Order</span>
                            <span className="font-bold text-slate-900">{displayOrderQty.toLocaleString()}</span>
                            <span className="text-[9px] text-slate-400 block font-sans">tags ordered</span>
                          </div>
                          <div className="border-x border-slate-200">
                            <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Total Tags (+Waste)</span>
                            <span className="font-bold text-slate-900">{displayProdQty.toLocaleString()}</span>
                            <span className="text-[9px] text-emerald-600 font-semibold block font-sans">+{displayWastageQty.toLocaleString()} tags waste</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Issued Sheets</span>
                            <span className="font-bold text-slate-900">{displayIssuedSheets.toLocaleString()}</span>
                            <span className="text-[9px] text-slate-400 block font-sans">@{displayUps} ups (exact)</span>
                          </div>
                        </div>
                      </div>

                      {/* DYNAMIC CYCLE STEPPER BAR */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-slate-500 mb-1.5 overflow-x-auto gap-2">
                          {cycleSteps.map((step, sIdx) => {
                            const isDone = job[step.key]?.status === 'completed';
                            const isCurrent = stage === step.key;
                            return (
                              <span 
                                key={step.key} 
                                className={`whitespace-nowrap ${
                                  isDone 
                                    ? 'text-emerald-700 font-bold' 
                                    : isCurrent 
                                    ? 'text-slate-900 font-bold' 
                                    : 'text-slate-400'
                                }`}
                              >
                                {isDone ? '✓ ' : `${sIdx + 1}. `}{step.name.split(' ')[0]}
                              </span>
                            );
                          })}
                        </div>
                        <div className="grid gap-1 h-1.5 rounded-full overflow-hidden bg-slate-100" style={{ gridTemplateColumns: `repeat(${cycleSteps.length}, minmax(0, 1fr))` }}>
                          {cycleSteps.map(step => {
                            const isDone = job[step.key]?.status === 'completed';
                            const isCurrent = stage === step.key;
                            return (
                              <div 
                                key={step.key} 
                                className={`h-full ${isDone ? 'bg-emerald-600' : isCurrent ? 'bg-slate-900' : 'bg-slate-200'}`}
                              ></div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Stage Specific Interactive Action Panel */}
                    <div className="mt-2 bg-slate-50 border border-slate-200/90 rounded-xl p-4">
                      
                      {/* STAGE 1: PAPER CUTTING PROCESS */}
                      {isCutting && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-800">
                                Paper Cutting Station:
                              </span>
                              <select
                                value={getSheetInput(job.jobId, 'cuttingOperator', job.cutting?.operatorName || 'Ramesh')}
                                onChange={(e) => handleUpdateJobOperator(job.jobId, 'cutting', e.target.value)}
                                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                              >
                                {cuttingOperators.map(op => <option key={op} value={op}>{op}</option>)}
                              </select>
                            </div>
                            <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              Step 1 &bull; Guillotine Sizing
                            </span>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between font-mono">
                            <span className="text-slate-500">Allocated Paper:</span>
                            <span className="font-bold text-slate-900">{displayPaperName}</span>
                          </div>

                          {job.cutting?.status !== 'in_progress' ? (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-slate-500">Master sheets ready for cutting &amp; sizing.</span>
                              <button
                                type="button"
                                onClick={() => handleStartCutting(job)}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-xl transition-colors"
                              >
                                Start Paper Cutting
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3 pt-1">
                              <div>
                                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                                  Good Sized Sheets Cut <span className="text-rose-600">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder={`e.g. ${displayIssuedSheets}`}
                                  value={getSheetInput(job.jobId, 'cutSheets', displayIssuedSheets)}
                                  onChange={(e) => setSheetInput(job.jobId, 'cutSheets', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                />
                                <span className="text-[10px] text-slate-500 mt-1 block">
                                  Enter good cut sheets produced. System automatically computes waste.
                                </span>
                              </div>

                              {/* Live 3-Box Automatic Waste Calculation */}
                              {(() => {
                                const currentCut = Number(getSheetInput(job.jobId, 'cutSheets', displayIssuedSheets));
                                const liveCutWaste = Math.max(0, displayIssuedSheets - currentCut);
                                return (
                                  <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center font-mono text-xs">
                                    <div>
                                      <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Issued Sheets</span>
                                      <span className="font-bold text-slate-900">{displayIssuedSheets}</span>
                                    </div>
                                    <div className="border-x border-slate-200">
                                      <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Good Cut Sheets</span>
                                      <span className="font-bold text-slate-900">{currentCut}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">System Calc Waste</span>
                                      <span className={`font-bold ${liveCutWaste > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        {liveCutWaste} {liveCutWaste === 1 ? 'sheet' : 'sheets'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}

                              <button
                                type="button"
                                onClick={() => handleCompleteCutting(job)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                              >
                                <span>Complete Cutting &amp; Forward to Next Process</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* STAGE 2: PRINTING PROCESS */}
                      {isPrinting && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-800">
                                Printing Press Station:
                              </span>
                              <select
                                value={getSheetInput(job.jobId, 'printingOperator', job.printing?.operatorName || 'Kanu')}
                                onChange={(e) => handleUpdateJobOperator(job.jobId, 'printing', e.target.value)}
                                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                              >
                                {printingOperators.map(op => <option key={op} value={op}>{op}</option>)}
                              </select>
                            </div>
                            <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              Step 2 &bull; {displayNumColors} Colors
                            </span>
                          </div>

                          {job.printing?.status !== 'in_progress' ? (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-slate-500">Job queued for offset/digital press.</span>
                              <button
                                type="button"
                                onClick={() => handleStartPrinting(job)}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-xl transition-colors"
                              >
                                Start Printing
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3 pt-1">
                              <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-xl">
                                <strong>Rule:</strong> Record final good sheets printed. Minimum to fulfill order: &ge; {displayMinFloor} sheets.
                              </div>

                              <div>
                                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                                  Good Sheets Printed <span className="text-rose-600">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder={`e.g. ${job.cutting?.goodSheetsCut || displayIssuedSheets}`}
                                  value={getSheetInput(job.jobId, 'printed', job.cutting?.goodSheetsCut || displayIssuedSheets)}
                                  onChange={(e) => setSheetInput(job.jobId, 'printed', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                />
                                <span className="text-[10px] text-slate-500 mt-1 block">
                                  Operator enters final printed sheets. Spoilage/wastage is calculated automatically.
                                </span>
                              </div>

                              {/* Live 3-Box Automatic Waste Calculation */}
                              {(() => {
                                const cutInputSheets = Number(job.cutting?.goodSheetsCut || displayIssuedSheets);
                                const currentPrinted = Number(getSheetInput(job.jobId, 'printed', cutInputSheets));
                                const livePrintWaste = Math.max(0, cutInputSheets - currentPrinted);
                                return (
                                  <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center font-mono text-xs">
                                    <div>
                                      <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Cut Sheets In</span>
                                      <span className="font-bold text-slate-900">{cutInputSheets}</span>
                                    </div>
                                    <div className="border-x border-slate-200">
                                      <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Good Printed</span>
                                      <span className="font-bold text-slate-900">{currentPrinted}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">System Calc Waste</span>
                                      <span className={`font-bold ${livePrintWaste > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        {livePrintWaste} {livePrintWaste === 1 ? 'sheet' : 'sheets'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}

                              <button
                                type="button"
                                onClick={() => handleCompletePrinting(job)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                              >
                                <span>Complete Printing &amp; Forward to Next Process</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* STAGE 3: PUNCHING & PACKING PROCESS */}
                      {isPunching && (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-800">
                                Punching &amp; Die Press:
                              </span>
                              <select
                                value={getSheetInput(job.jobId, 'punchingOperator', job.punching?.operatorName || 'Shivakant')}
                                onChange={(e) => handleUpdateJobOperator(job.jobId, 'punching', e.target.value)}
                                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                              >
                                {punchingOperators.map(op => <option key={op} value={op}>{op}</option>)}
                              </select>
                            </div>
                            <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              Step 3 &bull; Die-Cut &amp; Crease
                            </span>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between font-mono">
                            <span className="text-slate-500">Printed Input Received:</span>
                            <span className="font-bold text-slate-900">
                              {job.printing?.goodSheetsPrinted || job.targetSheets || 520} sheets
                            </span>
                          </div>

                          {job.punching?.status !== 'in_progress' ? (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-slate-500">Ready for die-punching &amp; creasing.</span>
                              <button
                                type="button"
                                onClick={() => handleStartPunching(job)}
                                className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-xl transition-colors"
                              >
                                Start Punching
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3 pt-1">
                              <div>
                                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                                  Good Punched Sheets <span className="text-rose-600">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  placeholder={`e.g. ${job.printing?.goodSheetsPrinted || job.targetSheets || 520}`}
                                  value={getSheetInput(job.jobId, 'punched', job.printing?.goodSheetsPrinted || job.targetSheets || 520)}
                                  onChange={(e) => setSheetInput(job.jobId, 'punched', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                />
                                <span className="text-[10px] text-slate-500 mt-1 block">
                                  Operator enters good punched sheets. Die waste is calculated automatically.
                                </span>
                              </div>

                              {/* Live 3-Box Automatic Waste Calculation */}
                              {(() => {
                                const printInputSheets = Number(job.printing?.goodSheetsPrinted || job.cutting?.goodSheetsCut || displayIssuedSheets);
                                const currentPunched = Number(getSheetInput(job.jobId, 'punched', printInputSheets));
                                const livePunchWaste = Math.max(0, printInputSheets - currentPunched);
                                return (
                                  <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center font-mono text-xs">
                                    <div>
                                      <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Printed Sheets In</span>
                                      <span className="font-bold text-slate-900">{printInputSheets}</span>
                                    </div>
                                    <div className="border-x border-slate-200">
                                      <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Good Punched</span>
                                      <span className="font-bold text-slate-900">{currentPunched}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">System Calc Waste</span>
                                      <span className={`font-bold ${livePunchWaste > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                        {livePunchWaste} {livePunchWaste === 1 ? 'sheet' : 'sheets'}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}

                              <button
                                type="button"
                                onClick={() => handleCompletePunching(job)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                              >
                                <span>Complete Punching &amp; Forward to Next Process</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* STAGE 4: HANDWORK PROCESS (DORI & PLASTIC) */}
                      {isHandwork && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800">
                              Handwork Assembly (Dori &amp; Plastic)
                            </span>
                            <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              Step 4 &bull; String &amp; Seal Lock
                            </span>
                          </div>

                          {/* Rate Card & Specification Summary */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-mono">
                            <div>
                              <span className="text-[10px] text-slate-500 block font-sans">Dori Spec</span>
                              <span className="font-bold text-slate-900">{job.handwork?.doriType || 'Reg.'}</span>
                              <span className="text-[10px] text-slate-500 block">@ ₹{job.handwork?.doriRate || '0.20'}/pc</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block font-sans">Plastic Lock</span>
                              <span className="font-bold text-slate-900">{job.handwork?.plasticType || 'Reg.'}</span>
                              <span className="text-[10px] text-slate-500 block">@ ₹{job.handwork?.plasticRate || '0.10'}/pc</span>
                            </div>
                            <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-1 sm:pt-0 sm:pl-2">
                              <span className="text-[10px] text-slate-700 block font-sans font-semibold">Total Rate</span>
                              <span className="font-bold text-slate-900 text-sm">
                                ₹{(job.handwork?.totalRatePerTag || 0.30).toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-500 block font-sans">per tag set</span>
                            </div>
                          </div>

                          {/* Manager Assignment Controls (If unassigned or admin role) */}
                          {(!job.handwork?.assignedLabourerId || currentMember.role === 'admin' || currentMember.role === 'manager') && (
                            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                              <span className="text-[11px] font-semibold text-slate-700 block">
                                Assign Job to Handwork Labourer:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="sm:col-span-2">
                                  <select
                                    value={getSheetInput(job.jobId, 'labourerId', job.handwork?.assignedLabourerId || '')}
                                    onChange={(e) => setSheetInput(job.jobId, 'labourerId', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  >
                                    <option value="">-- Choose Labourer / Artisan --</option>
                                    {users.team
                                      .filter(u => u.role === 'labourer')
                                      .map(l => (
                                        <option key={l.id} value={l.id}>{l.name} ({l.roleLabel})</option>
                                      ))
                                    }
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAssignHandwork(job)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-3 rounded-xl transition-colors"
                                >
                                  Assign Batch
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Labourer Execution Panel */}
                          {job.handwork?.assignedLabourerId && (
                            <div className="bg-white border border-slate-200 p-3 rounded-xl space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <div>
                                  <span className="text-slate-500">Assigned Artisan:</span>{' '}
                                  <strong className="text-slate-900">{job.handwork.assignedLabourerName}</strong>
                                </div>
                                <div className="font-mono text-emerald-700 font-bold">
                                  Potential Earning: {formatCurrency((job.targetQty || 1000) * (job.handwork.totalRatePerTag || 0.30))}
                                </div>
                              </div>

                              {job.handwork?.status !== 'in_progress' ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartHandwork(job)}
                                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl transition-colors"
                                >
                                  Start Handwork Assembly
                                </button>
                              ) : (
                                <div className="space-y-3 pt-1">
                                  <div>
                                    <label className="text-[11px] font-medium text-slate-700 block mb-1">
                                      Final Completed Tags Produced (Pcs / Tags) <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      placeholder={`e.g. ${Number((job.punching?.goodSheetsPunched || job.targetSheets || 520) * (job.ups || 10))}`}
                                      value={getSheetInput(job.jobId, 'handworkPieces', Number((job.punching?.goodSheetsPunched || job.targetSheets || 520) * (job.ups || 10)))}
                                      onChange={(e) => setSheetInput(job.jobId, 'handworkPieces', e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                    <span className="text-[10px] text-slate-500 mt-1 block">
                                      Enter actual tags produced in pieces (NOT sheets). System calculates wastage automatically.
                                    </span>
                                  </div>

                                  {/* Live 3-Box Automatic Waste Calculation for Tags */}
                                  {(() => {
                                    const ups = Number(job.ups || 10);
                                    const punchedSheets = Number(job.punching?.goodSheetsPunched || job.targetSheets || 520);
                                    const receivedTags = punchedSheets * ups;
                                    const currentFinalTags = Number(getSheetInput(job.jobId, 'handworkPieces', receivedTags));
                                    const liveHandworkWasteTags = Math.max(0, receivedTags - currentFinalTags);
                                    return (
                                      <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center font-mono text-xs">
                                        <div>
                                          <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Punched Tags In</span>
                                          <span className="font-bold text-slate-900">{receivedTags.toLocaleString()} pcs</span>
                                        </div>
                                        <div className="border-x border-slate-200">
                                          <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Good Tags Made</span>
                                          <span className="font-bold text-slate-900">{currentFinalTags.toLocaleString()} pcs</span>
                                        </div>
                                        <div>
                                          <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">System Calc Waste</span>
                                          <span className={`font-bold ${liveHandworkWasteTags > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                            {liveHandworkWasteTags.toLocaleString()} pcs
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  <button
                                    type="button"
                                    onClick={() => handleCompleteHandwork(job)}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl transition-colors"
                                  >
                                    Mark Complete &amp; Move to Dispatch
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* STAGE 5: DISPATCH PROCESS */}
                      {isDispatch && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800">
                              Dispatch &amp; Finished Goods
                            </span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
                              Step 5 &bull; Quality Checked ✓
                            </span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Warehouse Location:</span>
                              <span className="font-mono font-semibold text-slate-900">{job.godown?.location || 'Bay 01 - Finished Goods'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Verified Quantity:</span>
                              <span className="font-mono font-bold text-emerald-700">
                                {job.handwork?.completedPieces || job.targetQty || 1000} pcs ready for dispatch
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Handwork Artisan:</span>
                              <span className="font-mono text-slate-700">
                                {job.handwork?.assignedLabourerName || 'Artisan'} &bull; {formatCurrency(job.handwork?.earnedPayout || 300)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                            <span className="text-[11px] font-semibold text-slate-700 block">Dispatch Courier &amp; Tracking Details</span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-500 block mb-0.5">Carrier</label>
                                <input
                                  type="text"
                                  value={getSheetInput(job.jobId, 'dispatchCarrier', 'BlueDart Express')}
                                  onChange={(e) => setSheetInput(job.jobId, 'dispatchCarrier', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 block mb-0.5">Tracking Number</label>
                                <input
                                  type="text"
                                  value={getSheetInput(job.jobId, 'dispatchTracking', `TRK-${job.jobId.replace(/[^0-9]/g, '').slice(-6) || '849201'}`)}
                                  onChange={(e) => setSheetInput(job.jobId, 'dispatchTracking', e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-1 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const parent = orders.find(o => o.id === job.orderId);
                                if (parent) onOpenInvoice(parent);
                              }}
                              className="bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs py-2 px-3 rounded-xl border border-slate-300 transition-colors"
                            >
                              Check Invoice
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCompleteDispatch(job)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs py-2 px-4 rounded-xl transition-colors shadow-xs"
                            >
                              Complete Dispatch
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}

            {production.length === 0 && (
              <div className="col-span-2 text-center py-16 bg-white border border-slate-200/90 rounded-2xl text-slate-500 shadow-xs">
                <p className="text-sm font-semibold text-slate-800">No active production jobs yet.</p>
                <p className="text-xs text-slate-500 mt-1">Go to &quot;View All Orders&quot; and click &quot;Start Production&quot; on any order to create its job card(s).</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 8: ATTENDANCE & PAYROLL FOR STAFF */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
            <h3 className="font-bold text-slate-900 text-base mb-1">Today&apos;s Staff Attendance Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 mt-3">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Staff Member</th>
                    <th className="py-3 px-4 font-semibold">Attendance Status</th>
                    <th className="py-3 px-4 font-semibold">Check In</th>
                    <th className="py-3 px-4 font-semibold">Check Out</th>
                    <th className="py-3 px-4 font-semibold">Overtime</th>
                    <th className="py-3 px-4 text-right font-semibold">Quick Mark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payroll.dailyAttendance.map(att => (
                    <tr key={att.staffId} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{att.name}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{att.checkIn}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{att.checkOut}</td>
                      <td className="py-3.5 px-4 text-slate-900 font-semibold">{att.overtime}</td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleToggleAttendance(att.staffId, 'Present')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleToggleAttendance(att.staffId, 'Leave')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                        >
                          Leave
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
            <h3 className="font-bold text-slate-900 text-base mb-1">Monthly Staff Payroll & Salary Computation</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 mt-3">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Member</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Base Wage</th>
                    <th className="py-3 px-4 font-semibold">Present Days</th>
                    <th className="py-3 px-4 font-semibold">Net Payable</th>
                    <th className="py-3 px-4 font-semibold">Disbursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payroll.staffSummary.map(staff => (
                    <tr key={staff.staffId} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{staff.name}</td>
                      <td className="py-3.5 px-4 text-slate-500">{staff.role}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{formatCurrency(staff.monthlySalary)}</td>
                      <td className="py-3.5 px-4 text-slate-700">{staff.presentDays} / {staff.workingDays}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">{formatCurrency(staff.netPayable)}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {staff.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PIECE-RATE HANDWORK (DORI & PLASTIC) PRODUCTION LEDGER */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Piece-Rate Handwork (Dori &amp; Plastic) Production Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily earnings accrued per completed tag batch by artisans (Standard: ₹0.20 Dori + ₹0.10 Plastic = ₹0.30/tag)
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500">Total Piece Payouts:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCurrency((payroll.pieceRateLedger || []).reduce((s, it) => s + (Number(it.earnedAmount) || 0), 0))}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">Tags Finished:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {(payroll.pieceRateLedger || []).reduce((s, it) => s + (Number(it.piecesCompleted) || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>

            {(payroll.pieceRateLedger && payroll.pieceRateLedger.length > 0) ? (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Artisan</th>
                      <th className="py-3 px-4 font-semibold">Job / Order Ref</th>
                      <th className="py-3 px-4 font-semibold">Pieces Assembled</th>
                      <th className="py-3 px-4 font-semibold">Rate / Tag</th>
                      <th className="py-3 px-4 font-mono font-semibold">Total Earned</th>
                      <th className="py-3 px-4 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payroll.pieceRateLedger.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-mono text-slate-500">{item.date}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">{item.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{item.staffId}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">{item.jobId}</span>
                          <span className="text-slate-500 text-[10px] ml-1.5 font-mono">({item.orderId})</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                          {Number(item.piecesCompleted || 0).toLocaleString()} tags
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          ₹{Number(item.ratePerTag || 0.30).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-sm">
                          {formatCurrency(item.earnedAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.status || 'Earned'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-3">
                No handwork batches completed yet. As soon as a handwork batch is completed in the production tab, piece-rate earnings will post directly here.
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODULE 10: RAW MATERIALS & INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Header & Restock Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Raw Materials &amp; Paper Stock Inventory
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Real-time stock of catalog paper boards, pre-cut dori threads, and plastic locks. Automatically depleted upon machine run completion.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setRestockItem(inventory[0] || null);
                  setRestockQty('');
                  setRestockSupplier(inventory[0]?.supplier || '');
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-4 rounded-xl transition-colors"
              >
                Inward Stock Receipt / Restock
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs">
              <div className="text-slate-500 text-xs font-medium">
                Paper Board Stock
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                {inventory.filter(i => i.category === 'paper').reduce((s, it) => s + (Number(it.currentStock) || 0), 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Available full-size press sheets</div>
            </div>

            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs">
              <div className="text-slate-500 text-xs font-medium">
                Dori Cords &amp; Twine
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                {inventory.filter(i => i.category === 'dori').reduce((s, it) => s + (Number(it.currentStock) || 0), 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Waxed cotton &amp; jute cords</div>
            </div>

            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs">
              <div className="text-slate-500 text-xs font-medium">
                Plastic Seal Locks
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                {inventory.filter(i => i.category === 'plastic').reduce((s, it) => s + (Number(it.currentStock) || 0), 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Bullet &amp; square locks</div>
            </div>

            <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs">
              <div className="text-slate-500 text-xs font-medium">
                Total Inventory Valuation
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                {formatCurrency(inventory.reduce((s, it) => s + ((Number(it.currentStock) || 0) * (Number(it.unitCost) || 0)), 0))}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Raw material assets on floor</div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            {[
              { id: 'all', label: 'All Raw Materials' },
              { id: 'paper', label: 'Catalog Paper Boards' },
              { id: 'dori', label: 'Dori Threads & Cords' },
              { id: 'plastic', label: 'Plastic Locks & Fasteners' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setInventoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  inventoryFilter === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Stock Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Material / Item</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Warehouse Bin</th>
                    <th className="py-3 px-4 font-semibold">Current Stock</th>
                    <th className="py-3 px-4 font-semibold">Reorder Level</th>
                    <th className="py-3 px-4 font-mono font-semibold">Unit Rate</th>
                    <th className="py-3 px-4 font-mono font-semibold">Stock Value</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory
                    .filter(item => inventoryFilter === 'all' || item.category === inventoryFilter)
                    .map(item => {
                      const isLow = (item.currentStock || 0) <= (item.reorderLevel || 1000);
                      const isCritical = (item.currentStock || 0) <= (item.reorderLevel || 1000) / 2;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{item.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.code || item.id}</div>
                          </td>
                          <td className="py-3.5 px-4 capitalize text-slate-600">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-medium text-slate-700 border border-slate-200">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">{item.location}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-sm">
                            {(item.currentStock || 0).toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">
                            {(item.reorderLevel || 0).toLocaleString()} {item.unit}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-700">
                            ₹{Number(item.unitCost || 0).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                            {formatCurrency((item.currentStock || 0) * (item.unitCost || 0))}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                              isCritical ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              isLow ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {isCritical ? 'Critical Low' : isLow ? 'Reorder Soon' : 'Healthy Stock'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setRestockItem(item);
                                setRestockQty('');
                                setRestockSupplier(item.supplier || '');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-[11px] font-medium transition-colors"
                            >
                              + Inward Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ARTWORK LIGHTBOX MODAL */}
      {previewArtworkUrl && (
        <div 
          onClick={() => setPreviewArtworkUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white border border-slate-200 rounded-2xl p-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Artwork Preview</span>
              <button
                type="button"
                onClick={() => setPreviewArtworkUrl(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center transition-colors"
              >
                &times;
              </button>
            </div>
            <img 
              src={previewArtworkUrl} 
              alt="High Resolution Artwork" 
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl mx-auto shadow-xs border border-slate-200" 
            />
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reject Order {rejectionModalOrder.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectionModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Please specify why this order is being rejected. The customer will see this reason and will receive a <strong>1-Click Duplicate Re-Order</strong> option.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 block">Select Rejection Reason:</label>
              {[
                'Paper Catalog temporarily out of stock',
                'Die-line / artwork file resolution unreadable',
                'Requested delivery date not feasible',
                'Custom attachments require quotation revision',
                'Other'
              ].map((reason, idx) => (
                <label 
                  key={idx} 
                  className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    rejectionReasonChoice === reason 
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={rejectionReasonChoice === reason}
                    onChange={(e) => setRejectionReasonChoice(e.target.value)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {rejectionReasonChoice === 'Other' && (
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Custom Notes / Clarification:</label>
                <textarea
                  rows="2"
                  placeholder="Specify custom instructions or reason..."
                  value={rejectionReasonCustom}
                  onChange={(e) => setRejectionReasonCustom(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                ></textarea>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModalOrder(null)}
                className="bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs py-2 px-4 rounded-xl border border-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs py-2 px-5 rounded-xl transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPOILAGE / SHORTAGE THRESHOLD ALERT MODAL */}
      {shortageAlertJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border-2 border-amber-300 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 text-slate-800">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center text-sm font-bold">
                !
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Production Shortage Alert</h3>
                <span className="text-xs text-slate-500 font-mono">Job: {shortageAlertJob.job.jobId} (Order: {shortageAlertJob.job.orderId})</span>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Order Target:</span>
                <span className="font-mono font-semibold text-slate-900">{(shortageAlertJob.job.targetQty || 1000).toLocaleString()} pcs</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Minimum Allowed Floor:</span>
                <span className="font-mono font-semibold text-slate-900">{shortageAlertJob.job.minimumAllowedFloor || 960} sheets</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Sheets Actually Printed:</span>
                <span className="font-mono font-bold text-rose-700 text-sm">{shortageAlertJob.printedSheets} sheets</span>
              </div>
              <div className="flex justify-between items-center border-t border-amber-200 pt-1.5">
                <span className="text-rose-700 font-semibold">Deficit Below Floor:</span>
                <span className="font-mono font-bold text-rose-700">
                  -{(shortageAlertJob.job.minimumAllowedFloor || 960) - shortageAlertJob.printedSheets} sheets
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              The printing operator logged <strong>{shortageAlertJob.printedSheets} sheets</strong>, which falls below your tolerance threshold. Choose an action:
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleResolveShortageAlert('reprint')}
                className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs py-2.5 px-4 rounded-xl border border-slate-300 transition-colors"
              >
                Trigger Rush Reprint Batch
              </button>
              <button
                type="button"
                onClick={() => handleResolveShortageAlert('accept_short')}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 px-4 rounded-xl transition-colors"
              >
                Accept Short Delivery ({shortageAlertJob.printedSheets} pcs)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GODOWN COURIER DISPATCH MODAL */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Dispatch Order {dispatchModalOrder.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div><strong>Client:</strong> {dispatchModalOrder.customerCompany || dispatchModalOrder.customerName}</div>
              <div><strong>Items:</strong> {dispatchModalOrder.items?.length || 1} tag bundle(s)</div>
              <div><strong>Invoice Status:</strong> <span className="text-emerald-700 font-semibold">Verified in Godown</span></div>
            </div>

            <form onSubmit={handleDispatchOrderSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Logistics / Courier Partner</label>
                <select
                  value={dispatchCarrier}
                  onChange={(e) => setDispatchCarrier(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="Bluedart Express">Bluedart Express</option>
                  <option value="Delhivery Logistics">Delhivery Logistics</option>
                  <option value="DTDC Air Courier">DTDC Air Courier</option>
                  <option value="Local Transporter / Tempo">Local Transporter / Tempo</option>
                  <option value="Direct Factory Handover">Direct Factory Handover</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Tracking Number / Lorry Receipt (LR) No.</label>
                <input
                  type="text"
                  placeholder="e.g. BLU-982104921 or LR-4412"
                  value={dispatchTrackingNo}
                  onChange={(e) => setDispatchTrackingNo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDispatchModalOrder(null)}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs py-2 px-4 rounded-xl border border-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-5 rounded-xl transition-colors"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVENTORY RESTOCK MODAL */}
      {restockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Inward Raw Material Stock</h3>
              </div>
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div><strong>Material:</strong> {restockItem.name}</div>
              <div><strong>Item Code:</strong> <span className="font-mono text-slate-900 font-medium">{restockItem.code || restockItem.id}</span></div>
              <div><strong>Current Stock:</strong> {(restockItem.currentStock || 0).toLocaleString()} {restockItem.unit}</div>
              <div><strong>Unit Cost:</strong> ₹{Number(restockItem.unitCost || 0).toFixed(2)}</div>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Received Quantity ({restockItem.unit}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder={`e.g. 5000 ${restockItem.unit}`}
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Supplier / Mill Name</label>
                <input
                  type="text"
                  placeholder="e.g. Century Pulp & Paper Mills"
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs py-2 px-4 rounded-xl border border-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-5 rounded-xl transition-colors"
                >
                  Add To Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAPER CATALOG ADD / EDIT MODAL */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingCatalog ? `Edit Paper Catalog: ${editingCatalog.code}` : 'Add New Paper Catalog Swatch'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCatalogSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Catalog Swatch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paper #01"
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Paper / Board Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Velvet Board 320 GSM"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">GSM (Weight) *</label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="1000"
                    placeholder="e.g. 350"
                    value={catGsm}
                    onChange={(e) => setCatGsm(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Surface Finish *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Silk Matte Coated"
                    value={catFinish}
                    onChange={(e) => setCatFinish(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Sheet Rate (₹) *</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0.10"
                    required
                    placeholder="e.g. 3.50"
                    value={catRate}
                    onChange={(e) => setCatRate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Opening Stock (Sheets)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 10000"
                  value={catStock}
                  onChange={(e) => setCatStock(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition-all"
                >
                  {editingCatalog ? 'Save Changes' : 'Create Paper Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* START PRODUCTION & JOB CARD CREATION MODAL */}
      {prodModalOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 text-base">
                    Start Production &bull; Job Card Creation
                  </h3>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                    {prodModalOrders.length} Order{prodModalOrders.length > 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Configure Job Card specifications (Date, Job #, Party, Paper, Qty, Colors, Priority) and select the Production Cycle.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setProdModalOrders(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* PRODUCTION CYCLE SELECTOR */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 my-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Select Production Cycle:
                  </label>
                  <select
                    value={selectedProdCycleId}
                    onChange={(e) => setSelectedProdCycleId(e.target.value)}
                    className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    {availableCycles.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.steps.map(s => s.name).join(' → ')})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCycleManagerModal(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs transition-all whitespace-nowrap self-end sm:self-auto"
                >
                  + Manage Cycles
                </button>
              </div>

              {/* Cycle Steps Preview */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto text-[10px] text-slate-600 font-medium">
                <span className="text-slate-400 uppercase text-[9px]">Cycle Pipeline:</span>
                {(availableCycles.find(c => c.id === selectedProdCycleId) || availableCycles[0])?.steps.map((s, idx, arr) => (
                  <span key={s.key} className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-indigo-100">
                    <span className="font-bold text-indigo-950">{idx + 1}.</span> {s.name}
                    {idx < arr.length - 1 && <span className="text-slate-300">→</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* ORDERS & MULTI-CARD BREAKDOWN */}
            <div className="overflow-y-auto py-2 space-y-4 flex-1 pr-1">
              {prodModalOrders.map(ord => (
                <div key={ord.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900 font-mono">{ord.id}</span>
                      <span className="text-slate-400 text-xs">&bull;</span>
                      <span className="text-xs text-slate-800 font-semibold">{ord.customerCompany || ord.customerName}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono font-medium px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                      Approved Order
                    </span>
                  </div>

                  {(ord.items || []).map((item, itemIdx) => {
                    const isMulti = !!item.isMultiCard;
                    const cardsList = isMulti && item.cards && item.cards.length > 0 ? item.cards : [
                      {
                        cardIndex: 1,
                        title: item.name || item.itemCode || 'Single Card Tag',
                        catalogCode: item.catalogCode || item.material || 'Paper #01 (Art Card 350 GSM)'
                      }
                    ];

                    return (
                      <div key={itemIdx} className="space-y-3">
                        <div className="flex items-center justify-between text-xs bg-slate-100/70 p-2 rounded-lg">
                          <span className="font-bold text-slate-900">
                            {item.name || item.itemCode}
                            {cardsList.length > 1 && (
                              <span className="ml-2 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                Multi-Paper Tag ({cardsList.length} Job Cards will be generated)
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-slate-700 font-medium">
                            Order Quantity: {Number(item.quantity || 1000).toLocaleString()} pcs
                          </span>
                        </div>

                        {cardsList.map((card, cardIdx) => {
                          const key = `${ord.id}_${itemIdx}_${cardIdx}`;
                          const alloc = prodSheetAllocations[key] || {};
                          const baseQty = Number(alloc.orderQty) || Number(item.quantity) || 1000;
                          const wasteQty = alloc.wastageQty !== undefined ? Number(alloc.wastageQty) : getWastageTags(baseQty);
                          const totalProductionTags = alloc.productionQty || (baseQty + wasteQty);
                          const ups = Number(alloc.ups) || 10;
                          const totalRequiredSheets = Number(alloc.sheets) || Math.ceil(totalProductionTags / ups);
                          const minFloor = Math.ceil(baseQty / ups);

                          return (
                            <div key={cardIdx} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                              {/* Job Card Header */}
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center space-x-2.5">
                                  {alloc.image && (
                                    <img 
                                      src={alloc.image} 
                                      alt="Artwork" 
                                      className="w-9 h-9 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0" 
                                    />
                                  )}
                                  <div>
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono">
                                        {alloc.jobNumber || formatJobCardNumber(ord, itemIdx, cardIdx, cardsList.length)}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded font-semibold">
                                        Order: {alloc.customerOrderId || ord.customerOrderId || ord.id.split('-').pop()}
                                      </span>
                                    </div>
                                    <span className="font-semibold text-xs text-slate-900 block mt-0.5">
                                      {card.title || `Paper Component #${cardIdx + 1}`}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[11px] font-mono text-slate-500">
                                  Order: {baseQty.toLocaleString()} pcs &rarr; Target: {totalProductionTags.toLocaleString()} tags
                                </span>
                              </div>

                              {/* MANDATORY 9 FIELDS FORM GRID */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                  <label className="text-[10px] text-slate-500 block font-medium mb-1">
                                    1. Date
                                  </label>
                                  <input
                                    type="date"
                                    value={alloc.date || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => handleUpdateSheetAlloc(key, 'date', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] text-slate-500 block font-medium mb-1">
                                    2. Job Number (Compact)
                                  </label>
                                  <input
                                    type="text"
                                    value={alloc.jobNumber || formatJobCardNumber(ord, itemIdx, cardIdx, cardsList.length)}
                                    onChange={(e) => handleUpdateSheetAlloc(key, 'jobNumber', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] text-slate-500 block font-medium mb-1">
                                    3. Order Ref / Customer Order
                                  </label>
                                  <input
                                    type="text"
                                    readOnly
                                    value={`${ord.id} (${alloc.customerOrderId || ord.customerOrderId || ord.id.split('-').pop()})`}
                                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-mono font-medium cursor-not-allowed"
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] text-slate-500 block font-medium mb-1">
                                    4. Party Name
                                  </label>
                                  <input
                                    type="text"
                                    value={alloc.partyName || ord.customerCompany || ord.customerName || ''}
                                    onChange={(e) => handleUpdateSheetAlloc(key, 'partyName', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className="text-[10px] text-slate-500 block font-medium mb-1">
                                    5. Paper Name
                                  </label>
                                  <select
                                    value={alloc.paperName || card.catalogCode || 'Paper #01 (Art Card 350 GSM)'}
                                    onChange={(e) => handleUpdateSheetAlloc(key, 'paperName', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  >
                                    {availableCatalogs.map(c => (
                                      <option key={c.id} value={`${c.code} ${c.name}`.trim()}>
                                        {c.code} &bull; {c.name} ({c.gsm} GSM - {c.finish})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[10px] text-slate-500 block font-medium mb-1">
                                    6. Order Quantity (pcs)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={baseQty}
                                    onChange={(e) => handleUpdateSheetAlloc(key, 'orderQty', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                  <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
                                    +{wasteQty.toLocaleString()} tags wastage &rarr; {totalProductionTags.toLocaleString()} tags
                                  </span>
                                </div>

                                <div>
                                  <label className="text-[10px] text-slate-500 block font-medium mb-1">
                                    7. Number of Colors
                                  </label>
                                  <select
                                    value={alloc.numPrintingColors || 4}
                                    onChange={(e) => handleUpdateSheetAlloc(key, 'numPrintingColors', Number(e.target.value))}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  >
                                    <option value="1">1 Color (Single Ink)</option>
                                    <option value="2">2 Colors (Two-tone)</option>
                                    <option value="4">4 Colors (CMYK Full Color)</option>
                                    <option value="5">5 Colors (CMYK + 1 Pantone)</option>
                                    <option value="6">6 Colors (CMYK + 2 Pantones)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[10px] text-slate-500 block font-medium mb-1">
                                    9. Priority
                                  </label>
                                  <select
                                    value={alloc.priority || ord.priority || 'standard'}
                                    onChange={(e) => handleUpdateSheetAlloc(key, 'priority', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  >
                                    <option value="standard">Standard Priority</option>
                                    <option value="high">High Priority</option>
                                    <option value="urgent">Urgent Priority</option>
                                  </select>
                                </div>

                                <div className="sm:col-span-3">
                                  <label className="text-[10px] text-slate-500 block font-medium mb-1">
                                    8. Name of Printing Colors
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g. CMYK (Cyan, Magenta, Yellow, Black) or Front: CMYK, Back: Black"
                                    value={alloc.namePrintingColors || 'CMYK (Full Color)'}
                                    onChange={(e) => handleUpdateSheetAlloc(key, 'namePrintingColors', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </div>
                              </div>

                              {/* Sheet Calculation & Helpers */}
                              <div className="pt-2 border-t border-slate-100">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                                  <div>
                                    <label className="text-[10px] text-slate-500 block font-medium mb-1">
                                      Ups / Tags Per Sheet (helper)
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="200"
                                      value={alloc.ups || 10}
                                      onChange={(e) => handleUpdateSheetAlloc(key, 'ups', e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-700 block font-medium mb-1">
                                      Issued Sheets * (Press &amp; Cutting Target)
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      required
                                      value={alloc.sheets || totalRequiredSheets}
                                      onChange={(e) => handleUpdateSheetAlloc(key, 'sheets', e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </div>
                                </div>

                                {/* Sheet Calculation Live Summary */}
                                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center font-mono text-xs text-slate-800">
                                  <div>
                                    <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Net Order</span>
                                    <span className="font-bold text-slate-900">{baseQty.toLocaleString()}</span>
                                    <span className="text-[9px] text-slate-400 block font-sans">tags</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-emerald-600 uppercase block font-sans font-semibold">Wastage (200/5k)</span>
                                    <span className="font-bold text-emerald-700">+{wasteQty.toLocaleString()}</span>
                                    <span className="text-[9px] text-emerald-600 block font-sans">extra tags</span>
                                  </div>
                                  <div className="border-x border-slate-200">
                                    <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Total Tags</span>
                                    <span className="font-bold text-slate-900">{totalProductionTags.toLocaleString()}</span>
                                    <span className="text-[9px] text-slate-400 block font-sans">to produce</span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-slate-500 uppercase block font-sans font-semibold">Issued Sheets</span>
                                    <span className="font-bold text-slate-900">{totalRequiredSheets.toLocaleString()}</span>
                                    <span className="text-[9px] text-slate-400 block font-sans">@{ups} ups (exact)</span>
                                  </div>
                                </div>
                              </div>

                            </div>
                          );
                        })}

                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 shrink-0">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Wastage Rule:</span> <span className="text-slate-800 font-medium">200 extra tags per 5,000 tags for wastage (5,000 &rarr; 5,200 tags, 10,000 &rarr; 10,400 tags). Exact sheets issued from total tags without adding extra sheets after.</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setProdModalOrders(null)}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs py-2 px-4 rounded-xl border border-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMoveToProduction}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 px-5 rounded-xl transition-colors shadow-xs flex items-center space-x-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Start Production &bull; Create Job Cards</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PRODUCTION CYCLE MANAGER MODAL */}
      {showCycleManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Production Cycle Manager</h3>
                <p className="text-xs text-slate-500">Configure or create new sequential process cycles for production.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCycleManagerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Existing Cycles List */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">Existing Cycles:</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {availableCycles.map(c => (
                  <div key={c.id} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{c.name}</span>
                      {c.isDefault && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {c.steps.map(s => s.name).join(' → ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create New Cycle Form */}
            <form onSubmit={handleSaveNewCycle} className="pt-3 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-900 block">Create New Production Cycle:</span>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Cycle Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Express 3-Step Direct Cycle"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Select Steps in Sequence:
                </label>
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  {[
                    { key: 'cutting', name: '1. Paper Cutting', desc: 'Guillotine sheet cutting & sizing' },
                    { key: 'printing', name: '2. Printing', desc: 'Offset / digital ink application' },
                    { key: 'punching', name: '3. Punching & Packing', desc: 'Die-cutting, creasing & stripping' },
                    { key: 'handwork', name: '4. Handwork Process', desc: 'Dori attachment & plastic seal lock' },
                    { key: 'dispatch', name: '5. Dispatch', desc: 'Quality inspection & dispatch packaging' }
                  ].map(s => {
                    const isChecked = selectedCycleSteps.includes(s.key);
                    return (
                      <label key={s.key} className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCycleSteps(prev => [...prev, s.key]);
                            } else {
                              setSelectedCycleSteps(prev => prev.filter(k => k !== s.key));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-slate-900 block">{s.name}</span>
                          <span className="text-[10px] text-slate-500 block">{s.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCycleManagerModal(false)}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs py-2 px-4 rounded-xl border border-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-5 rounded-xl transition-colors"
                >
                  Save New Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CROP MODAL FOR ADMIN PLACE ORDER ARTWORK */}
      {adminShowCropModal && adminOrderImage && (
        <window.uBMS.ImageCropModal
          imageSrc={adminOrderImage}
          onSave={(croppedUrl) => {
            setAdminOrderImage(croppedUrl);
            setAdminShowCropModal(false);
          }}
          onClose={() => setAdminShowCropModal(false)}
        />
      )}

      {/* CROP MODAL FOR PRODUCTION JOB CARDS */}
      {cropJobTarget && (
        <window.uBMS.ImageCropModal
          imageSrc={cropJobTarget.imageSrc}
          onSave={(croppedUrl) => {
            handleUpdateJobImage(cropJobTarget.jobId, croppedUrl);
            setCropJobTarget(null);
          }}
          onClose={() => setCropJobTarget(null)}
        />
      )}
    </div>
  );
}

window.uBMS.AdminPortal = AdminPortal;
