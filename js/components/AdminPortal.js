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
  onUpdateLabelTypes,
  onUpdateInventory,
  onUpdateCatalogs,
  onUpdateOrder, 
  onSaveOrder, 
  onSaveInvoice, 
  onSavePayment, 
  onUpdateProduction, 
  onUpdatePayroll, 
  onOpenInvoice, 
  defaultTab = 'dashboard' 
}) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  const [viewMode, setViewMode] = React.useState('table'); // 'table' or 'kanban'
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = React.useState([]);
  const [previewArtworkUrl, setPreviewArtworkUrl] = React.useState(null);
  const [bulkTargetStatus, setBulkTargetStatus] = React.useState('approved');
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

  const availableTypes = labelTypes.length > 0 ? labelTypes : [
    { id: 'TYPE-TAG', name: 'Tag', materials: ['100 GSM', '200 GSM', '300 GSM'], defaultRate: 2.50 },
    { id: 'TYPE-PULABEL', name: 'PU Label', materials: ['1.2', '1.8', '2.2'], defaultRate: 14.00 }
  ];

  const availableCatalogs = catalogs.length > 0 ? catalogs : [
    { id: 'CAT-IV350', code: 'Cat #101 - Art Ivory 350', name: 'Art & Ivory Board 350 GSM', gsm: 350, finish: 'Silk Matte Coated', sheetRate: 3.20 },
    { id: 'CAT-KF280', code: 'Cat #102 - Natural Kraft 280', name: 'Virgin Eco Kraft Paper 280 GSM', gsm: 280, finish: 'Raw Fibrous Texture', sheetRate: 2.40 },
    { id: 'CAT-SP300', code: 'Cat #103 - Sappi Black 300', name: 'Sappi Velvet Jet Black 300 GSM', gsm: 300, finish: 'Solid Deep Black Matte', sheetRate: 4.50 },
    { id: 'CAT-TR115', code: 'Cat #104 - Tracing Butter 115', name: 'Translucent Butter Paper 115 GSM', gsm: 115, finish: 'Semi-Transparent Frosted', sheetRate: 1.90 },
    { id: 'CAT-MT400', code: 'Cat #105 - Metallic Pearl 400', name: 'Champagne Shimmer Board 400 GSM', gsm: 400, finish: 'Subtle Pearl Luster', sheetRate: 5.80 },
    { id: 'CAT-DUP250', code: 'Cat #106 - Sturdy Duplex 250', name: 'Greyback Duplex Board 250 GSM', gsm: 250, finish: 'Semi-Gloss Single Sided', sheetRate: 1.60 }
  ];

  // Paper Catalog Management State & Handlers
  const [catalogSubTab, setCatalogSubTab] = React.useState('catalogs'); // 'catalogs' or 'types'
  const [editingCatalog, setEditingCatalog] = React.useState(null);
  const [showCatalogModal, setShowCatalogModal] = React.useState(false);
  const [catCode, setCatCode] = React.useState('');
  const [catName, setCatName] = React.useState('');
  const [catGsm, setCatGsm] = React.useState(350);
  const [catFinish, setCatFinish] = React.useState('Silk Matte Coated');
  const [catRate, setCatRate] = React.useState(3.20);
  const [catRec, setCatRec] = React.useState('');
  const [catStock, setCatStock] = React.useState(10000);

  const handleOpenAddCatalog = () => {
    setEditingCatalog(null);
    setCatCode(`Cat #${100 + availableCatalogs.length + 1} - `);
    setCatName('');
    setCatGsm(350);
    setCatFinish('Silk Matte Coated');
    setCatRate(3.50);
    setCatRec('Hangtags & Luxury Cards');
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
    setCatRec(cat.recommendedFor || '');
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
        recommendedFor: catRec.trim(),
        stockSheets: Number(catStock) || 0
      } : c);
    } else {
      savedCatId = 'CAT-' + (catCode.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || Date.now().toString().slice(-4));
      const newCat = {
        id: savedCatId,
        code: catCode.trim(),
        name: catName.trim(),
        gsm: Number(catGsm) || 300,
        finish: catFinish.trim(),
        sheetRate: Number(catRate) || 1.0,
        recommendedFor: catRec.trim(),
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
  const [prodSheetAllocations, setProdSheetAllocations] = React.useState({}); // key: `${orderId}_${itemIdx}_${cardIdx}` -> { ups, sheets, orderPieces }

  const handleOpenMoveToProduction = (orderOrOrders) => {
    const list = Array.isArray(orderOrOrders) ? orderOrOrders : [orderOrOrders];
    if (list.length === 0) return alert('No orders selected for production.');

    // Initialize allocations
    const initialAlloc = {};
    list.forEach(ord => {
      (ord.items || []).forEach((item, itemIdx) => {
        const pcs = Number(item.quantity) || 1000;
        const defaultUps = 10;
        const defaultSheets = Math.ceil(pcs / defaultUps);

        if (item.isMultiCard && item.cards && item.cards.length > 0) {
          item.cards.forEach((card, cardIdx) => {
            const key = `${ord.id}_${itemIdx}_${cardIdx}`;
            initialAlloc[key] = {
              ups: defaultUps,
              sheets: defaultSheets,
              orderPieces: pcs,
              cardTitle: card.title || `Card #${cardIdx + 1}`,
              catalogCode: card.catalogCode || item.material || 'Standard Catalog'
            };
          });
        } else {
          const key = `${ord.id}_${itemIdx}_0`;
          initialAlloc[key] = {
            ups: defaultUps,
            sheets: defaultSheets,
            orderPieces: pcs,
            cardTitle: item.name || item.itemCode || 'Single Card Tag',
            catalogCode: item.catalogCode || item.material || 'Standard Catalog'
          };
        }
      });
    });

    setProdSheetAllocations(initialAlloc);
    setProdModalOrders(list);
  };

  const handleUpdateSheetAlloc = (key, field, value) => {
    setProdSheetAllocations(prev => {
      const current = prev[key] || { ups: 10, sheets: 100, orderPieces: 1000 };
      if (field === 'ups') {
        const newUps = Math.max(1, Number(value) || 1);
        const newSheets = Math.ceil(current.orderPieces / newUps);
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
      return prev;
    });
  };

  const handleConfirmMoveToProduction = () => {
    if (!prodModalOrders || prodModalOrders.length === 0) return;
    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    let createdJobs = [];

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
            description: `Production job cards created by ${currentMember.name}. Scheduled for printing.`,
            timestamp: formattedDate,
            author: currentMember.name
          }
        ]
      };
      onUpdateOrder(updatedOrder);

      // 2. Generate Production Job Forms
      (order.items || []).forEach((item, itemIdx) => {
        const pcs = Number(item.quantity) || 1000;
        const isMulti = !!item.isMultiCard;
        const cardsList = isMulti && item.cards && item.cards.length > 0 ? item.cards : [
          {
            cardIndex: 1,
            title: item.name || item.itemCode || 'Single Card Tag',
            catalogCode: item.catalogCode || item.material || 'Standard Catalog',
            gsm: 300,
            finish: 'Matte'
          }
        ];

        // Overall sheet calculation
        let mainSheets = 100;
        const enrichedCards = cardsList.map((c, ci) => {
          const alloc = prodSheetAllocations[`${order.id}_${itemIdx}_${ci}`] || { sheets: Math.ceil(pcs / 10), ups: 10 };
          if (alloc.sheets > mainSheets) mainSheets = alloc.sheets;
          return {
            ...c,
            ups: alloc.ups,
            allocatedSheets: alloc.sheets
          };
        });

        // The target sheets entered by user
        const targetSheets = mainSheets;
        const buffer = 40; // 20 sheets printing + 20 sheets punching
        const issued = targetSheets + buffer;
        const floor = Math.max(1, targetSheets - 40);

        createdJobs.push({
          jobId: `JOB-${Date.now().toString().slice(-4)}-${itemIdx + 1}`,
          orderId: order.id,
          customerName: order.customerName,
          customerCompany: order.customerCompany || order.customerName,
          itemName: item.name || item.itemCode || `Item #${itemIdx + 1}`,
          type: item.type || 'Tag',
          isMultiCard: isMulti,
          cards: enrichedCards,
          targetQty: pcs, // Tag pieces ordered by customer
          targetSheets: targetSheets, // Net required paper sheets
          bufferSheets: buffer, // +40 sheets (+20 print, +20 punch)
          issuedSheets: issued, // targetSheets + 40
          minimumAllowedFloor: floor, // tolerance floor
          currentStage: 'printing', // strictly first visible ONLY to printing team!
          priority: order.priority || 'standard',
          printing: {
            status: 'pending',
            operatorName: 'Kanu',
            startTime: null,
            completedTime: null,
            goodSheetsPrinted: null,
            wasteSheets: null
          },
          punching: {
            status: 'locked',
            operatorName: 'Shivakant',
            startTime: null,
            completedTime: null,
            goodSheetsPunched: null,
            wasteSheets: null
          },
          handwork: {
            status: 'locked',
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
          godown: {
            status: 'pending'
          }
        });
      });
    });

    onUpdateProduction([...createdJobs, ...production]);
    setProdModalOrders(null);
    setProdSheetAllocations({});
    setSelectedOrderIds([]);
    setActiveTab('production');
  };

  // --- MODULE 1: PLACE ORDER (ON-BEHALF) STATE ---
  const [adminOrderCustId, setAdminOrderCustId] = React.useState(users.customers[0]?.id || '');
  const selectedCust = users.customers.find(c => c.id === adminOrderCustId) || users.customers[0];

  const [adminBrandName, setAdminBrandName] = React.useState(selectedCust?.company || '');
  const [adminItemCode, setAdminItemCode] = React.useState('');
  const [adminItemCodeManual, setAdminItemCodeManual] = React.useState(false);
  const [adminSelectedType, setAdminSelectedType] = React.useState(availableTypes[0]?.name || 'Tag');
  const adminTypeObj = availableTypes.find(t => t.name === adminSelectedType) || availableTypes[0];
  const [adminSelectedMaterial, setAdminSelectedMaterial] = React.useState(adminTypeObj?.materials[0] || '100 GSM');
  const [adminSelectedCatalogId, setAdminSelectedCatalogId] = React.useState(availableCatalogs[0]?.id || 'CAT-IV350');
  
  // Admin Multi-Card Tag composition
  const [adminIsMultiCard, setAdminIsMultiCard] = React.useState(false);
  const [adminTagCards, setAdminTagCards] = React.useState([
    { id: 1, title: 'Card 1 (Main Brand Card)', catalogId: availableCatalogs[0]?.id || 'CAT-IV350' },
    { id: 2, title: 'Card 2 (Price & Care Tag)', catalogId: availableCatalogs[1]?.id || 'CAT-KF280' }
  ]);

  const [adminQty, setAdminQty] = React.useState(0);
  const [adminRate, setAdminRate] = React.useState(0);
  const [adminOrderImage, setAdminOrderImage] = React.useState('');
  const [adminDoriOption, setAdminDoriOption] = React.useState('reg'); // 'reg' or 'custom'
  const [adminDoriCustom, setAdminDoriCustom] = React.useState('');
  const [adminPlasticOption, setAdminPlasticOption] = React.useState('reg'); // 'reg' or 'custom'
  const [adminPlasticCustom, setAdminPlasticCustom] = React.useState('');

  // Rejection Modal & Shortage Alert States
  const [rejectionModalOrder, setRejectionModalOrder] = React.useState(null);
  const [rejectionReasonChoice, setRejectionReasonChoice] = React.useState('Paper Catalog temporarily out of stock');
  const [rejectionReasonCustom, setRejectionReasonCustom] = React.useState('');
  const [shortageAlertJob, setShortageAlertJob] = React.useState(null);

  const [adminOrderItems, setAdminOrderItems] = React.useState([]);
  const [adminOrderDiscount, setAdminOrderDiscount] = React.useState(0);
  const [adminOrderNotes, setAdminOrderNotes] = React.useState('');

  // Auto-generate item code for Admin if not manually modified
  React.useEffect(() => {
    if (!adminItemCodeManual) {
      const party = selectedCust?.company || selectedCust?.name || adminBrandName;
      const abbr = window.uBMS.generateCustomerAbbr(party);
      const nextCode = window.uBMS.getNextItemCode(abbr, orders, adminOrderItems);
      setAdminItemCode(nextCode);
    }
  }, [adminOrderCustId, adminBrandName, adminOrderItems, orders, adminItemCodeManual]);

  // Update material when type changes in Admin Order
  const handleAdminTypeChange = (newType) => {
    setAdminSelectedType(newType);
    const typeObj = availableTypes.find(t => t.name === newType);
    if (typeObj) {
      setAdminSelectedMaterial(typeObj.materials[0] || '');
    }
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

  // Add Item to Admin Order and CLEAR ALL FIELDS
  const handleAdminAddItem = (e) => {
    e.preventDefault();
    if (!adminBrandName.trim()) return alert('Please enter Brand Name.');
    if (!adminQty || Number(adminQty) <= 0) return alert('Enter valid quantity.');
    if (!adminRate || Number(adminRate) <= 0) return alert('Enter valid rate.');
    if (adminDoriOption === 'custom' && !adminDoriCustom.trim()) return alert('Please enter the custom Dori specification.');
    if (adminPlasticOption === 'custom' && !adminPlasticCustom.trim()) return alert('Please enter the custom Plastic specification.');

    const party = selectedCust?.company || selectedCust?.name || adminBrandName;
    const abbr = window.uBMS.generateCustomerAbbr(party);
    const finalCode = (adminItemCode && adminItemCode.trim())
      ? adminItemCode.trim().toUpperCase()
      : window.uBMS.getNextItemCode(abbr, orders, adminOrderItems);

    const doriValue = adminDoriOption === 'custom' ? `Custom: ${adminDoriCustom.trim()}` : 'Reg. (₹0.20/pc)';
    const plasticValue = adminPlasticOption === 'custom' ? `Custom: ${adminPlasticCustom.trim()}` : 'Reg. (₹0.10/pc)';

    let finalMaterial = adminSelectedMaterial;
    let chosenCards = [];
    let primaryCatalogId = null;
    let primaryCatalogCode = null;

    if (adminSelectedType === 'Tag') {
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
            finish: cat.finish
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
          finish: cat.finish
        }];
        finalMaterial = `${cat.code} (${cat.finish})`;
        primaryCatalogId = cat.id;
        primaryCatalogCode = cat.code;
      }
    }

    const newItem = {
      id: 'ITEM-' + Date.now().toString().slice(-4),
      itemCode: finalCode,
      name: finalCode,
      brandName: adminBrandName.trim(),
      type: adminSelectedType,
      isMultiCard: adminSelectedType === 'Tag' ? adminIsMultiCard : false,
      cards: chosenCards,
      catalogId: primaryCatalogId,
      catalogCode: primaryCatalogCode,
      material: finalMaterial,
      dori: doriValue,
      doriRate: adminDoriOption === 'reg' ? 0.20 : 0.20,
      plastic: plasticValue,
      plasticRate: adminPlasticOption === 'reg' ? 0.10 : 0.10,
      image: adminOrderImage || 'https://placehold.co/120x120/1e293b/ffffff?text=' + encodeURIComponent(adminSelectedType),
      quantity: Number(adminQty),
      unitPrice: Number(adminRate),
      total: Number(adminQty) * Number(adminRate)
    };

    setAdminOrderItems(prev => [...prev, newItem]);

    // CLEAR ALL FIELDS AFTER ADDING AN ITEM
    setAdminBrandName('');
    setAdminOrderImage('');
    setAdminItemCodeManual(false);
    const defaultType = availableTypes[0];
    setAdminSelectedType(defaultType?.name || 'Tag');
    setAdminSelectedMaterial(defaultType?.materials[0] || '100 GSM');
    setAdminSelectedCatalogId(availableCatalogs[0]?.id || 'CAT-IV350');
    setAdminIsMultiCard(false);
    setAdminTagCards([
      { id: 1, title: 'Card 1 (Main Brand Card)', catalogId: availableCatalogs[0]?.id || 'CAT-IV350' },
      { id: 2, title: 'Card 2 (Price & Care Tag)', catalogId: availableCatalogs[1]?.id || 'CAT-KF280' }
    ]);
    setAdminQty(0);
    setAdminRate(0);
    setAdminDoriOption('reg');
    setAdminDoriCustom('');
    setAdminPlasticOption('reg');
    setAdminPlasticCustom('');

    const fileInput = document.getElementById('admin-file-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleAdminRemoveItem = (id) => {
    setAdminOrderItems(prev => prev.filter(i => i.id !== id));
  };

  // Calculations (NO TAXES, Subtotal = Grand Total)
  const adminSubtotal = adminOrderItems.reduce((acc, i) => acc + i.total, 0) - Number(adminOrderDiscount || 0);
  const adminTotal = Math.max(0, adminSubtotal);

  const handleAdminSubmitOrder = (e) => {
    e.preventDefault();
    if (adminOrderItems.length === 0) return alert('Please add at least one tag or label item.');

    const orderId = 'ORD-2026-' + Math.floor(1000 + Math.random() * 9000);
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const newOrder = {
      id: orderId,
      customerId: selectedCust.id,
      customerName: selectedCust.name,
      customerCompany: selectedCust.company || adminBrandName,
      customerEmail: selectedCust.email,
      customerPhone: selectedCust.phone,
      status: 'confirmed',
      paymentStatus: 'pending',
      priority: 'standard',
      createdAt: nowIso,
      expectedDelivery: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      assignedTo: currentMember.name,
      assignedToId: currentMember.id,
      items: adminOrderItems.map(i => ({
        id: i.id,
        itemCode: i.itemCode || i.name,
        name: i.itemCode || i.name,
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
      subtotal: Math.max(0, adminSubtotal),
      tax: 0,
      shipping: 0,
      total: adminTotal,
      tracking: {
        carrier: 'Standard Logistics',
        trackingNumber: 'Processing',
        status: 'Order Booked by ' + currentMember.name,
        lastUpdate: formattedDate
      },
      timeline: [
        {
          stage: 'confirmed',
          title: 'Order Created by Admin Team',
          description: `Booked by ${currentMember.name} for ${selectedCust.company} (${adminOrderItems.length} item(s)).`,
          timestamp: formattedDate,
          author: currentMember.name
        }
      ],
      internalNotes: [
        { id: 'N-INIT', author: currentMember.name, text: 'Direct manufacturing order entered via Admin Portal.', timestamp: formattedDate }
      ],
      customerNotes: adminOrderNotes
    };

    onSaveOrder(newOrder);
    setAdminOrderItems([]);
    setAdminOrderNotes('');
    alert(`Order ${orderId} created successfully!`);
    setActiveTab('all_orders');
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

  // 1. Printing Handlers
  const handleStartPrinting = (job) => {
    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      printing: {
        ...(j.printing || {}),
        status: 'in_progress',
        operatorName: currentMember.name,
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

    const rawWaste = getSheetInput(job.jobId, 'waste');
    const wasteCount = Number(rawWaste) || Math.max(0, (job.issuedSheets || 1040) - printedCount);

    // Spoilage / Threshold Check (e.g. < 960 for 1000 order)
    const floor = job.minimumAllowedFloor || 960;
    if (printedCount < floor) {
      setShortageAlertJob({
        job,
        printedSheets: printedCount,
        wasteSheets: wasteCount
      });
      return;
    }

    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      currentStage: 'punching', // forwards form to Punching & Packing team!
      printing: {
        ...(j.printing || {}),
        status: 'completed',
        completedTime: new Date().toISOString(),
        goodSheetsPrinted: printedCount,
        wasteSheets: wasteCount
      },
      punching: {
        ...(j.punching || {}),
        status: 'pending' // now visible & ready for punching team!
      }
    } : j);
    onUpdateProduction(updated);

    // Auto-deplete paper sheets from inventory
    if (onUpdateInventory && inventory && inventory.length > 0) {
      const sheetsToDeduct = (printedCount + wasteCount) || job.issuedSheets || 1040;
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
      const updated = production.map(j => j.jobId === job.jobId ? {
        ...j,
        currentStage: 'punching',
        printing: {
          ...(j.printing || {}),
          status: 'completed',
          completedTime: new Date().toISOString(),
          goodSheetsPrinted: printedSheets,
          wasteSheets: wasteSheets,
          shortageApproved: true
        },
        punching: {
          ...(j.punching || {}),
          status: 'pending'
        }
      } : j);
      onUpdateProduction(updated);

      // Auto-deplete paper sheets from inventory
      if (onUpdateInventory && inventory && inventory.length > 0) {
        const sheetsToDeduct = (printedSheets + wasteSheets) || job.issuedSheets || 1040;
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
      alert(`Reprint ticket created for missing ${((job.minimumAllowedFloor || 960) - printedSheets)} sheets.`);
      setShortageAlertJob(null);
    }
  };

  // 2. Punching & Packing Handlers
  const handleStartPunching = (job) => {
    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      punching: {
        ...(j.punching || {}),
        status: 'in_progress',
        operatorName: currentMember.name,
        startTime: new Date().toISOString()
      }
    } : j);
    onUpdateProduction(updated);
  };

  const handleCompletePunching = (job) => {
    const rawPunched = getSheetInput(job.jobId, 'punched');
    const punchedCount = Number(rawPunched);
    if (!rawPunched || isNaN(punchedCount) || punchedCount <= 0) {
      return alert('Mandatory: Please write down the number of sheets punched before proceeding.');
    }

    const rawWaste = getSheetInput(job.jobId, 'punchWaste');
    const wasteCount = Number(rawWaste) || 0;

    const updated = production.map(j => j.jobId === job.jobId ? {
      ...j,
      currentStage: 'handwork', // moves to Handwork process (dori & plastic)!
      punching: {
        ...(j.punching || {}),
        status: 'completed',
        completedTime: new Date().toISOString(),
        goodSheetsPunched: punchedCount,
        wasteSheets: wasteCount
      },
      handwork: {
        ...(j.handwork || {}),
        status: 'pending'
      }
    } : j);
    onUpdateProduction(updated);
  };

  // 3. Handwork (Dori & Plastic) Handlers
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
    const rawPieces = getSheetInput(job.jobId, 'handworkPieces', job.punching?.goodSheetsPunched || job.targetQty || 1000);
    const pieces = Number(rawPieces) || 1000;
    const rate = Number(job.handwork?.totalRatePerTag) || 0.30;
    const earnedPayout = pieces * rate;

    // 1. Update Job Stage to Godown
    const updatedProd = production.map(j => j.jobId === job.jobId ? {
      ...j,
      currentStage: 'godown',
      handwork: {
        ...(j.handwork || {}),
        status: 'completed',
        completedTime: new Date().toISOString(),
        completedPieces: pieces,
        earnedPayout: earnedPayout
      },
      godown: {
        status: 'ready_dispatch',
        receivedTime: new Date().toISOString(),
        verifiedCount: pieces,
        location: 'Bay 01 - Finished Goods'
      }
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
            description: `${pieces} tags completed by ${job.handwork?.assignedLabourerName || 'Artisan'}. Moved to godown ready for dispatch.`,
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

  // 4. Godown Dispatch Handler
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
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map(o => o.id));
    }
  };

  const handleApproveOrder = (order) => {
    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const updated = {
      ...order,
      status: 'approved',
      timeline: [
        ...(order.timeline || []),
        {
          stage: 'approved',
          title: 'Order Approved by Admin',
          description: `Approved by ${currentMember.name}. Ready for production scheduling.`,
          timestamp: formattedDate,
          author: currentMember.name
        }
      ]
    };
    onUpdateOrder(updated);
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

  // 11 Admin Navigation Tabs
  const adminTabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'place_order', label: 'Place Order' },
    { key: 'all_orders', label: 'All Orders' },
    { key: 'production', label: 'Production Flow' },
    { key: 'inventory', label: 'Raw Materials & Stock' },
    { key: 'payroll', label: 'Attendance & Payroll' },
    { key: 'create_invoice', label: 'Create Invoice' },
    { key: 'all_invoices', label: 'All Invoices' },
    { key: 'ledgers', label: 'Ledgers Hub' },
    { key: 'payments', label: 'Payment Entries' },
    { key: 'label_config', label: 'Paper Catalogs & Types' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Minimized Compact Bar (when not on dashboard or manually minimized) */}
      {bannerMinimized ? (
        <div className="bg-white/95 rounded-2xl px-4 py-2.5 text-slate-800 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3 animate-fade-in sticky top-16 z-30 backdrop-blur-md">
          {/* Navigation Tabs (Sleek row) */}
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 scrollbar-none flex-1 min-w-[280px]">
            {adminTabs.map(tab => (
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

          {/* Modular Navigation Bar */}
          <div className="flex items-center space-x-1.5 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
            {adminTabs.map(tab => (
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
      )}

      {/* MODULE 0: ADMIN EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* 4 Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Orders */}
            <div 
              onClick={() => setActiveTab('all_orders')}
              className="bg-white border border-slate-200/90 hover:border-slate-400 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {adminStats.totalOrdersCount}
              </div>
              <div className="text-xs mt-1 flex items-center space-x-1 font-medium text-slate-500">
                {adminStats.pendingCount > 0 ? (
                  <span className="text-amber-700 font-semibold">{adminStats.pendingCount} Pending Approval</span>
                ) : (
                  <span className="text-slate-600 font-medium">All Orders Approved</span>
                )}
                <span>&bull;</span>
                <span>{adminStats.deliveredOrdersCount} Delivered</span>
              </div>
            </div>

            {/* 2. Total Invoiced Volume */}
            <div 
              onClick={() => setActiveTab('all_invoices')}
              className="bg-white border border-slate-200/90 hover:border-slate-400 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Invoiced</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {formatCurrency(adminStats.totalInvoiced)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Gross billed across {invoices.length} invoice(s)
              </div>
            </div>

            {/* 3. Total Collections / Cash Inflow */}
            <div 
              onClick={() => setActiveTab('payments')}
              className="bg-white border border-slate-200/90 hover:border-slate-400 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payments Collected</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {formatCurrency(adminStats.totalCollected)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Revenue from {payments.length} payment voucher(s)
              </div>
            </div>

            {/* 4. Total Accounts Receivable / Outstanding */}
            <div 
              onClick={() => setActiveTab('ledgers')}
              className="bg-white border border-slate-200/90 hover:border-slate-400 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Receivables</div>
              <div className={`text-2xl sm:text-3xl font-extrabold mt-2 font-mono ${
                adminStats.totalOutstanding > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}>
                {formatCurrency(adminStats.totalOutstanding)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Across {adminStats.totalClientsCount} registered client(s)
              </div>
            </div>
          </div>

          {/* Attention Required: Orders Awaiting Admin Approval */}
          {adminStats.pendingCount > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-4 text-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-amber-200/70">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Action Required: {adminStats.pendingCount} Order(s) Awaiting Approval
                  </h3>
                  <p className="text-xs text-slate-600">Review client specifications, artwork, and confirm or reject.</p>
                </div>
                <button
                  onClick={() => setActiveTab('all_orders')}
                  className="text-xs text-slate-800 hover:text-black font-semibold bg-white border border-amber-200 px-3 py-1.5 rounded-lg transition-all shadow-2xs"
                >
                  Manage in Order Register &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {adminStats.pendingOrders.slice(0, 3).map(po => {
                  const firstItem = po.items[0] || {};
                  return (
                    <div key={po.id} className="bg-white border border-amber-200/80 rounded-xl p-4 space-y-3 shadow-2xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-bold text-slate-900 text-xs">{po.id}</span>
                          <h4 className="font-bold text-slate-900 text-sm mt-0.5">{po.customerCompany}</h4>
                          <p className="text-[11px] text-slate-500">{po.customerName}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-900">{formatCurrency(po.total)}</span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1 text-slate-600 border border-slate-100">
                        <div><strong>Item:</strong> {firstItem.itemCode || firstItem.name || 'Custom'} &bull; {firstItem.type || 'Tag'}</div>
                        <div><strong>Qty:</strong> {Number(firstItem.quantity || 0).toLocaleString()} pcs &bull; <strong>Rate:</strong> {formatCurrency(firstItem.unitPrice || 0)}</div>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => handleApproveOrder(po)}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-1.5 rounded-lg transition-all"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectOrder(po)}
                          className="flex-1 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-slate-200 font-medium text-xs py-1.5 rounded-lg transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Operational Pipeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Live Manufacturing &amp; Fulfillment Flow
                </h3>
                <p className="text-xs text-slate-500">Order distribution across factory production workstations.</p>
              </div>
              <span className="text-xs text-slate-600 font-mono font-semibold bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                {orders.length} Active System Orders
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3">
              {[
                { step: '01', key: 'pending', label: 'Pending Approval', count: adminStats.pendingCount },
                { step: '02', key: 'approved', label: 'Approved & Scheduled', count: adminStats.approvedOrdersCount },
                { step: '03', key: 'in_production', label: 'In Production', count: adminStats.inProdOrdersCount },
                { step: '04', key: 'ready_dispatch', label: 'QC / Packaging', count: adminStats.readyOrdersCount },
                { step: '05', key: 'shipped', label: 'In Transit', count: adminStats.shippedOrdersCount },
                { step: '06', key: 'delivered', label: 'Delivered', count: adminStats.deliveredOrdersCount }
              ].map(stg => (
                <div
                  key={stg.key}
                  onClick={() => setActiveTab('all_orders')}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-400 rounded-xl p-3 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{stg.step}</span>
                    <span className="text-base font-bold text-slate-900 font-mono">{stg.count}</span>
                  </div>
                  <div className="text-xs text-slate-700 font-medium mt-1 leading-snug">{stg.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Grid: Recent Orders (Left 2 cols) & Quick Operations Center (Right 1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Recent Manufacturing Orders */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-slate-800 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Recent Orders Across All Clients
                  </h3>
                  <p className="text-xs text-slate-500">Real-time incoming client orders feed.</p>
                </div>
                <button
                  onClick={() => setActiveTab('all_orders')}
                  className="text-xs text-slate-700 hover:text-slate-900 font-semibold hover:underline flex items-center space-x-1"
                >
                  <span>View Full Register ({orders.length})</span>
                  <span>&rarr;</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-3 px-3">Order ID</th>
                      <th className="py-3 px-3">Client</th>
                      <th className="py-3 px-3">Artwork</th>
                      <th className="py-3 px-3">Item / Brand</th>
                      <th className="py-3 px-3">Qty</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Amt</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.slice(0, 5).map(o => {
                      const firstItem = o.items[0] || {};
                      const isApproved = o.status === 'approved';

                      return (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {o.id}
                            <div className="text-[10px] text-slate-400 font-normal">{formatDate(o.createdAt)}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 text-xs">{o.customerCompany}</div>
                            <div className="text-[10px] text-slate-500">{o.customerName}</div>
                          </td>
                          <td className="py-3 px-3">
                            {firstItem.image ? (
                              <img 
                                src={firstItem.image} 
                                alt="Artwork" 
                                onClick={() => setPreviewArtworkUrl(firstItem.image)}
                                className="w-10 h-10 object-contain rounded-xl border border-slate-200 cursor-pointer hover:scale-105 transition-transform bg-white shadow-2xs" 
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                ART
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 text-xs">{firstItem.brandName || o.customerCompany}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{firstItem.itemCode || firstItem.type}</div>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-800">
                            {Number(firstItem.quantity || 0).toLocaleString()} pcs
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase inline-flex items-center space-x-1 ${
                              o.status === 'approved' || o.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              o.status === 'rejected' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                              o.status === 'in_production' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                              o.status === 'ready_dispatch' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                              o.status === 'shipped' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
                              o.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              <span>{o.status === 'pending' || o.status === 'placed' ? 'Pending' : o.status.replace(/_/g, ' ')}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(o.total)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {!isApproved ? (
                              <button
                                onClick={() => handleApproveOrder(o)}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-lg text-[11px] font-medium shadow-xs transition-all"
                              >
                                Approve
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const linkedOrder = orders.find(ord => ord.id === o.id) || o;
                                  onOpenInvoice(linkedOrder);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] border border-slate-200 transition-colors font-medium"
                              >
                                Invoice
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Col: Operations Console Quick Launch Hub */}
            <div className="space-y-6">
              
              {/* Operations Launchpad */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-800 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">
                  Operations Launchpad
                </h3>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => setActiveTab('place_order')}
                    className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl text-left transition-all group"
                  >
                    <div className="font-semibold text-xs">+ Book Order</div>
                    <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">On-behalf client entry</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('all_orders')}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-800 p-3 rounded-xl text-left border border-slate-200 transition-all group"
                  >
                    <div className="font-semibold text-xs text-slate-900">Order Register</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Inspect, approve, move</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('create_invoice')}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-800 p-3 rounded-xl text-left border border-slate-200 transition-all group"
                  >
                    <div className="font-semibold text-xs text-slate-900">New Invoice</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Bill completed orders</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('payments')}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-800 p-3 rounded-xl text-left border border-slate-200 transition-all group"
                  >
                    <div className="font-semibold text-xs text-slate-900">Record Payment</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Post NEFT / Cash voucher</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('production')}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-800 p-3 rounded-xl text-left border border-slate-200 transition-all group"
                  >
                    <div className="font-semibold text-xs text-slate-900">Production Floor</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Machine cards &amp; flow</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('payroll')}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-800 p-3 rounded-xl text-left border border-slate-200 transition-all group"
                  >
                    <div className="font-semibold text-xs text-slate-900">Payroll &amp; Staff</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Attendance &amp; wages</div>
                  </button>
                </div>
              </div>

              {/* Factory Status Summary */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-800 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                    MFG
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Facility Status</div>
                    <div className="font-bold text-slate-900 text-sm">Industrial Apparel Park Hub</div>
                    <div className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Weaving &amp; Die Press Active</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Active Workers</span>
                    <span className="text-base font-bold text-slate-900 font-mono">{adminStats.activeStaffCount} on Shift</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Client Accounts</span>
                    <span className="text-base font-bold text-slate-900 font-mono">{adminStats.totalClientsCount} Registered</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODULE 1: PLACE ORDER (TAGS & LABELS SPECIFICATION) */}
      {activeTab === 'place_order' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-fade-in">
          
          <div className="xl:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Book Manufacturing Order (Tags &amp; Labels)</h3>
                <p className="text-xs text-slate-500">Precision manufacturing order entry with dynamic materials, custom trims &amp; artwork.</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                Admin Entry Console
              </span>
            </div>

            {/* Line Item Creation Form */}
            <form onSubmit={handleAdminAddItem} className="space-y-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
              
              {/* TIER 1: CORE IDENTIFIERS (5-COLUMNS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Customer Account Party *</label>
                  <select
                    value={adminOrderCustId}
                    onChange={(e) => {
                      setAdminOrderCustId(e.target.value);
                      const cust = users.customers.find(c => c.id === e.target.value);
                      if (cust) setAdminBrandName(cust.company || cust.name);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500 shadow-2xs"
                  >
                    {users.customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urban Stitch / Denim Club"
                    value={adminBrandName}
                    onChange={(e) => setAdminBrandName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500 shadow-2xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Item Code *</label>
                    <span className="text-[10px] text-slate-500 font-mono">Auto / Admin Edit</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MGC01"
                    value={adminItemCode}
                    onChange={(e) => {
                      setAdminItemCode(e.target.value.toUpperCase());
                      setAdminItemCodeManual(true);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500 shadow-2xs uppercase tracking-wider"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Type *</label>
                  <select
                    value={adminSelectedType}
                    onChange={(e) => handleAdminTypeChange(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500 shadow-2xs"
                  >
                    {availableTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    {adminSelectedType === 'Tag' ? 'Paper Catalog *' : 'Material *'}{' '}
                    <span className="text-slate-400 font-normal">({adminSelectedType})</span>
                  </label>
                  {adminSelectedType === 'Tag' ? (
                    <select
                      value={adminSelectedCatalogId}
                      onChange={(e) => setAdminSelectedCatalogId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500 shadow-2xs font-medium"
                    >
                      {availableCatalogs.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.code} ({cat.gsm} GSM - {cat.finish})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={adminSelectedMaterial}
                      onChange={(e) => setAdminSelectedMaterial(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500 shadow-2xs"
                    >
                      {(adminTypeObj?.materials || []).map((m, idx) => (
                        <option key={idx} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* SPECIALIZED TAG COMPOSITION: SINGLE vs MULTI-CARD TAG FOR ADMIN */}
              {adminSelectedType === 'Tag' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-slate-900">
                        Tag Composition &amp; Paper Cards
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Does this tag have a single paper card or multiple cards bound together with Dori &amp; Plastic?
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setAdminIsMultiCard(false)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                          !adminIsMultiCard ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Single Card Tag
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminIsMultiCard(true)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                          adminIsMultiCard ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Multi-Card Tag Set ({adminTagCards.length} Cards)
                      </button>
                    </div>
                  </div>

                  {adminIsMultiCard && (
                    <div className="mt-3 space-y-2.5 pt-3 border-t border-slate-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {adminTagCards.map((card, idx) => (
                          <div key={card.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-800">
                                Card #{idx + 1}: {card.title}
                              </span>
                              {idx === 2 && (
                                <button
                                  type="button"
                                  onClick={() => setAdminTagCards(prev => prev.slice(0, 2))}
                                  className="text-rose-600 hover:text-rose-700 text-xs font-semibold"
                                  title="Remove 3rd Card"
                                >
                                  &times; Remove
                                </button>
                              )}
                            </div>
                            <label className="text-[10px] text-slate-500 block font-semibold">Select Paper Catalog:</label>
                            <select
                              value={card.catalogId}
                              onChange={(e) => {
                                const newCatId = e.target.value;
                                setAdminTagCards(prev => prev.map((c, i) => i === idx ? { ...c, catalogId: newCatId } : c));
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500"
                            >
                              {availableCatalogs.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.code} - {cat.gsm} GSM ({cat.finish})
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>

                      {adminTagCards.length < 3 && (
                        <button
                          type="button"
                          onClick={() => setAdminTagCards(prev => [
                            ...prev,
                            { id: 3, title: 'Card 3 (Story / Overlay Card)', catalogId: availableCatalogs[3]?.id || 'CAT-TR115' }
                          ])}
                          className="text-xs text-slate-700 hover:text-slate-900 font-semibold flex items-center space-x-1 mt-2"
                        >
                          <span>+ Add 3rd Card (e.g. Tracing Butter Paper Overlay)</span>
                        </button>
                      )}
                      
                      <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                        Each card will receive its own printing &amp; punching job form, and will merge at the Handwork (Dori &amp; Plastic) stage.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TIER 2: ACCESSORIES & ARTWORK (3-COLUMNS) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* DORI FIELD */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Dori</label>
                    <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                      <button
                        type="button"
                        onClick={() => { setAdminDoriOption('reg'); setAdminDoriCustom(''); }}
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          adminDoriOption === 'reg' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Reg.
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminDoriOption('custom')}
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          adminDoriOption === 'custom' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {adminDoriOption === 'custom' ? (
                    <input
                      type="text"
                      required
                      placeholder="Specify custom dori (e.g. Waxed Cotton Black 7-in)"
                      value={adminDoriCustom}
                      onChange={(e) => setAdminDoriCustom(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500"
                    />
                  ) : (
                    <div className="text-xs text-slate-500 py-1.5 px-2 bg-slate-50 rounded-xl border border-slate-200">
                      Standard / Regular Dori assigned
                    </div>
                  )}
                </div>

                {/* PLASTIC FIELD */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Plastic Lock</label>
                    <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                      <button
                        type="button"
                        onClick={() => { setAdminPlasticOption('reg'); setAdminPlasticCustom(''); }}
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          adminPlasticOption === 'reg' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Reg.
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminPlasticOption('custom')}
                        className={`px-3 py-1 rounded-md font-medium transition-all ${
                          adminPlasticOption === 'custom' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {adminPlasticOption === 'custom' ? (
                    <input
                      type="text"
                      required
                      placeholder="Specify custom plastic (e.g. Matte Embossed Square)"
                      value={adminPlasticCustom}
                      onChange={(e) => setAdminPlasticCustom(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500"
                    />
                  ) : (
                    <div className="text-xs text-slate-500 py-1.5 px-2 bg-slate-50 rounded-xl border border-slate-200">
                      Standard / Regular Plastic lock assigned
                    </div>
                  )}
                </div>

                {/* ARTWORK UPLOAD & PREVIEW */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Order Image / Artwork</label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="admin-file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAdminImageUpload}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                    />
                    {adminOrderImage && (
                      <div className="flex items-center space-x-2 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200 flex-shrink-0">
                        <img src={adminOrderImage} alt="Preview" className="w-7 h-7 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => {
                            setAdminOrderImage('');
                            const el = document.getElementById('admin-file-upload');
                            if (el) el.value = '';
                          }}
                          className="text-rose-600 hover:text-rose-700 text-xs font-bold"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TIER 3: COMMERCIALS & ACTION (4-COLUMNS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-2 border-t border-slate-200">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Quantity (Pcs) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={adminQty}
                    onFocus={() => { if (Number(adminQty) === 0) setAdminQty(''); }}
                    onBlur={() => { if (adminQty === '' || isNaN(adminQty)) setAdminQty(0); }}
                    onChange={(e) => setAdminQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Rate per Pc (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={adminRate}
                    onFocus={() => { if (Number(adminRate) === 0) setAdminRate(''); }}
                    onBlur={() => { if (adminRate === '' || isNaN(adminRate)) setAdminRate(0); }}
                    onChange={(e) => setAdminRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500 shadow-2xs"
                  />
                </div>

                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Item Subtotal</span>
                  <span className="text-slate-900 font-extrabold text-sm font-mono">{formatCurrency(adminQty * adminRate)}</span>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5"
                  >
                    <span>+ Add Line Item</span>
                  </button>
                </div>
              </div>

            </form>

            {/* Configured Line Items Table */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Order Line Items ({adminOrderItems.length})
              </h4>

              {adminOrderItems.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                  No items added yet. Configure fields above and click &quot;+ Add Line Item&quot;.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="py-3 px-4">Item &amp; Artwork</th>
                        <th className="py-3 px-4">Brand</th>
                        <th className="py-3 px-4">Type &amp; Material</th>
                        <th className="py-3 px-4">Dori</th>
                        <th className="py-3 px-4">Plastic Lock</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Rate</th>
                        <th className="py-3 px-4 text-right">Total</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {adminOrderItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              {item.image ? (
                                <img src={item.image} alt={item.type} className="w-9 h-9 object-contain rounded-lg border border-slate-200 bg-white" />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">ART</div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded inline-block w-fit">
                                  {item.itemCode || item.name}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 mt-0.5">#{idx + 1}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">{item.brandName}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 mr-1.5 font-medium">{item.type}</span>
                            <span className="text-slate-800 font-medium">{item.material}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{item.dori}</td>
                          <td className="py-3 px-4 text-slate-600">{item.plastic}</td>
                          <td className="py-3 px-4 text-center font-mono font-medium">{item.quantity.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(item.total)}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleAdminRemoveItem(item.id)}
                              className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold transition-colors inline-flex items-center justify-center"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Admin Order Finalization */}
          <div className="xl:col-span-1 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800 space-y-4 self-start sticky top-24">
            <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100 flex justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-slate-600 font-mono font-semibold">{selectedCust?.company}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-600 block font-bold mb-1">Special Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={adminOrderDiscount}
                  onChange={(e) => setAdminOrderDiscount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-600 block font-bold mb-1">Internal / Production Note</label>
                <input
                  type="text"
                  placeholder="e.g. Color matching approved offline"
                  value={adminOrderNotes}
                  onChange={(e) => setAdminOrderNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(Math.max(0, adminSubtotal))}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span className="font-mono font-extrabold">{formatCurrency(adminTotal)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAdminSubmitOrder}
                disabled={adminOrderItems.length === 0}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium text-xs py-2.5 rounded-xl transition-all shadow-xs mt-2"
              >
                Confirm &amp; Create Order
              </button>
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
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  catalogSubTab === 'catalogs'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Paper Catalogs Master ({availableCatalogs.length})
              </button>
              <button
                type="button"
                onClick={() => setCatalogSubTab('types')}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  catalogSubTab === 'types'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Product Types &amp; Materials ({availableTypes.length})
              </button>
            </div>

            {catalogSubTab === 'catalogs' && (
              <button
                type="button"
                onClick={handleOpenAddCatalog}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-3.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all self-start sm:self-auto"
              >
                <span>+ Add New Paper Catalog</span>
              </button>
            )}
          </div>

          {/* SUB-TAB 1: PAPER CATALOGS MASTER */}
          {catalogSubTab === 'catalogs' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
                <div className="pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Paper Catalogs &amp; Swatches Master
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Physical paper swatch books provided to customers for hangtag selection. Sheet rates and opening stocks automatically feed into the production order forms and inventory.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-700 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                    {availableCatalogs.length} Active Swatches
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableCatalogs.map(cat => (
                    <div 
                      key={cat.id} 
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-400 transition-all group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md inline-block">
                              {cat.code}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-1.5">{cat.name}</h4>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-white text-slate-900 font-mono font-bold text-xs border border-slate-200 shrink-0">
                            ₹{Number(cat.sheetRate || 0).toFixed(2)} / sheet
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          <span className="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-mono">
                            {cat.gsm} GSM
                          </span>
                          <span className="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[10px]">
                            {cat.finish}
                          </span>
                          {cat.stockSheets !== undefined && (
                            <span className="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-mono">
                              Stock: {Number(cat.stockSheets).toLocaleString()} shts
                            </span>
                          )}
                        </div>

                        {cat.recommendedFor && (
                          <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic">
                            &ldquo;{cat.recommendedFor}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCatalog(cat)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium transition-all"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCatalog(cat.id)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 text-[11px] font-medium transition-all"
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
                  <span>Bulk Move to Production</span>
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
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-600 font-mono font-semibold mr-2">{orders.length} Total Orders</span>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
                >
                  Table View
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${viewMode === 'kanban' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
                >
                  Kanban View
                </button>
              </div>
            </div>

            {viewMode === 'table' ? (
              <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-3 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 cursor-pointer"
                          title="Select / Deselect All Orders"
                        />
                      </th>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Artwork</th>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Brand &amp; Item Specs</th>
                      <th className="py-3 px-4">Dori &amp; Plastic</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Total Amt</th>
                      <th className="py-3 px-4 text-center">Approve / Reject</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {orders.map(o => {
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

                          {/* 1. ORDER ID */}
                          <td className="py-4 px-4">
                            <div className="font-mono font-bold text-slate-900 text-sm">{o.id}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{formatDate(o.createdAt)}</div>
                          </td>

                          {/* 2. ARTWORK (LARGER SIZE WITH CLICK TO ENLARGE LIGHTBOX) */}
                          <td className="py-4 px-4">
                            {firstItem.image ? (
                              <div 
                                onClick={() => setPreviewArtworkUrl(firstItem.image)}
                                className="relative group cursor-pointer inline-block"
                                title="Click to inspect enlarged artwork"
                              >
                                <img 
                                  src={firstItem.image} 
                                  alt="Artwork" 
                                  className="w-20 h-20 object-contain rounded-xl border border-slate-200 bg-white shadow-2xs group-hover:border-slate-400 group-hover:scale-105 transition-all" 
                                />
                                <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                                  Zoom
                                </div>
                              </div>
                            ) : (
                              <div className="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                ART
                              </div>
                            )}
                          </td>

                          {/* 3. CUSTOMER NAME */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900 text-sm">{o.customerCompany}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{o.customerName}</div>
                            {o.customerPhone && (
                              <div className="text-[10px] text-slate-400 font-mono">{o.customerPhone}</div>
                            )}
                          </td>

                          {/* 4. BRAND AND ITEM SPECS */}
                          <td className="py-4 px-4">
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
                            <div className="text-xs text-slate-500 mt-1 font-mono">
                              Qty: <strong className="text-slate-900">{Number(firstItem.quantity || 0).toLocaleString()} pcs</strong> &bull; Rate: <strong className="text-slate-700">{formatCurrency(firstItem.unitPrice || 0)}</strong>
                            </div>
                            {o.items.length > 1 && (
                              <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                                + {o.items.length - 1} more item(s)
                              </span>
                            )}
                          </td>

                          {/* 5. DORI AND PLASTIC */}
                          <td className="py-4 px-4 text-xs space-y-1">
                            <div className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                              Dori: <strong>{firstItem.dori || 'Reg.'}</strong>
                            </div>
                            <div className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                              Plastic: <strong>{firstItem.plastic || 'Reg.'}</strong>
                            </div>
                          </td>

                          {/* 6. STATUS */}
                          <td className="py-4 px-4 space-y-1.5">
                            <div>
                              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center space-x-1 ${
                                o.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                o.status === 'rejected' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                                o.status === 'in_production' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                                o.status === 'delivered' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                                o.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                <span>{STAGES.find(s => s.key === o.status)?.label || o.status}</span>
                              </span>
                            </div>

                            {/* Quick single-row stage selector */}
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
                              className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-[11px] text-slate-900 focus:outline-none focus:border-slate-500 w-full"
                            >
                              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                          </td>

                          {/* 7. TOTAL AMT */}
                          <td className="py-4 px-4 text-right font-bold text-slate-900 font-mono text-sm whitespace-nowrap">
                            {formatCurrency(o.total)}
                          </td>

                          {/* 8. APPROVE / REJECT */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="flex flex-wrap items-center justify-center gap-1.5">
                                {o.status === 'in_production' ? (
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('production')}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                                    title="View this job in production flow"
                                  >
                                    <span>In Production &rarr;</span>
                                  </button>
                                ) : isApproved ? (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveToProduction(o)}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                                    title="Create Production Job Form &amp; dispatch to Printing team"
                                  >
                                    <span>Send to Production</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveOrder(o)}
                                    disabled={isApproved || isRejected}
                                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                                    title="Approve this manufacturing order"
                                  >
                                    <span>Approve</span>
                                  </button>
                                )}

                                {!isApproved && o.status !== 'in_production' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRejectModal(o)}
                                    disabled={isRejected}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                      isRejected 
                                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                                        : 'bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 shadow-xs'
                                    }`}
                                    title={isRejected ? 'Order already rejected' : 'Reject this order with structured reason'}
                                  >
                                    <span>Reject</span>
                                  </button>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => onOpenInvoice(o)}
                                className="text-[11px] text-slate-500 hover:text-slate-900 hover:underline mt-0.5"
                              >
                                View Invoice
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                {['pending', 'approved', 'in_production', 'delivered'].map(stg => (
                  <div key={stg} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
                      <span>{stg.replace('_', ' ')}</span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200 font-mono">
                        {orders.filter(o => o.status === stg).length}
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {orders.filter(o => o.status === stg).map(o => (
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
                                  title="Allocate sheets &amp; send to production"
                                >
                                  Produce
                                </button>
                              )}
                              {o.status !== 'approved' && o.status !== 'in_production' && (
                                <button onClick={() => handleApproveOrder(o)} className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-medium">Approve</button>
                              )}
                              {o.status !== 'rejected' && o.status !== 'in_production' && (
                                <button onClick={() => handleRejectOrder(o)} className="text-[10px] bg-white text-rose-700 border border-slate-200 px-2 py-0.5 rounded font-medium">Reject</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    Live Pipeline
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Sequential flow: <strong>1. Printing Press</strong> &rarr; <strong>2. Punching &amp; Packing</strong> &rarr; <strong>3. Handwork (Dori &amp; Plastic)</strong> &rarr; <strong>4. Godown Dispatch</strong>.
                </p>
              </div>

              {/* Persona / Role Badge */}
              <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500">Current Operator:</span>
                <span className="font-semibold text-xs text-slate-900">
                  {currentMember.name}
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {currentMember.role}
                </span>
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
                onClick={() => setProductionFilterStage('printing')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  productionFilterStage === 'printing' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>1. Printing Unit</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-mono">
                  {production.filter(j => (j.currentStage || 'printing') === 'printing').length}
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
                <span>2. Punching &amp; Packing</span>
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
                <span>3. Handwork (Dori &amp; Plastic)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-mono">
                  {production.filter(j => j.currentStage === 'handwork').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProductionFilterStage('godown')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                  productionFilterStage === 'godown' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>4. Godown / Ready for Dispatch</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 text-[10px] font-mono">
                  {production.filter(j => j.currentStage === 'godown' || j.stage === 'packaged').length}
                </span>
              </button>
            </div>
          </div>

          {/* Sequential Job Cards Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {production
              .filter(job => {
                const stage = job.currentStage || (job.stage === 'packaged' ? 'godown' : job.stage === 'quality_checked' ? 'handwork' : 'printing');
                if (currentMember.role === 'printing') return stage === 'printing';
                if (currentMember.role === 'punching') return stage === 'punching';
                if (currentMember.role === 'labourer') {
                  return stage === 'handwork' && (!job.handwork?.assignedLabourerId || job.handwork?.assignedLabourerId === currentMember.id);
                }
                if (productionFilterStage !== 'all') return stage === productionFilterStage;
                return true;
              })
              .map(job => {
                const stage = job.currentStage || (job.stage === 'packaged' ? 'godown' : job.stage === 'quality_checked' ? 'handwork' : 'printing');
                const isPrinting = stage === 'printing';
                const isPunching = stage === 'punching';
                const isHandwork = stage === 'handwork';
                const isGodown = stage === 'godown' || job.stage === 'packaged';

                return (
                  <div 
                    key={job.jobId} 
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all text-slate-800"
                  >
                    {/* Card Header: Job ID, Priority, Client & Item */}
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-semibold text-xs text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                              {job.jobId}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Ref: {job.orderId}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-base mt-1">
                            {job.itemName}
                          </h4>
                          <div className="text-xs text-slate-600 mt-0.5 flex items-center space-x-1.5">
                            <span className="text-slate-500">Client:</span>
                            <span className="font-semibold text-slate-900">{job.customerCompany || job.customerName}</span>
                          </div>
                        </div>

                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider ${
                          job.priority === 'urgent' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {job.priority || 'standard'}
                        </span>
                      </div>

                      {/* Multi-Card Details & Sheet Metrics */}
                      <div className="mt-3.5 space-y-2">
                        {/* Multi-Card or Single-Card breakdown */}
                        {job.isMultiCard && job.cards && job.cards.length > 0 ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                            <span className="text-[10px] uppercase font-semibold text-slate-700 block mb-1">
                              Multi-Card Components ({job.cards.length} Cards in set)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {job.cards.map((c, ci) => (
                                <div key={ci} className="bg-white p-2 rounded-lg border border-slate-200">
                                  <span className="font-semibold text-slate-900 block">{c.title}</span>
                                  <span className="text-slate-500 text-[11px]">{c.catalogCode || c.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                            <span className="text-slate-500">Paper Catalog:</span>
                            <span className="font-medium text-slate-900">{job.cards?.[0]?.catalogCode || job.material || 'Standard Catalog'}</span>
                          </div>
                        )}

                        {/* Sheet Buffer Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center font-mono text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Target</span>
                            <span className="font-bold text-slate-900 text-sm">{(job.targetQty || 1000).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 block font-sans">pcs</span>
                          </div>
                          <div className="border-x border-slate-200">
                            <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Issued (+40 buf)</span>
                            <span className="font-bold text-slate-900 text-sm">{job.issuedSheets || (job.targetQty + 40)}</span>
                            <span className="text-[10px] text-slate-500 block font-sans">sheets</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Allowed Floor</span>
                            <span className="font-bold text-slate-900 text-sm">{job.minimumAllowedFloor || 960}</span>
                            <span className="text-[10px] text-slate-500 block font-sans">min sheets</span>
                          </div>
                        </div>
                      </div>

                      {/* Visual 4-Step Pipeline Bar */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-slate-500 mb-1.5">
                          <span className={isPrinting ? 'text-slate-900 font-bold' : job.printing?.status === 'completed' ? 'text-emerald-700 font-bold' : ''}>
                            {job.printing?.status === 'completed' ? '✓ ' : ''}1. Print
                          </span>
                          <span className={isPunching ? 'text-slate-900 font-bold' : job.punching?.status === 'completed' ? 'text-emerald-700 font-bold' : ''}>
                            {job.punching?.status === 'completed' ? '✓ ' : ''}2. Punch
                          </span>
                          <span className={isHandwork ? 'text-slate-900 font-bold' : job.handwork?.status === 'completed' ? 'text-emerald-700 font-bold' : ''}>
                            {job.handwork?.status === 'completed' ? '✓ ' : ''}3. Handwork
                          </span>
                          <span className={isGodown ? 'text-emerald-700 font-bold' : ''}>
                            {isGodown ? '✓ ' : ''}4. Godown
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 h-1.5 rounded-full overflow-hidden bg-slate-100">
                          <div className={`h-full ${job.printing?.status === 'completed' ? 'bg-emerald-600' : isPrinting ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                          <div className={`h-full ${job.punching?.status === 'completed' ? 'bg-emerald-600' : isPunching ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                          <div className={`h-full ${job.handwork?.status === 'completed' ? 'bg-emerald-600' : isHandwork ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                          <div className={`h-full ${isGodown ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
                        </div>
                      </div>
                    </div>

                    {/* Stage Specific Interactive Action Panel */}
                    <div className="mt-2 bg-slate-50 border border-slate-200/90 rounded-xl p-4">
                      
                      {/* STAGE 1: PRINTING PROCESS */}
                      {isPrinting && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800">
                              Printing Press Station ({job.printing?.operatorName || 'Kanu'})
                            </span>
                            <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              Stage 1 of 4
                            </span>
                          </div>

                          {job.printing?.status !== 'in_progress' ? (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-slate-500">Job queued for offset/screen press.</span>
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
                                <strong>Rule:</strong> Record the exact number of sheets printed. It must be &ge; 960 sheets to proceed.
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[11px] font-medium text-slate-700 block mb-1">
                                    Good Sheets Printed <span className="text-rose-600">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 1010"
                                    value={getSheetInput(job.jobId, 'printed')}
                                    onChange={(e) => setSheetInput(job.jobId, 'printed', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </div>

                                <div>
                                  <label className="text-[11px] font-medium text-slate-700 block mb-1">
                                    Waste / Spoilage Sheets
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 30"
                                    value={getSheetInput(job.jobId, 'waste')}
                                    onChange={(e) => setSheetInput(job.jobId, 'waste', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCompletePrinting(job)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                              >
                                <span>Complete Printing &amp; Forward to Punching</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* STAGE 2: PUNCHING & PACKING PROCESS */}
                      {isPunching && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800">
                              Punching &amp; Die Press ({job.punching?.operatorName || 'Shivakant'})
                            </span>
                            <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              Stage 2 of 4
                            </span>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between font-mono">
                            <span className="text-slate-500">Printed Input Received:</span>
                            <span className="font-bold text-slate-900">
                              {job.printing?.goodSheetsPrinted || 1010} sheets
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
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[11px] font-medium text-slate-700 block mb-1">
                                    Good Punched Sheets <span className="text-rose-600">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 995"
                                    value={getSheetInput(job.jobId, 'punched')}
                                    onChange={(e) => setSheetInput(job.jobId, 'punched', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </div>

                                <div>
                                  <label className="text-[11px] font-medium text-slate-700 block mb-1">
                                    Die Wastage
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 15"
                                    value={getSheetInput(job.jobId, 'punchWaste')}
                                    onChange={(e) => setSheetInput(job.jobId, 'punchWaste', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleCompletePunching(job)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                              >
                                <span>Complete Punching &amp; Move to Handwork</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* STAGE 3: HANDWORK PROCESS (DORI & PLASTIC) */}
                      {isHandwork && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800">
                              Handwork Assembly (Dori &amp; Plastic)
                            </span>
                            <span className="text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              Stage 3 of 4
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
                                <div className="space-y-2 pt-1">
                                  <div>
                                    <label className="text-[11px] font-medium text-slate-700 block mb-1">
                                      Finished Tags Completed (Pcs) <span className="text-rose-600">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      placeholder="e.g. 990"
                                      value={getSheetInput(job.jobId, 'handworkPieces', job.punching?.goodSheetsPunched || job.targetQty || 1000)}
                                      onChange={(e) => setSheetInput(job.jobId, 'handworkPieces', e.target.value)}
                                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleCompleteHandwork(job)}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2.5 rounded-xl transition-colors"
                                  >
                                    Mark Complete &amp; Move to Godown
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* STAGE 4: GODOWN (READY FOR DISPATCH) */}
                      {isGodown && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800">
                              Godown / Finished Goods Storage
                            </span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
                              Ready for Dispatch ✓
                            </span>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Warehouse Location:</span>
                              <span className="font-mono font-semibold text-slate-900">{job.godown?.location || 'Rack Bay A-01'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Verified Quantity:</span>
                              <span className="font-mono font-bold text-emerald-700">
                                {job.handwork?.completedPieces || job.targetQty || 1000} pcs ready
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Handwork Artisan Payout:</span>
                              <span className="font-mono text-slate-700">
                                {job.handwork?.assignedLabourerName || 'Artisan'} &bull; {formatCurrency(job.handwork?.earnedPayout || 300)}
                              </span>
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
                              onClick={() => {
                                const parent = orders.find(o => o.id === job.orderId);
                                if (parent) setDispatchModalOrder(parent);
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-4 rounded-xl transition-colors"
                            >
                              Dispatch Order
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
                <p className="text-xs text-slate-500 mt-1">Approve an order in &quot;View All Orders&quot; and click &quot;Send to Production&quot; to generate job forms.</p>
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
                <h3 className="font-bold text-slate-900 text-base">
                  {editingCatalog ? `Edit Paper Catalog: ${editingCatalog.code}` : 'Add New Paper Catalog Swatch'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCatalogSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Catalog Swatch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cat #107 - Royal Velvet 320"
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Paper / Board Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Velvet Board 320 GSM"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">GSM (Weight) *</label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="1000"
                    placeholder="e.g. 350"
                    value={catGsm}
                    onChange={(e) => setCatGsm(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Surface Finish *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Silk Matte"
                    value={catFinish}
                    onChange={(e) => setCatFinish(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Sheet Rate (₹) *</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0.10"
                    required
                    placeholder="e.g. 3.50"
                    value={catRate}
                    onChange={(e) => setCatRate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Recommended Application</label>
                  <input
                    type="text"
                    placeholder="e.g. Luxury Clothing Hangtags"
                    value={catRec}
                    onChange={(e) => setCatRec(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Opening Stock (Sheets)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={catStock}
                    onChange={(e) => setCatStock(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs py-2 px-4 rounded-xl border border-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-5 rounded-xl transition-colors"
                >
                  {editingCatalog ? 'Save Changes' : 'Create Paper Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVE TO PRODUCTION SHEET ALLOCATION MODAL (INDIVIDUAL & BULK) */}
      {prodModalOrders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Send to Production &bull; Sheet Allocation ({prodModalOrders.length} Order{prodModalOrders.length > 1 ? 's' : ''})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Order quantities are booked in <strong>pieces (pcs)</strong>. Printing is run in <strong>sheets</strong>. Enter sheet quantity below before dispatching to printing press.
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

            <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
              {prodModalOrders.map(ord => (
                <div key={ord.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900">{ord.id}</span>
                      <span className="text-slate-400 text-xs">&bull;</span>
                      <span className="text-xs text-slate-700 font-medium">{ord.customerCompany || ord.customerName}</span>
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
                        catalogCode: item.catalogCode || item.material || 'Standard Catalog'
                      }
                    ];

                    return (
                      <div key={itemIdx} className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900">{item.name || item.itemCode}</span>
                          <span className="font-mono text-slate-700 font-medium">
                            Order Qty: {Number(item.quantity || 1000).toLocaleString()} pcs
                          </span>
                        </div>

                        {cardsList.map((card, cardIdx) => {
                          const key = `${ord.id}_${itemIdx}_${cardIdx}`;
                          const alloc = prodSheetAllocations[key] || { ups: 10, sheets: Math.ceil(Number(item.quantity || 1000) / 10), orderPieces: Number(item.quantity || 1000) };
                          const targetSheets = alloc.sheets || 100;
                          const bufferSheets = 40; // 20 print + 20 punch
                          const issuedSheets = targetSheets + bufferSheets;
                          const minFloor = Math.max(1, targetSheets - 40);

                          return (
                            <div key={cardIdx} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-900">
                                  {card.title || `Card #${cardIdx + 1}`} ({card.catalogCode || item.material || 'Catalog Paper'})
                                </span>
                                <span className="text-slate-500">
                                  Target: {alloc.orderPieces.toLocaleString()} tags
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                                    Required Net Sheets * (Press Target)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    required
                                    value={alloc.sheets || ''}
                                    onChange={(e) => handleUpdateSheetAlloc(key, 'sheets', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-400"
                                  />
                                </div>
                              </div>

                              {/* Sheet Calculation Live Summary */}
                              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center font-mono text-xs text-slate-800">
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase block font-sans">Net Target</span>
                                  <span className="font-bold text-slate-900">{targetSheets}</span>
                                  <span className="text-[9px] text-slate-500 block font-sans">sheets</span>
                                </div>
                                <div className="border-x border-slate-200">
                                  <span className="text-[9px] text-slate-500 uppercase block font-sans">Issued (+40 buf)</span>
                                  <span className="font-bold text-slate-900">{issuedSheets}</span>
                                  <span className="text-[9px] text-slate-500 block font-sans">+20 prn, +20 pnc</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-slate-500 uppercase block font-sans">Floor (min)</span>
                                  <span className="font-bold text-slate-900">{minFloor}</span>
                                  <span className="text-[9px] text-slate-500 block font-sans">alert threshold</span>
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
                <span>Buffer Rule:</span> <span className="text-slate-800 font-semibold">+20 sheets Printing + 20 sheets Punching</span>
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
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-5 rounded-xl transition-colors"
                >
                  Confirm &amp; Move to Printing Floor
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

window.uBMS.AdminPortal = AdminPortal;
