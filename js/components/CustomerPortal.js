// Customer Portal: Tags & Labels Manufacturing Order System
window.uBMS = window.uBMS || {};

function CustomerPortal({ 
  customer, 
  orders, 
  invoices, 
  payments, 
  labelTypes = [], 
  catalogs = [],
  messages, 
  users,
  onUpdateUsers,
  onSaveOrder, 
  onUpdateOrder,
  onSaveMessage, 
  onOpenInvoice, 
  defaultTab = 'dashboard' 
}) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  const [previewArtworkUrl, setPreviewArtworkUrl] = React.useState(null);
  const [bannerMinimized, setBannerMinimized] = React.useState(activeTab !== 'dashboard');

  // Automatically minimize on non-dashboard tabs, expand on dashboard
  React.useEffect(() => {
    setBannerMinimized(activeTab !== 'dashboard');
  }, [activeTab]);

  // Edit Order State (Customer allowed to edit before admin approval)
  const [editingOrder, setEditingOrder] = React.useState(null);
  const [editBrandName, setEditBrandName] = React.useState('');
  const [editSelectedType, setEditSelectedType] = React.useState('Tag');
  const [editSelectedMaterial, setEditSelectedMaterial] = React.useState('');
  const [editDoriOption, setEditDoriOption] = React.useState('reg');
  const [editDoriCustom, setEditDoriCustom] = React.useState('');
  const [editPlasticOption, setEditPlasticOption] = React.useState('reg');
  const [editPlasticCustom, setEditPlasticCustom] = React.useState('');
  const [editQty, setEditQty] = React.useState(0);
  const [editRate, setEditRate] = React.useState(0);
  const [editOrderImage, setEditOrderImage] = React.useState('');
  const [editNotes, setEditNotes] = React.useState('');

  // Filter orders for this customer
  const customerOrders = React.useMemo(() => {
    return orders.filter(o => o.customerId === customer.id || o.customerEmail === customer.email);
  }, [orders, customer]);

  // Order Register Filter & Search states
  const [orderStatusFilter, setOrderStatusFilter] = React.useState('all');
  const [searchBrandSpecs, setSearchBrandSpecs] = React.useState('');
  const [searchDoriPlastic, setSearchDoriPlastic] = React.useState('');
  const [searchQty, setSearchQty] = React.useState('');
  const [searchRate, setSearchRate] = React.useState('');

  const filteredCustomerOrders = React.useMemo(() => {
    return customerOrders.filter(order => {
      // 1. Status Filter
      if (orderStatusFilter !== 'all') {
        const s = (order.status || '').toLowerCase();
        if (orderStatusFilter === 'pending') {
          if (s !== 'pending' && s !== 'placed') return false;
        } else if (orderStatusFilter === 'approved') {
          if (s !== 'approved' && s !== 'confirmed') return false;
        } else if (s !== orderStatusFilter.toLowerCase()) {
          return false;
        }
      }

      const items = order.items && order.items.length > 0 ? order.items : [{}];

      // 2. Individual Search: Brand & Item Specs
      if (searchBrandSpecs.trim()) {
        const query = searchBrandSpecs.trim().toLowerCase();
        const matchesSpecs = items.some(item => {
          const brand = (item.brandName || order.customerCompany || '').toLowerCase();
          const itemCode = (item.itemCode || item.name || '').toLowerCase();
          const type = (item.type || '').toLowerCase();
          const material = (item.material || '').toLowerCase();
          return brand.includes(query) || itemCode.includes(query) || type.includes(query) || material.includes(query);
        });
        if (!matchesSpecs) return false;
      }

      // 3. Individual Search: Dori & Plastic
      if (searchDoriPlastic.trim()) {
        const query = searchDoriPlastic.trim().toLowerCase();
        const matchesDoriPlastic = items.some(item => {
          const dori = (item.dori || '').toLowerCase();
          const plastic = (item.plastic || '').toLowerCase();
          return dori.includes(query) || plastic.includes(query);
        });
        if (!matchesDoriPlastic) return false;
      }

      // 4. Individual Search: Qty
      if (searchQty.trim()) {
        const query = searchQty.trim().replace(/,/g, '').toLowerCase();
        const matchesQty = items.some(item => {
          const qStr = String(item.quantity || '');
          const qFmt = Number(item.quantity || 0).toLocaleString().toLowerCase();
          return qStr.includes(query) || qFmt.includes(query);
        });
        if (!matchesQty) return false;
      }

      // 5. Individual Search: Rate
      if (searchRate.trim()) {
        const query = searchRate.trim().replace(/[₹,\s]/g, '').toLowerCase();
        const matchesRate = items.some(item => {
          const rStr = String(item.unitPrice || '');
          const rFmt = (typeof formatCurrency === 'function' ? formatCurrency(item.unitPrice || 0) : '').toLowerCase();
          return rStr.includes(query) || rFmt.includes(query);
        });
        if (!matchesRate) return false;
      }

      return true;
    });
  }, [customerOrders, orderStatusFilter, searchBrandSpecs, searchDoriPlastic, searchQty, searchRate]);

  const customerInvoices = React.useMemo(() => {
    return invoices.filter(i => i.customerId === customer.id);
  }, [invoices, customer]);

  // Financial Ledgers
  const generalLedger = React.useMemo(() => {
    return window.uBMS.computeCustomerGeneralLedger(customer.id, customerInvoices, payments);
  }, [customer, customerInvoices, payments]);

  const outstandingLedger = React.useMemo(() => {
    return window.uBMS.computeOutstandingLedger(customer.id, customerInvoices);
  }, [customer, customerInvoices]);

  // Customer Dashboard KPI Metrics
  const customerStats = React.useMemo(() => {
    const totalOrders = customerOrders.length;
    const pendingOrders = customerOrders.filter(o => o.status === 'pending' || o.status === 'placed').length;
    const approvedOrders = customerOrders.filter(o => o.status === 'approved' || o.status === 'confirmed').length;
    const inProdOrders = customerOrders.filter(o => o.status === 'in_production').length;
    const readyOrders = customerOrders.filter(o => o.status === 'ready_dispatch').length;
    const shippedOrders = customerOrders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = customerOrders.filter(o => o.status === 'delivered').length;
    const activeOrders = inProdOrders + readyOrders + shippedOrders;

    const totalSpend = customerOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalOutstanding = outstandingLedger?.totalOutstanding || 0;
    const unpaidInvoicesCount = (outstandingLedger?.bills || []).length;

    return {
      totalOrders,
      pendingOrders,
      approvedOrders,
      inProdOrders,
      readyOrders,
      shippedOrders,
      deliveredOrders,
      activeOrders,
      totalSpend,
      totalOutstanding,
      unpaidInvoicesCount
    };
  }, [customerOrders, outstandingLedger]);

  // Chat Thread
  const customerThread = React.useMemo(() => {
    const thread = messages.find(m => m.threadId === customer.id);
    return thread || { threadId: customer.id, customerName: customer.name, accountManager: 'Parth', messages: [] };
  }, [messages, customer]);

  const [chatInput, setChatInput] = React.useState('');

  // ---------------------------------------------------------------------------
  // Available Types & Paper Catalogs
  // ---------------------------------------------------------------------------
  const baseTypes = (labelTypes && labelTypes.length > 0) ? labelTypes : [
    { id: 'TYPE-TAG', name: 'Tag', materials: ['100 GSM', '200 GSM', '300 GSM'], defaultRate: 2.50 },
    { id: 'TYPE-PULABEL', name: 'PU Label', materials: ['1.2', '1.8', '2.2'], defaultRate: 14.00 }
  ];
  const availableTypes = baseTypes.some(t => t.name === 'Tag Kit') ? baseTypes : [
    ...baseTypes,
    { id: 'TYPE-TAGKIT', name: 'Tag Kit', materials: ['100 GSM', '200 GSM', '300 GSM'], defaultRate: 5.00 }
  ];

  const availableCatalogs = catalogs.length > 0 ? catalogs : [
    { id: 'CAT-IV350', code: 'Cat #101 - Art Ivory 350', name: 'Art & Ivory Board 350 GSM', gsm: 350, finish: 'Silk Matte Coated', sheetRate: 3.20 },
    { id: 'CAT-KF280', code: 'Cat #102 - Natural Kraft 280', name: 'Virgin Eco Kraft Paper 280 GSM', gsm: 280, finish: 'Raw Fibrous Texture', sheetRate: 2.40 },
    { id: 'CAT-SP300', code: 'Cat #103 - Sappi Black 300', name: 'Sappi Velvet Jet Black 300 GSM', gsm: 300, finish: 'Solid Deep Black Matte', sheetRate: 4.50 },
    { id: 'CAT-TR115', code: 'Cat #104 - Tracing Butter 115', name: 'Translucent Butter Paper 115 GSM', gsm: 115, finish: 'Semi-Transparent Frosted', sheetRate: 1.90 },
    { id: 'CAT-MT400', code: 'Cat #105 - Metallic Pearl 400', name: 'Champagne Shimmer Board 400 GSM', gsm: 400, finish: 'Subtle Pearl Luster', sheetRate: 5.80 },
    { id: 'CAT-DUP250', code: 'Cat #106 - Sturdy Duplex 250', name: 'Greyback Duplex Board 250 GSM', gsm: 250, finish: 'Semi-Gloss Single Sided', sheetRate: 1.60 }
  ];

  // ---------------------------------------------------------------------------
  // Tags & Labels Order Creation State
  // ---------------------------------------------------------------------------
  const [orderImage, setOrderImage] = React.useState('');
  const [brandName, setBrandName] = React.useState('');
  const [brandInputFocused, setBrandInputFocused] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState(availableTypes[0]?.name || 'Tag');
  
  const currentTypeObj = availableTypes.find(t => t.name === selectedType) || availableTypes[0];
  const [selectedMaterial, setSelectedMaterial] = React.useState(currentTypeObj?.materials[0] || '100 GSM');
  const [selectedCatalogId, setSelectedCatalogId] = React.useState(availableCatalogs[0]?.id || 'CAT-IV350');
  
  // Multi-Card Tag composition: A tag can have 2 or 3 separate cards
  const [isMultiCard, setIsMultiCard] = React.useState(false);
  const [singleCardDimension, setSingleCardDimension] = React.useState('');
  const [tagCards, setTagCards] = React.useState([
    { id: 1, title: 'Tag 1 (Base Tag)', catalogId: availableCatalogs[0]?.id || 'CAT-IV350', dimension: '' },
    { id: 2, title: 'Tag 2 (Upper Tag)', catalogId: availableCatalogs[1]?.id || 'CAT-KF280', dimension: '' }
  ]);

  const [qty, setQty] = React.useState(0);
  const [rate, setRate] = React.useState(0);

  // Dori & Plastic States (Reg. vs Custom)
  const [doriOption, setDoriOption] = React.useState('reg'); // 'reg' or 'custom'
  const [doriCustom, setDoriCustom] = React.useState('');

  const [plasticOption, setPlasticOption] = React.useState('reg'); // 'none', 'reg', 'custom'
  const [plasticCustom, setPlasticCustom] = React.useState('');

  // Repeat Order State & PU Selection States
  const [repeatSelectedItemCode, setRepeatSelectedItemCode] = React.useState('');
  const [repeatSelectedItemName, setRepeatSelectedItemName] = React.useState('');
  const [repeatSearchQuery, setRepeatSearchQuery] = React.useState('');
  const [repeatInputFocused, setRepeatInputFocused] = React.useState(false);
  const [localSavedBrands, setLocalSavedBrands] = React.useState([]);

  // Collect all saved brands for this customer (from customer profile, past orders, and session)
  const customerSavedBrands = React.useMemo(() => {
    const brandSet = new Set();
    
    // Explicit brands saved on customer profile
    if (Array.isArray(customer?.brands)) {
      customer.brands.forEach(b => {
        if (b && typeof b === 'string' && b.trim()) brandSet.add(b.trim());
      });
    }

    // Dynamic session saved brands
    (localSavedBrands || []).forEach(b => {
      if (b && typeof b === 'string' && b.trim()) brandSet.add(b.trim());
    });

    // Default company name as brand
    if (customer?.company && typeof customer.company === 'string' && customer.company.trim()) {
      brandSet.add(customer.company.trim());
    }

    // Historical brand names from past customer orders
    (orders || []).forEach(o => {
      const isThisCust = (o.customerId && customer?.id && o.customerId === customer.id) ||
                         (o.customerEmail && customer?.email && o.customerEmail === customer.email) ||
                         (o.customerName && customer?.name && o.customerName === customer.name);
      if (isThisCust && Array.isArray(o.items)) {
        o.items.forEach(item => {
          if (item.brandName && typeof item.brandName === 'string' && item.brandName.trim()) {
            brandSet.add(item.brandName.trim());
          }
        });
      }
    });

    return Array.from(brandSet).sort();
  }, [customer, orders, localSavedBrands]);

  // Persist brand to customer profile and backend storage
  const saveCustomerBrand = async (brandToSave) => {
    if (!brandToSave || !brandToSave.trim() || !customer) return;
    const clean = brandToSave.trim();

    // Update in-memory customer object
    if (!Array.isArray(customer.brands)) {
      customer.brands = [];
    }
    const alreadySaved = customer.brands.some(b => b.toLowerCase() === clean.toLowerCase());
    if (!alreadySaved) {
      customer.brands.push(clean);
    }

    setLocalSavedBrands(prev => {
      if (!prev.some(b => b.toLowerCase() === clean.toLowerCase())) {
        return [...prev, clean];
      }
      return prev;
    });

    // Persist via DataService
    try {
      const usersData = await window.uBMS.DataService.fetchUsers();
      if (usersData && Array.isArray(usersData.customers)) {
        const idx = usersData.customers.findIndex(c => c.id === customer.id || c.email === customer.email);
        if (idx !== -1) {
          const custBrands = usersData.customers[idx].brands || [];
          if (!custBrands.some(b => b.toLowerCase() === clean.toLowerCase())) {
            usersData.customers[idx].brands = [...custBrands, clean];
            await window.uBMS.DataService.saveUsers(usersData);
            if (typeof onUpdateUsers === 'function') {
              onUpdateUsers(usersData);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not persist brand to users storage:', err);
    }
  };
  const [puOrigin, setPuOrigin] = React.useState('Indian'); // 'Indian' or 'Imported'
  const [puThickness, setPuThickness] = React.useState('1.8'); // '1.2', '1.8', '2.2'

  // General Information States (Matching TagX online reference layout)
  const [transactionType, setTransactionType] = React.useState('Sales Order');
  const [orderType, setOrderType] = React.useState('New Order');
  const [gstNo, setGstNo] = React.useState(customer?.gstNo || '');

  // Order Flow Navigation & Validation States
  const [currentStep, setCurrentStep] = React.useState(1);
  const [stepValidationErrors, setStepValidationErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = React.useState(false);

  // List of all previous items ordered by this customer for Repeat Order selection
  const customerPastItems = React.useMemo(() => {
    const list = [];
    const seen = new Set();
    (orders || []).forEach(o => {
      const isThisCust = (o.customerId && customer?.id && o.customerId === customer.id) ||
                         (o.customerEmail && customer?.email && o.customerEmail === customer.email) ||
                         (o.customerName && customer?.name && o.customerName === customer.name);
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
  }, [orders, customer]);

  // Filtered list of past items based on user search query
  const filteredRepeatItems = React.useMemo(() => {
    if (!customerPastItems || customerPastItems.length === 0) return [];
    const q = (repeatSearchQuery || '').trim().toLowerCase();
    if (!q) return customerPastItems;
    return customerPastItems.filter(item => {
      const code = (item.itemCode || '').toLowerCase();
      const name = (item.name || '').toLowerCase();
      const brand = (item.brandName || '').toLowerCase();
      const type = (item.type || '').toLowerCase();
      const mat = (item.material || '').toLowerCase();
      return code.includes(q) || name.includes(q) || brand.includes(q) || type.includes(q) || mat.includes(q);
    });
  }, [customerPastItems, repeatSearchQuery]);

  const handleSelectRepeatItem = (code) => {
    setRepeatSelectedItemCode(code);
    if (stepValidationErrors.repeatSelectedItemCode) {
      setStepValidationErrors(prev => ({ ...prev, repeatSelectedItemCode: null }));
    }
    const found = customerPastItems.find(i => (i.itemCode || i.name) === code);
    if (found) {
      const displayName = found.name || found.itemCode || code;
      const displayLabel = found.itemCode && found.name && found.itemCode !== found.name ? found.name + ' (' + found.itemCode + ')' : displayName;
      setRepeatSearchQuery(displayLabel);
      setRepeatSelectedItemName(displayName);
      if (found.brandName) setBrandName(found.brandName);
      if (found.type) {
        setSelectedType(found.type);
        const typeObj = availableTypes.find(t => t.name === found.type);
        if (typeObj && typeObj.materials) setSelectedMaterial(found.material || typeObj.materials[0]);
      }
      if (found.catalogId) setSelectedCatalogId(found.catalogId);
      if (found.material && found.material.includes('Indian PU')) {
        setPuOrigin('Indian');
        if (found.material.includes('1.2')) setPuThickness('1.2');
        else if (found.material.includes('2.2')) setPuThickness('2.2');
        else setPuThickness('1.8');
      } else if (found.material && (found.material.includes('Imported') || found.material.includes('PU'))) {
        setPuOrigin('Imported');
      }
      if (found.image) setOrderImage(found.image);
      if (found.unitPrice) setRate(found.unitPrice);
      if (found.quantity) setQty(found.quantity);
      if (found.dori) {
        if (found.dori === 'None') {
          setDoriOption('none');
          setDoriCustom('');
        } else if (found.dori.startsWith('Custom:')) {
          setDoriOption('custom');
          setDoriCustom(found.dori.replace('Custom:', '').trim());
        } else {
          setDoriOption('reg');
          setDoriCustom('');
        }
      }
      if (found.plastic) {
        if (found.plastic === 'None') {
          setPlasticOption('none');
          setPlasticCustom('');
        } else if (found.plastic.startsWith('Custom:')) {
          setPlasticOption('custom');
          setPlasticCustom(found.plastic.replace('Custom:', '').trim());
        } else {
          setPlasticOption('reg');
          setPlasticCustom('');
        }
      }
      if (found.isMultiCard && found.cards && found.cards.length > 0) {
        setIsMultiCard(true);
        setTagCards(found.cards);
      } else {
        setIsMultiCard(false);
      }
    }
  };

  // Update material when type changes
  const handleTypeChange = (newType) => {
    setSelectedType(newType);
    const typeObj = availableTypes.find(t => t.name === newType);
    if (typeObj) {
      setSelectedMaterial(typeObj.materials[0] || '');
      if (typeObj.defaultRate && (!rate || Number(rate) === 0)) {
        setRate(typeObj.defaultRate);
      }
    }
  };

  const handleUpdateCardCatalog = (cardIndex, newCatId) => {
    setTagCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, catalogId: newCatId } : c));
  };

  const handleUpdateCardDimension = (cardIndex, newDim) => {
    setTagCards(prev => prev.map((c, i) => i === cardIndex ? { ...c, dimension: newDim } : c));
  };

  const handleAddThirdCard = () => {
    if (tagCards.length >= 3) return;
    setTagCards(prev => [
      ...prev,
      { id: 3, title: 'Tag 3 (Overlay Tag)', catalogId: availableCatalogs[3]?.id || 'CAT-TR115', dimension: '' }
    ]);
  };

  const handleRemoveThirdCard = () => {
    setTagCards(prev => prev.slice(0, 2));
  };

  // Image upload & cropping
  const [showCropModal, setShowCropModal] = React.useState(false);
  const [showFullImageModal, setShowFullImageModal] = React.useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrderImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCroppedImage = (croppedUrl) => {
    setOrderImage(croppedUrl);
    setShowCropModal(false);
  };

  // Cart / Items in Current Order
  const [orderItems, setOrderItems] = React.useState([]);
  const [orderNotes, setOrderNotes] = React.useState('');

  const formatCurrency = window.uBMS.formatCurrency;
  const formatDate = window.uBMS.formatDate;

  // Auto-calculated unique Item Code for Customer (e.g. MGC01, MGC02)
  const customerPartyName = customer?.company || customer?.name || brandName;
  const customerAbbr = window.uBMS.generateCustomerAbbr(customerPartyName);
  const currentCustomerItemCode = window.uBMS.getNextItemCode(customerAbbr, orders, orderItems);
  const customerItemIndex = window.uBMS.getCustomerNextItemIndex(customer, orders, orderItems);
  const currentDraftItemName = window.uBMS.formatItemName(customerAbbr, selectedType, brandName, customerItemIndex);

  // Unified Form Validation (Matching modern single-view layout)
  const validateOrderForm = () => {
    const errors = {};
    if (!brandName || !brandName.trim()) {
      errors.brandName = 'Please enter a brand name.';
    }
    if (!selectedType) {
      errors.selectedType = 'Please select a category.';
    }
    if (selectedType === 'Tag' || selectedType === 'Tag Kit') {
      if (!isMultiCard && !selectedCatalogId) {
        errors.selectedCatalogId = 'Please select a paper catalog.';
      }
    } else if (selectedType === 'PU Label' && !selectedMaterial) {
      errors.selectedMaterial = 'Please select a material gauge.';
    }
    if (doriOption === 'custom' && (!doriCustom || !doriCustom.trim())) {
      errors.doriCustom = 'Please specify custom dori details.';
    }
    if (plasticOption === 'custom' && (!plasticCustom || !plasticCustom.trim())) {
      errors.plasticCustom = 'Please specify custom plastic lock details.';
    }
    if (!qty || Number(qty) <= 0) {
      errors.qty = 'Please enter a valid quantity in pieces (greater than 0).';
    }
    if (!rate || Number(rate) <= 0) {
      errors.rate = 'Please enter a valid rate per piece (greater than 0).';
    }

    setStepValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDiscardDraft = () => {
    if (window.confirm('Discard current order draft and reset all inputs?')) {
      setBrandName('');
      setRepeatSelectedItemCode('');
      setRepeatSelectedItemName('');
      setRepeatSearchQuery('');
      setOrderImage('');
      setSingleCardDimension('');
      setQty(0);
      setRate(0);
      setDoriOption('reg');
      setDoriCustom('');
      setPlasticOption('reg');
      setPlasticCustom('');
      setOrderItems([]);
      setOrderNotes('');
      setStepValidationErrors({});
    }
  };

  // 4-Step Flow Validation
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!orderType || !orderType.trim()) {
        errors.orderType = 'Please select an order type (New or Repeat).';
      }
      if (orderType === 'Repeat Order' && !repeatSelectedItemCode && customerPastItems.length > 0) {
        errors.repeatSelectedItemCode = 'Please select an existing item to reorder.';
      }
      if (!brandName || !brandName.trim()) {
        errors.brandName = 'Please enter a brand name.';
      }
      if (!selectedType) {
        errors.selectedType = 'Please select a manufacturing type.';
      }
    } else if (step === 2) {
      if (selectedType === 'Tag') {
        if (!isMultiCard && !selectedCatalogId) {
          errors.selectedCatalogId = 'Please select a paper catalog.';
        }
      } else if (selectedType !== 'Tag' && !selectedMaterial) {
        errors.selectedMaterial = 'Please select a material gauge.';
      }
      if (doriOption === 'custom' && (!doriCustom || !doriCustom.trim())) {
        errors.doriCustom = 'Please specify your custom dori details.';
      }
      if (plasticOption === 'custom' && (!plasticCustom || !plasticCustom.trim())) {
        errors.plasticCustom = 'Please specify your custom plastic lock details.';
      }
    } else if (step === 3) {
      if (!qty || Number(qty) <= 0) {
        errors.qty = 'Please enter a valid quantity in pieces (greater than 0).';
      }
      if (!rate || Number(rate) <= 0) {
        errors.rate = 'Please enter a valid rate per piece (greater than 0).';
      }
    }

    setStepValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (validateStep(currentStep)) {
      setStepValidationErrors({});
      setCurrentStep(prev => Math.min(4, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setStepValidationErrors({});
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToStep = (targetStep) => {
    if (targetStep < currentStep) {
      setStepValidationErrors({});
      setCurrentStep(targetStep);
    } else if (targetStep > currentStep) {
      let canProceed = true;
      for (let s = 1; s < targetStep; s++) {
        if (!validateStep(s)) {
          setCurrentStep(s);
          canProceed = false;
          break;
        }
      }
      if (canProceed) {
        setStepValidationErrors({});
        setCurrentStep(targetStep);
      }
    }
  };

  // Live Current Draft Item Object
  const currentDraftItem = React.useMemo(() => {
    let finalMaterial = selectedMaterial;
    let chosenCards = [];
    let primaryCatalogId = null;
    let primaryCatalogCode = null;

    if (selectedType === 'Tag' || selectedType === 'Tag Kit') {
      if (isMultiCard) {
        chosenCards = tagCards.map((c, i) => {
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
        finalMaterial = `${tagCards.length}-Card Set: ` + chosenCards.map(c => c.catalogCode.split(' - ')[1] || c.catalogCode).join(' + ');
        primaryCatalogId = chosenCards[0]?.catalogId;
        primaryCatalogCode = chosenCards[0]?.catalogCode;
      } else {
        const cat = availableCatalogs.find(x => x.id === selectedCatalogId) || availableCatalogs[0];
        chosenCards = [{
          cardIndex: 1,
          title: 'Single Card Tag',
          catalogId: cat.id,
          catalogCode: cat.code,
          name: cat.name,
          gsm: cat.gsm,
          finish: cat.finish,
          dimension: singleCardDimension || ''
        }];
        finalMaterial = `${cat.code} (${cat.finish})`;
        primaryCatalogId = cat.id;
        primaryCatalogCode = cat.code;
      }
    }

    if (selectedType === 'PU Label') {
      if (puOrigin === 'Indian') {
        finalMaterial = `Indian PU - ${puThickness}`;
      } else {
        finalMaterial = 'Imported PU (Standard Quality)';
      }
    }

    const activeItemCode = (orderType === 'Repeat Order' && repeatSelectedItemCode)
      ? repeatSelectedItemCode
      : currentCustomerItemCode;

    const activeItemName = (orderType === 'Repeat Order' && repeatSelectedItemCode)
      ? (repeatSelectedItemName || repeatSelectedItemCode)
      : currentDraftItemName;

    const isTagKit = selectedType === 'Tag Kit';
    const doriValue = isTagKit
      ? 'None'
      : doriOption === 'custom'
        ? `Custom: ${doriCustom.trim()}`
        : doriOption === 'none'
          ? 'None'
          : 'Reg. (₹0.20/pc)';

    const plasticValue = isTagKit
      ? 'None'
      : plasticOption === 'custom'
        ? `Custom: ${plasticCustom.trim()}`
        : plasticOption === 'none'
          ? 'None'
          : 'Reg. (₹0.10/pc)';
    const quantityNum = Number(qty) || 0;
    const rateNum = Number(rate) || 0;
    const itemTotal = quantityNum * rateNum;

    return {
      id: 'ITEM-' + Date.now().toString().slice(-4),
      itemCode: activeItemCode,
      name: activeItemName,
      brandName: brandName.trim(),
      type: selectedType,
      isMultiCard: selectedType === 'Tag' ? isMultiCard : false,
      cards: chosenCards,
      catalogId: primaryCatalogId,
      catalogCode: primaryCatalogCode,
      material: finalMaterial,
      dori: doriValue,
      doriRate: selectedType === 'Tag Kit' || doriOption === 'none' ? 0 : 0.20,
      plastic: plasticValue,
      plasticRate: selectedType === 'Tag Kit' || plasticOption === 'none' ? 0 : 0.10,
      image: orderImage || 'https://placehold.co/120x120/1e293b/ffffff?text=' + encodeURIComponent(selectedType),
      quantity: quantityNum,
      unitPrice: rateNum,
      total: itemTotal
    };
  }, [
    selectedType,
    selectedMaterial,
    selectedCatalogId,
    isMultiCard,
    tagCards,
    singleCardDimension,
    availableCatalogs,
    doriOption,
    doriCustom,
    plasticOption,
    plasticCustom,
    qty,
    rate,
    brandName,
    currentCustomerItemCode,
    orderImage
  ]);

  // Add Item to Staged Items (Optional for multi-item orders)
  const handleAddItemToOrder = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateOrderForm()) {
      return;
    }

    setOrderItems(prev => [...prev, currentDraftItem]);

    // Reset fields for the next item
    setBrandName('');
    setOrderImage('');
    setSingleCardDimension('');
    const defaultType = availableTypes[0];
    setSelectedType(defaultType?.name || 'Tag');
    setSelectedMaterial(defaultType?.materials[0] || '100 GSM');
    setSelectedCatalogId(availableCatalogs[0]?.id || 'CAT-IV350');
    setIsMultiCard(false);
    setTagCards([
      { id: 1, title: 'Tag 1 (Base Tag)', catalogId: availableCatalogs[0]?.id || 'CAT-IV350', dimension: '' },
      { id: 2, title: 'Tag 2 (Upper Tag)', catalogId: availableCatalogs[1]?.id || 'CAT-KF280', dimension: '' }
    ]);
    setQty(0);
    setRate(0);
    setDoriOption('reg');
    setDoriCustom('');
    setPlasticOption('reg');
    setPlasticCustom('');
    setCurrentStep(1);
    setStepValidationErrors({});

    const fileInput = document.getElementById('customer-file-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleRemoveOrderItem = (id) => {
    setOrderItems(prev => prev.filter(i => i.id !== id));
  };

  // Duplicate rejected order into new order draft
  const handleDuplicateOrder = (rejectedOrder) => {
    if (!rejectedOrder || !rejectedOrder.items) return;
    const clonedItems = rejectedOrder.items.map((item, idx) => ({
      ...item,
      id: 'ITEM-' + Date.now().toString().slice(-4) + '-' + idx
    }));
    setOrderItems(clonedItems);
    setBrandName(rejectedOrder.items[0]?.brandName || rejectedOrder.customerCompany || '');
    setOrderNotes(`Re-order following rejected order #${rejectedOrder.id}`);

    const first = rejectedOrder.items[0];
    if (first) {
      setSelectedType(first.type || 'Tag');
      setSelectedMaterial(first.material || '');
      if (first.catalogId) setSelectedCatalogId(first.catalogId);
      setIsMultiCard(!!first.isMultiCard);
      if (first.cards && first.cards.length > 0) {
        setTagCards(first.cards.map((c, i) => ({
          id: i + 1,
          title: i === 0 ? 'Tag 1 (Base Tag)' : i === 1 ? 'Tag 2 (Upper Tag)' : (c.title || `Tag ${i + 1} (Overlay Tag)`),
          catalogId: c.catalogId,
          dimension: c.dimension || ''
        })));
      }
      if (first.dori && first.dori.startsWith('Custom:')) {
        setDoriOption('custom');
        setDoriCustom(first.dori.replace('Custom:', '').trim());
      } else {
        setDoriOption('reg');
        setDoriCustom('');
      }
      if (first.plastic && first.plastic.startsWith('Custom:')) {
        setPlasticOption('custom');
        setPlasticCustom(first.plastic.replace('Custom:', '').trim());
      } else {
        setPlasticOption('reg');
        setPlasticCustom('');
      }
      setQty(first.quantity || 0);
      setRate(first.unitPrice || 0);
      setOrderImage(first.image || '');
    }

    setCurrentStep(4);
    setActiveTab('place_order');
  };

  // Calculations (NO TAXES, Subtotal = Grand Total)
  const stagedTotal = orderItems.reduce((acc, i) => acc + i.total, 0);
  const draftTotal = (Number(qty) || 0) * (Number(rate) || 0);
  const grandTotal = stagedTotal + (orderItems.length > 0 && (!brandName.trim() || Number(qty) <= 0) ? 0 : draftTotal);

  // Submit Final Order (Prevent duplicates with isSubmitting)
  const handleSubmitFinalOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return;

    if (!validateOrderForm()) {
      return;
    }

    let itemsToSubmit = [...orderItems];
    if (brandName.trim() && Number(qty) > 0 && Number(rate) > 0) {
      itemsToSubmit.push(currentDraftItem);
    }

    if (itemsToSubmit.length === 0) {
      setStepValidationErrors({ qty: 'Please specify quantity and rate before placing order.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderId = 'ORD-2026-' + Math.floor(1000 + Math.random() * 9000);
      const nowIso = new Date().toISOString();
      const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      const orderGrandTotal = itemsToSubmit.reduce((acc, i) => acc + i.total, 0);

      const newOrder = {
        id: orderId,
        orderType: orderType || 'New Order',
        customerId: customer.id,
        customerName: customer.name,
        customerCompany: customer.company || itemsToSubmit[0]?.brandName || brandName.trim(),
        customerEmail: customer.email,
        customerPhone: customer.phone,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: nowIso,
        expectedDelivery: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
        assignedTo: 'Unassigned',
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
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          total: i.total
        })),
        subtotal: orderGrandTotal,
        tax: 0,
        shipping: 0,
        total: orderGrandTotal,
        tracking: {
          carrier: 'Courier Pending',
          trackingNumber: 'Awaiting Manufacturing Approval',
          status: 'Order Placed - Awaiting Confirmation',
          lastUpdate: formattedDate
        },
        timeline: [
          {
            stage: 'pending',
            title: 'Order Placed',
            description: `Manufacturing order booked by ${customer.name} (${itemsToSubmit.length} item(s)).`,
            timestamp: formattedDate,
            author: customer.name
          }
        ],
        internalNotes: [],
        customerNotes: orderNotes
      };

      onSaveOrder(newOrder);

      // Always save new brand name(s) after order is submitted
      for (const item of itemsToSubmit) {
        if (item.brandName && item.brandName.trim()) {
          await saveCustomerBrand(item.brandName.trim());
        }
      }
      if (brandName && brandName.trim()) {
        await saveCustomerBrand(brandName.trim());
      }

      // Reset state after successful submission
      setOrderItems([]);
      setOrderNotes('');
      setBrandName('');
      setOrderImage('');
      setSingleCardDimension('');
      setQty(0);
      setRate(0);
      setDoriOption('reg');
      setDoriCustom('');
      setPlasticOption('reg');
      setPlasticCustom('');
      setCurrentStep(1);
      setStepValidationErrors({});

      alert(`Order ${orderId} placed successfully!`);
      setActiveTab('order_register');
    } catch (err) {
      console.error('Error placing order:', err);
      alert('An error occurred while placing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Order Modal (Allowed before admin approval)
  const handleOpenEditModal = (order) => {
    setEditingOrder(order);
    const item = order.items[0] || {};
    setEditBrandName(item.brandName || order.customerCompany || '');
    setEditSelectedType(item.type || 'Tag');
    setEditSelectedMaterial(item.material || '100 GSM');
    
    if (item.dori && item.dori.startsWith('Custom:')) {
      setEditDoriOption('custom');
      setEditDoriCustom(item.dori.replace('Custom:', '').trim());
    } else {
      setEditDoriOption('reg');
      setEditDoriCustom('');
    }

    if (item.plastic && item.plastic.startsWith('Custom:')) {
      setEditPlasticOption('custom');
      setEditPlasticCustom(item.plastic.replace('Custom:', '').trim());
    } else {
      setEditPlasticOption('reg');
      setEditPlasticCustom('');
    }

    setEditQty(item.quantity || 0);
    setEditRate(item.unitPrice || 0);
    setEditOrderImage(item.image || '');
    setEditNotes(order.customerNotes || '');
  };

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditOrderImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveOrderEdits = (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (!editBrandName.trim()) return alert('Please enter Brand Name.');
    if (!editQty || Number(editQty) <= 0) return alert('Please enter a valid quantity.');
    if (!editRate || Number(editRate) <= 0) return alert('Please enter a valid rate.');
    if (editDoriOption === 'custom' && !editDoriCustom.trim()) return alert('Please enter the custom Dori specification.');
    if (editPlasticOption === 'custom' && !editPlasticCustom.trim()) return alert('Please enter the custom Plastic specification.');

    const doriValue = editDoriOption === 'custom' ? `Custom: ${editDoriCustom.trim()}` : 'Reg.';
    const plasticValue = editPlasticOption === 'custom' ? `Custom: ${editPlasticCustom.trim()}` : 'Reg.';
    const itemTotal = Number(editQty) * Number(editRate);

    const prevItem = editingOrder.items[0] || {};
    const existingCode = prevItem.itemCode || prevItem.name || currentCustomerItemCode;

    const updatedItem = {
      id: prevItem.id || ('ITEM-' + Date.now().toString().slice(-4)),
      itemCode: existingCode,
      name: existingCode,
      brandName: editBrandName.trim(),
      type: editSelectedType,
      material: editSelectedMaterial,
      dori: doriValue,
      plastic: plasticValue,
      image: editOrderImage || editingOrder.items[0]?.image || '',
      quantity: Number(editQty),
      unitPrice: Number(editRate),
      total: itemTotal
    };

    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const updatedOrder = {
      ...editingOrder,
      customerCompany: editBrandName.trim(),
      customerNotes: editNotes,
      items: [updatedItem],
      subtotal: itemTotal,
      total: itemTotal,
      timeline: [
        ...(editingOrder.timeline || []),
        {
          stage: editingOrder.status,
          title: 'Order Edited by Customer',
          description: `Updated by ${customer.name} (Qty: ${editQty}, Rate: ₹${editRate}).`,
          timestamp: formattedDate,
          author: customer.name
        }
      ]
    };

    if (onUpdateOrder) {
      onUpdateOrder(updatedOrder);
    }
    setEditingOrder(null);
    alert(`Order ${editingOrder.id} updated successfully!`);
  };

  // Chat message send
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const formattedTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: 'MSG-' + Date.now().toString().slice(-4),
      sender: customer.name,
      text: chatInput.trim(),
      timestamp: formattedTime,
      isCustomer: true
    };

    const updatedThread = {
      ...customerThread,
      messages: [...(customerThread.messages || []), newMsg]
    };

    onSaveMessage(updatedThread);
    setChatInput('');
  };

  // 7 Customer Tabs
  const customerTabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'place_order', label: 'Place Order' },
    { key: 'order_register', label: 'Order Register' },
    { key: 'invoice_register', label: 'Invoice Register' },
    { key: 'outstanding_ledger', label: 'Outstanding Ledger' },
    { key: 'general_ledger', label: 'General Ledger' },
    { key: 'chat', label: 'Chat with Acc Manager' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Minimized Compact Bar (when not on dashboard or manually minimized) */}
      {bannerMinimized ? (
        <div className="bg-white rounded-2xl px-4 py-2.5 text-slate-800 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3 animate-fade-in sticky top-16 z-30">
          {/* Navigation Tabs (Sleek row) */}
          <div className="flex items-center space-x-1 overflow-x-auto py-0.5 scrollbar-none flex-1 min-w-[280px]">
            {customerTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Balance & expand toggle */}
          <div className="flex items-center space-x-2 shrink-0">
            {outstandingLedger.totalOutstanding > 0 && (
              <span className="text-[11px] bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-lg font-mono font-semibold hidden sm:inline">
                Due: {formatCurrency(outstandingLedger.totalOutstanding)}
              </span>
            )}

            {activeTab !== 'place_order' && (
              <button
                onClick={() => setActiveTab('place_order')}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all"
              >
                + Place Order
              </button>
            )}

            <button
              onClick={() => setBannerMinimized(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 transition-all"
              title="Expand full customer banner"
            >
              Expand
            </button>
          </div>
        </div>
      ) : (
        /* Full Hero Banner (on Dashboard or when manually expanded) */
        <div className="bg-white rounded-2xl p-6 text-slate-800 shadow-xs border border-slate-200 relative animate-fade-in">
          {/* Minimize Toggle in Top Right */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <button
              onClick={() => setBannerMinimized(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 transition-all"
              title="Minimize header banner to save screen space"
            >
              Minimize
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-16 sm:pr-24">
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 mb-1">
                Client Portal
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {customer.company}
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Client: {customer.name} &bull; Account Manager: <span className="text-slate-800 font-semibold">{customerThread.accountManager}</span>
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Outstanding Balance</span>
              <span className="text-lg font-bold font-mono text-slate-900">{formatCurrency(outstandingLedger.totalOutstanding)}</span>
            </div>
          </div>

          {/* Modular Navigation Bar */}
          <div className="flex items-center space-x-1.5 mt-5 pt-4 border-t border-slate-100 overflow-x-auto">
            {customerTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 0: CUSTOMER DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Orders */}
            <div 
              onClick={() => {
                setOrderStatusFilter('all');
                setActiveTab('order_register');
              }}
              className="bg-white border border-slate-200/90 hover:border-slate-400 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {customerStats.totalOrders}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                <span>{customerStats.pendingOrders} Pending</span> &bull; <span>{customerStats.deliveredOrders} Delivered</span>
              </div>
            </div>

            {/* 2. Total Business Spend */}
            <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Order Value</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {formatCurrency(customerStats.totalSpend)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Manufacturing volume booked
              </div>
            </div>

            {/* 3. Outstanding Dues */}
            <div 
              onClick={() => setActiveTab('outstanding_ledger')}
              className="bg-white border border-slate-200/90 hover:border-slate-400 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Dues</div>
              <div className={`text-2xl sm:text-3xl font-extrabold mt-2 font-mono ${
                customerStats.totalOutstanding > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}>
                {formatCurrency(customerStats.totalOutstanding)}
              </div>
              <div className="text-xs mt-1">
                {customerStats.totalOutstanding > 0 ? (
                  <span className="text-amber-700 font-semibold">{customerStats.unpaidInvoicesCount} unpaid bill(s) &rarr;</span>
                ) : (
                  <span className="text-slate-500 font-medium">Account fully settled</span>
                )}
              </div>
            </div>

            {/* 4. Active in Production / Dispatched */}
            <div 
              onClick={() => {
                setOrderStatusFilter('in_production');
                setActiveTab('order_register');
              }}
              className="bg-white border border-slate-200/90 hover:border-slate-400 p-5 rounded-2xl shadow-xs transition-all cursor-pointer group"
            >
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Production / Transit</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                {customerStats.activeOrders}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {customerStats.inProdOrders} in machine &bull; {customerStats.shippedOrders} dispatched
              </div>
            </div>
          </div>

          {/* Interactive Manufacturing Pipeline Status Tracker */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs text-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Manufacturing Stage Tracker
                </h3>
                <p className="text-xs text-slate-500">Click any stage to filter the Order Register.</p>
              </div>
              <span className="text-xs text-slate-600 font-mono font-semibold bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                {customerOrders.length} Total Orders Tracked
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3">
              {[
                { step: '01', key: 'pending', label: 'Pending Approval', count: customerStats.pendingOrders },
                { step: '02', key: 'approved', label: 'Approved', count: customerStats.approvedOrders },
                { step: '03', key: 'in_production', label: 'In Production', count: customerStats.inProdOrders },
                { step: '04', key: 'ready_dispatch', label: 'Ready / QC', count: customerStats.readyOrders },
                { step: '05', key: 'shipped', label: 'Dispatched', count: customerStats.shippedOrders },
                { step: '06', key: 'delivered', label: 'Delivered', count: customerStats.deliveredOrders }
              ].map(stg => (
                <div
                  key={stg.key}
                  onClick={() => {
                    setOrderStatusFilter(stg.key);
                    setActiveTab('order_register');
                  }}
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

          {/* Main Grid: Recent Orders (Left) & Quick Actions / Financial Summary (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Recent Manufacturing Orders */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Recent Orders
                  </h3>
                  <p className="text-xs text-slate-500">Latest manufacturing orders submitted by your company.</p>
                </div>
                <button
                  onClick={() => {
                    setOrderStatusFilter('all');
                    setActiveTab('order_register');
                  }}
                  className="text-xs text-slate-700 hover:text-slate-900 font-semibold hover:underline flex items-center space-x-1"
                >
                  <span>View Full Register ({customerOrders.length})</span>
                  <span>&rarr;</span>
                </button>
              </div>

              {customerOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm font-medium text-slate-600">No orders placed yet.</p>
                  <button
                    onClick={() => setActiveTab('place_order')}
                    className="mt-3 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-all shadow-xs"
                  >
                    + Place Your First Order
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200 font-bold">
                      <tr>
                        <th className="py-3 px-3">Order ID</th>
                        <th className="py-3 px-3">Artwork</th>
                        <th className="py-3 px-3">Item / Brand</th>
                        <th className="py-3 px-3">Qty</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Amt</th>
                        <th className="py-3 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerOrders.slice(0, 5).map(order => {
                        const firstItem = order.items[0] || {};
                        const isEditable = !order.status || order.status === 'pending' || order.status === 'placed' || order.status === 'rejected';

                        return (
                          <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">
                              {order.id}
                              <div className="text-[10px] text-slate-400 font-normal">{formatDate(order.createdAt)}</div>
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
                              <div className="font-bold text-slate-900 text-xs">{firstItem.brandName || order.customerCompany}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{firstItem.itemCode || firstItem.type}</div>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-800">
                              {Number(firstItem.quantity || 0).toLocaleString()} pcs
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase inline-flex items-center space-x-1 ${
                                order.status === 'approved' || order.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                order.status === 'rejected' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                                order.status === 'in_production' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                                order.status === 'ready_dispatch' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                                order.status === 'shipped' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
                                order.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                <span>{order.status === 'pending' || order.status === 'placed' ? 'Pending' : order.status.replace(/_/g, ' ')}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              {formatCurrency(order.total)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {isEditable ? (
                                <button
                                  onClick={() => handleOpenEditModal(order)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded-lg text-[11px] font-medium shadow-xs transition-all"
                                >
                                  Edit
                                </button>
                              ) : (
                                <button
                                  onClick={() => onOpenInvoice(order)}
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
              )}
            </div>

            {/* Right Column: Quick Navigation Hub & Dedicated Support */}
            <div className="space-y-6">
              
              {/* Quick Actions Hub */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs text-slate-800 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">
                  Quick Shortcuts
                </h3>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => setActiveTab('place_order')}
                    className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl text-left transition-all group"
                  >
                    <div className="font-semibold text-xs">+ New Order</div>
                    <div className="text-[10px] text-slate-300 mt-0.5 leading-tight">Configure tags &amp; labels</div>
                  </button>

                  <button
                    onClick={() => {
                      setOrderStatusFilter('all');
                      setActiveTab('order_register');
                    }}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-800 p-3 rounded-xl text-left border border-slate-200 transition-all group"
                  >
                    <div className="font-semibold text-xs text-slate-900">Order Register</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Search &amp; edit orders</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('invoice_register')}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-800 p-3 rounded-xl text-left border border-slate-200 transition-all group"
                  >
                    <div className="font-semibold text-xs text-slate-900">Invoices</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Tax bills &amp; receipts</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('general_ledger')}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-800 p-3 rounded-xl text-left border border-slate-200 transition-all group"
                  >
                    <div className="font-semibold text-xs text-slate-900">Ledger (SOA)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">Statement of account</div>
                  </button>
                </div>
              </div>

              {/* Dedicated Support Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs text-slate-800 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200">
                    AM
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Account Manager</div>
                    <div className="font-bold text-slate-900 text-sm">{customerThread.accountManager || 'Parth'}</div>
                    <div className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Active &bull; Factory Support</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Need urgent revisions, custom sample approvals, or dispatch priority? Chat directly with your production account lead.
                </p>

                <button
                  onClick={() => setActiveTab('chat')}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2 rounded-lg border border-slate-200 transition-all flex items-center justify-center space-x-1"
                >
                  <span>Open Dedicated Chat</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODULE 1: PLACE ORDER (MODERN SALES ORDER UI - INLINE WITH TAGX REFERENCE) */}
      {activeTab === 'place_order' && (
        <div className="max-w-7xl mx-auto space-y-5 animate-fade-in pb-16">
          
          {/* Top Page Header (Matching TagX reference: New Sales Order / SO — place a customer order) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  New Sales Order
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                SO — place a customer order
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleSubmitFinalOrder}
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center space-x-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Placing Order...</span>
                ) : (
                  <>
                    <span>Place Order</span>
                    <span>✓</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Document Status / Draft Pill Bar */}
          <div className="flex items-center space-x-3 text-xs bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs">
            <div className="flex items-center space-x-1.5 font-medium text-slate-800">
              <span className="text-slate-400">📄</span>
              <span className="font-semibold">New Sales Order</span>
            </div>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-medium flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Draft saved just now</span>
            </span>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="text-slate-400 hover:text-rose-600 font-medium transition-colors cursor-pointer"
            >
              discard
            </button>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (8 cols): General Information & Items */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Card 1: General Information */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                  <span className="text-base text-slate-400">🗂️</span>
                  <h3 className="font-bold text-slate-900 text-sm">General Information</h3>
                </div>

                <div className="space-y-4">
                  {/* Order Type Radio Buttons (Mandatory) */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-2">
                      Order Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                      <label className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        orderType === 'New Order'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50/80 text-slate-700 border-slate-200/80 hover:bg-white hover:border-slate-300'
                      }`}>
                        <input
                          type="radio"
                          name="orderType"
                          value="New Order"
                          checked={orderType === 'New Order'}
                          onChange={(e) => {
                            setOrderType(e.target.value);
                            setRepeatSelectedItemCode('');
                            setRepeatSelectedItemName('');
                            setRepeatSearchQuery('');
                            if (stepValidationErrors.orderType) {
                              setStepValidationErrors(prev => ({ ...prev, orderType: null }));
                            }
                          }}
                          className="w-4 h-4 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
                          required
                        />
                        <span>New Order</span>
                      </label>

                      <label className={`flex items-center space-x-2.5 px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        orderType === 'Repeat Order'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50/80 text-slate-700 border-slate-200/80 hover:bg-white hover:border-slate-300'
                      }`}>
                        <input
                          type="radio"
                          name="orderType"
                          value="Repeat Order"
                          checked={orderType === 'Repeat Order'}
                          onChange={(e) => {
                            setOrderType(e.target.value);
                            if (stepValidationErrors.orderType) {
                              setStepValidationErrors(prev => ({ ...prev, orderType: null }));
                            }
                          }}
                          className="w-4 h-4 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
                          required
                        />
                        <span>Repeat Order</span>
                      </label>
                    </div>
                    {stepValidationErrors.orderType && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">
                        ⚠️ {stepValidationErrors.orderType}
                      </p>
                    )}
                  </div>

                  {/* Row: Order No and Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* 1. Order Number */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                        Order No
                      </label>
                      <div className="w-full bg-slate-100/70 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 flex items-center justify-between cursor-not-allowed select-none shadow-2xs">
                        <span>{orderType === 'Repeat Order' && repeatSelectedItemCode ? repeatSelectedItemCode : currentCustomerItemCode}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {orderType === 'Repeat Order' && repeatSelectedItemCode ? 'Selected Ref' : 'Auto-assigned'}
                        </span>
                      </div>
                    </div>

                    {/* 2. Date */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                        Date
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={new Date().toLocaleDateString('en-GB')}
                          className="w-full bg-slate-50/80 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-medium pr-8 cursor-not-allowed"
                        />
                        <span className="absolute right-3 top-2 text-slate-400 text-xs">📅</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Items */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-base text-slate-400">🏷️</span>
                    <h3 className="font-bold text-slate-900 text-sm">Items</h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium">
                    {orderItems.length + 1} Item(s) in Order
                  </span>
                </div>

                {/* ITEM 1 Container */}
                <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                  {/* Item Number Header & Repeat Selection */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      ITEM 1
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ref: {orderType === 'Repeat Order' && repeatSelectedItemCode ? repeatSelectedItemCode : currentDraftItemName}
                    </span>
                  </div>

                  {/* If Repeat Order: Customer MUST select an existing item */}
                  {orderType === 'Repeat Order' ? (
                    <div className="p-3.5 bg-slate-100/70 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800">
                          Select Previous Item to Reorder <span className="text-rose-500">*</span>
                        </label>
                        {repeatSelectedItemCode && (
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                              Loaded: {repeatSelectedItemCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setRepeatSelectedItemCode('');
                                setRepeatSelectedItemName('');
                                setRepeatSearchQuery('');
                              }}
                              className="text-[10px] text-slate-400 hover:text-rose-600 underline font-medium cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>

                      {customerPastItems.length > 0 ? (
                        <div className="relative">
                          <div className="relative">
                            <input
                              type="text"
                              name="ubms_repeat_item_search_input"
                              placeholder="Type to search previous item by code, brand, or name..."
                              value={repeatSearchQuery}
                              onFocus={() => setRepeatInputFocused(true)}
                              onChange={(e) => {
                                setRepeatSearchQuery(e.target.value);
                                setRepeatInputFocused(true);
                                if (!e.target.value.trim()) {
                                  setRepeatSelectedItemCode('');
                                  setRepeatSelectedItemName('');
                                }
                                if (stepValidationErrors.repeatSelectedItemCode) {
                                  setStepValidationErrors(prev => ({ ...prev, repeatSelectedItemCode: null }));
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => setRepeatInputFocused(false), 200);
                              }}
                              className={`w-full bg-white border ${stepValidationErrors.repeatSelectedItemCode ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-slate-400'} rounded-xl px-3.5 py-2.5 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 font-medium shadow-2xs transition-all`}
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                              data-lpignore="true"
                              data-form-type="other"
                            />
                            {repeatSearchQuery && (
                              <button
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setRepeatSearchQuery('');
                                  setRepeatSelectedItemCode('');
                                  setRepeatSelectedItemName('');
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                                title="Clear search"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          {/* Custom Non-Intrusive Autocomplete Dropdown */}
                          {repeatInputFocused && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 max-h-60 overflow-y-auto">
                              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                                <span>Previous Order Items</span>
                                <span>{filteredRepeatItems.length} found</span>
                              </div>
                              {filteredRepeatItems.length > 0 ? (
                                filteredRepeatItems.map((item, idx) => {
                                  const code = item.itemCode || item.name;
                                  const isSelected = repeatSelectedItemCode === code;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelectRepeatItem(code);
                                        setRepeatInputFocused(false);
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
                                            {(item.type || 'ITM').slice(0, 3).toUpperCase()}
                                          </div>
                                        )}
                                        <div className="min-w-0">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-mono font-bold text-xs text-slate-900 truncate">
                                              {item.name || code}
                                            </span>
                                            {code && code !== item.name && (
                                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                                {code}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[11px] text-slate-500 truncate flex items-center space-x-1.5 mt-0.5">
                                            <span className="font-semibold text-slate-700">{item.brandName || 'No Brand'}</span>
                                            <span>•</span>
                                            <span className="text-slate-600">{item.type}</span>
                                            {item.material && (
                                              <>
                                                <span>•</span>
                                                <span className="text-slate-500">{item.material}</span>
                                              </>
                                            )}
                                            {item.unitPrice ? (
                                              <>
                                                <span>•</span>
                                                <span className="text-emerald-700 font-semibold font-mono">₹{item.unitPrice}/pc</span>
                                              </>
                                            ) : null}
                                          </div>
                                        </div>
                                      </div>
                                      <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded font-mono font-semibold shrink-0 ml-2">
                                        {isSelected ? '✓ Loaded' : 'Select ↵'}
                                      </span>
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="px-4 py-3 text-xs text-slate-500 text-center">
                                  No previous items matching "{repeatSearchQuery}"
                                </div>
                              )}
                            </div>
                          )}

                          {stepValidationErrors.repeatSelectedItemCode && (
                            <p className="text-[11px] text-rose-600 font-medium mt-1">
                              ⚠️ {stepValidationErrors.repeatSelectedItemCode}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                          No previous items found in your account history. You can place this as a New Order or enter brand details below.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs shadow-2xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 font-medium text-[11px]">Item Name:</span>
                        <span className="font-mono font-bold text-slate-900">{currentDraftItemName}</span>
                        <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          Auto-generated
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[11px]">
                        <span>Item Code:</span>
                        <span className="font-semibold text-slate-700">{currentCustomerItemCode}</span>
                      </div>
                    </div>
                  )}

                  {/* Row: Brand Name, Category, Pieces */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    {/* 1. Brand Name (sm:col-span-5) */}
                    <div className="sm:col-span-5 relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Brand Name <span className="text-rose-500">*</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        name="ubms_brand_input_field"
                        placeholder="Type to search or enter brand..."
                        value={brandName}
                        onFocus={() => setBrandInputFocused(true)}
                        onChange={(e) => {
                          setBrandName(e.target.value);
                          setBrandInputFocused(true);
                          if (stepValidationErrors.brandName) {
                            setStepValidationErrors(prev => ({ ...prev, brandName: null }));
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setBrandInputFocused(false), 200);
                        }}
                        className={`w-full bg-white border ${stepValidationErrors.brandName ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200/80 focus:ring-slate-400'} rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 font-medium shadow-2xs transition-all`}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        data-form-type="other"
                      />

                      {/* Custom Non-Intrusive Autocomplete Dropdown */}
                      {brandInputFocused && customerSavedBrands.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 max-h-48 overflow-y-auto">
                          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                            Saved Brand Suggestions
                          </div>
                          {customerSavedBrands
                            .filter(b => !brandName.trim() || b.toLowerCase().includes(brandName.trim().toLowerCase()))
                            .map((b, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setBrandName(b);
                                  setBrandInputFocused(false);
                                  if (stepValidationErrors.brandName) {
                                    setStepValidationErrors(prev => ({ ...prev, brandName: null }));
                                  }
                                }}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer border-b border-slate-50 last:border-0"
                              >
                                <span className="font-semibold text-slate-900">{b}</span>
                                <span className="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded font-mono">Select ↵</span>
                              </button>
                            ))}
                        </div>
                      )}



                      {stepValidationErrors.brandName && (
                        <p className="text-[11px] text-rose-600 font-medium mt-1">
                          ⚠️ {stepValidationErrors.brandName}
                        </p>
                      )}
                    </div>

                    {/* 2. Category (sm:col-span-3) */}
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedType}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium shadow-2xs"
                      >
                        {availableTypes.map(t => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Pieces (sm:col-span-4) */}
                    <div className="sm:col-span-4">
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Pieces
                      </label>
                      {(selectedType === 'Tag' || selectedType === 'Tag Kit') ? (
                        <select
                          value={isMultiCard ? (tagCards.length === 3 ? '3 PC' : '2 PC') : '1 PC'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '1 PC') {
                              setIsMultiCard(false);
                            } else if (val === '2 PC') {
                              setIsMultiCard(true);
                              if (tagCards.length > 2) handleRemoveThirdCard();
                            } else if (val === '3 PC') {
                              setIsMultiCard(true);
                              if (tagCards.length < 3) handleAddThirdCard();
                            }
                          }}
                          className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium shadow-2xs"
                        >
                          <option value="1 PC">1 PC (Single Card Tag)</option>
                          <option value="2 PC">2 PC (Multi-Card Tag Set)</option>
                          <option value="3 PC">3 PC (3-Card Tag Set)</option>
                        </select>
                      ) : (
                        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium shadow-2xs">
                          1 PC (Standard)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specifications (Tag Paper Catalog OR PU Quality / Origin) */}
                  <div className="pt-2 border-t border-slate-200/60">
                    {(selectedType === 'Tag' || selectedType === 'Tag Kit') ? (
                      /* Tag or Tag Kit Selected -> Paper Catalog */
                      !isMultiCard ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Paper Catalog <span className="text-rose-500">*</span>
                            </label>
                            <select
                              value={selectedCatalogId}
                              onChange={(e) => {
                                setSelectedCatalogId(e.target.value);
                                if (stepValidationErrors.selectedCatalogId) {
                                  setStepValidationErrors(prev => ({ ...prev, selectedCatalogId: null }));
                                }
                              }}
                              className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium shadow-2xs"
                            >
                              {availableCatalogs.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.code} — {cat.gsm} GSM ({cat.finish})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                              Tag Dimensions / Finished Size (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 50 x 90 mm or 55 x 110 mm"
                              value={singleCardDimension}
                              onChange={(e) => setSingleCardDimension(e.target.value)}
                              className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium shadow-2xs"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Multi-Card Tag Configuration */
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              Multi-Tag Configuration ({tagCards.length} Tags)
                            </span>
                            {tagCards.length < 3 && (
                              <button
                                type="button"
                                onClick={handleAddThirdCard}
                                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
                              >
                                + Add 3rd Tag
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {tagCards.map((card, idx) => (
                              <div key={card.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800">
                                    {card.title}
                                  </span>
                                  {idx === 2 && (
                                    <button
                                      type="button"
                                      onClick={handleRemoveThirdCard}
                                      className="text-rose-600 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                                    >
                                      &times; Remove
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                                      Paper Catalog
                                    </label>
                                    <select
                                      value={card.catalogId}
                                      onChange={(e) => handleUpdateCardCatalog(idx, e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                                    >
                                      {availableCatalogs.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                          {cat.code} — {cat.gsm} GSM
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
                                      onChange={(e) => handleUpdateCardDimension(idx, e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 font-medium"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ) : (
                      /* PU Label Selected -> Indian or Imported */
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                            PU Quality / Origin <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => setPuOrigin('Indian')}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                puOrigin === 'Indian'
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              Indian
                            </button>
                            <button
                              type="button"
                              onClick={() => setPuOrigin('Imported')}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                puOrigin === 'Imported'
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              Imported
                            </button>
                          </div>
                        </div>

                        {puOrigin === 'Indian' ? (
                          <div>
                            <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                              Thickness (mm) <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex items-center space-x-2">
                              {['1.2', '1.8', '2.2'].map(val => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setPuThickness(val)}
                                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                                    puThickness === val
                                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {val} mm
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="text-xs font-semibold text-slate-800">
                              Imported PU — Single Quality Standard (no thickness options needed)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Handwork Attachments (Optional) - Not applicable for Tag Kit */}
                  {selectedType !== 'Tag Kit' && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="flex items-center space-x-2 mb-2">
                      <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                        Handwork Attachments
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Dori */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">Dori (String)</span>
                          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setDoriOption('none');
                                setDoriCustom('');
                              }}
                              className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                                doriOption === 'none' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              None
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDoriOption('reg');
                                setDoriCustom('');
                              }}
                              className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                                doriOption === 'reg' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Reg. (₹0.20)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDoriOption('custom')}
                              className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                                doriOption === 'custom' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Custom
                            </button>
                          </div>
                        </div>
                        {doriOption === 'custom' && (
                          <input
                            type="text"
                            placeholder="Specify custom dori (e.g. Waxed Cotton / Satin string)"
                            value={doriCustom}
                            onChange={(e) => setDoriCustom(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 font-medium"
                          />
                        )}
                      </div>

                      {/* Barcode Plastic */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">Barcode Plastic</span>
                          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setPlasticOption('none');
                                setPlasticCustom('');
                              }}
                              className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                                plasticOption === 'none' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              None
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPlasticOption('reg');
                                setPlasticCustom('');
                              }}
                              className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                                plasticOption === 'reg' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Reg. (₹0.10)
                            </button>
                            <button
                              type="button"
                              onClick={() => setPlasticOption('custom')}
                              className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                                plasticOption === 'custom' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Custom
                            </button>
                          </div>
                        </div>
                        {plasticOption === 'custom' && (
                          <input
                            type="text"
                            placeholder="Specify custom barcode plastic (e.g. Embossed Square Seal / Black matte)"
                            value={plasticCustom}
                            onChange={(e) => setPlasticCustom(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 font-medium"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  )}

                  {/* Commercials: Quantity, Rate (Increased size, suggestions removed, subtotal removed) */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2.5">
                      Commercials
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                          Quantity (Pcs) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 5000"
                          value={qty || ''}
                          onChange={(e) => {
                            setQty(e.target.value);
                            if (stepValidationErrors.qty) setStepValidationErrors(prev => ({ ...prev, qty: null }));
                          }}
                          className={`w-full bg-slate-50 hover:bg-white focus:bg-white border ${stepValidationErrors.qty ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-4 py-2.5 text-sm sm:text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400`}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-800 block mb-1.5">
                          Applicable Rate (₹/pc) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          placeholder="e.g. 3.50"
                          value={rate || ''}
                          onChange={(e) => {
                            setRate(e.target.value);
                            if (stepValidationErrors.rate) setStepValidationErrors(prev => ({ ...prev, rate: null }));
                          }}
                          className={`w-full bg-slate-50 hover:bg-white focus:bg-white border ${stepValidationErrors.rate ? 'border-rose-400' : 'border-slate-200'} rounded-xl px-4 py-2.5 text-sm sm:text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400`}
                        />
                        <span className="text-[11px] text-slate-400 mt-1 block">Production agreed unit price</span>
                      </div>
                    </div>
                  </div>

                  {/* Special Order Remarks */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Special Order Remarks / Packaging Instructions (Optional)
                    </label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Cut & fold preference, bundle packaging in 100s, urgent dispatch deadline..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium shadow-2xs"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (4 cols): Default Artwork & Commercial Summary */}
            <div className="lg:col-span-4 space-y-6 sticky top-20">
              
              {/* Card 1: Default Artwork (Exact match to TagX reference) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base text-slate-400">🖼️</span>
                  <h3 className="font-bold text-slate-900 text-sm">Default Artwork</h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Used for any item that doesn't have its own image. Add a per-item image on each item above to override this.
                </p>

                {/* Minimalist Dropzone */}
                {!orderImage ? (
                  <div className="bg-slate-50/70 hover:bg-slate-50 border-2 border-dashed border-slate-200/80 rounded-2xl p-8 min-h-[220px] flex flex-col items-center justify-center text-center relative group transition-all cursor-pointer">
                    <input
                      id="customer-file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700 text-2xl font-light mb-2 group-hover:scale-105 transition-transform">
                      +
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      Upload or drag &amp; drop
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supports JPG, PNG, WEBP (Max 25MB)
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="relative group max-h-48 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
                      <img
                        src={orderImage}
                        alt="Order Artwork"
                        className="max-h-44 w-full object-contain p-2"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[11px] font-semibold text-emerald-700">✓ Uploaded &amp; Ready</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowCropModal(true)}
                          className="text-slate-700 hover:text-slate-900 font-semibold underline text-[11px] cursor-pointer"
                        >
                          Crop
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setShowFullImageModal(true)}
                          className="text-slate-700 hover:text-slate-900 font-semibold text-[11px] cursor-pointer"
                        >
                          View
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setOrderImage('')}
                          className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Commercial Summary & Submit */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Commercial Summary</h3>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                    {currentCustomerItemCode}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Brand:</span>
                    <span className="font-semibold text-slate-900 text-right">{brandName || '—'}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Item Name:</span>
                    <span className="font-semibold text-slate-900 text-right font-mono text-[11px]">{orderType === 'Repeat Order' && repeatSelectedItemCode ? (repeatSelectedItemName || repeatSelectedItemCode) : currentDraftItemName}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Item Code:</span>
                    <span className="font-semibold text-slate-700 text-right font-mono text-[11px]">{orderType === 'Repeat Order' && repeatSelectedItemCode ? repeatSelectedItemCode : currentCustomerItemCode}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Product:</span>
                    <span className="font-semibold text-slate-900 text-right">{selectedType}</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Format:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {(selectedType === 'Tag' || selectedType === 'Tag Kit') ? (isMultiCard ? `${tagCards.length}-Piece ${selectedType}` : `Single ${selectedType}`) : 'Standard'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Quantity:</span>
                    <span className="font-semibold font-mono text-slate-900 text-right">{Number(qty || 0).toLocaleString()} pcs</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Rate:</span>
                    <span className="font-semibold font-mono text-slate-900 text-right">{formatCurrency(Number(rate || 0))}/pc</span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Subtotal:</span>
                    <span className="font-semibold font-mono text-slate-900 text-right">{formatCurrency((Number(qty) || 0) * (Number(rate) || 0))}</span>
                  </div>
                  {selectedType !== 'Tag Kit' ? (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-slate-500 text-[11px]">Handwork:</span>
                      <span className="text-[11px] text-slate-600 text-right">
                        Dori ({doriOption === 'none' ? 'None' : doriOption === 'custom' ? 'Custom' : '₹0.20'}) | Barcode Plastic ({plasticOption === 'none' ? 'None' : plasticOption === 'custom' ? 'Custom' : '₹0.10'})
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-slate-500 text-[11px]">Handwork:</span>
                      <span className="text-[11px] text-slate-400 text-right">
                        None (Not included in Tag Kit)
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 text-[11px]">Taxes &amp; Surcharges:</span>
                    <span className="text-[11px] text-emerald-700 font-semibold text-right">₹0.00 (Zero Added)</span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Grand Total:</span>
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Final Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmitFinalOrder}
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Placing Order...</span>
                  ) : (
                    <>
                      <span>Place Order</span>
                      <span>✓</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                  Orders are instantly transmitted for factory scheduling and prepress proofing.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* MODULE 2: ORDER REGISTER */}
      {activeTab === 'order_register' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Customer Order Register</h3>
                <p className="text-xs text-slate-500">Complete registry of manufacturing orders. Orders can be edited until approved by admin.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Filter option for order status */}
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Status:</span>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-transparent text-xs text-slate-800 font-semibold outline-none cursor-pointer pr-1"
                  >
                    <option value="all" className="bg-white text-slate-800">All Statuses ({customerOrders.length})</option>
                    <option value="pending" className="bg-white text-slate-800">Pending Approval ({customerOrders.filter(o => o.status === 'pending' || o.status === 'placed').length})</option>
                    <option value="approved" className="bg-white text-slate-800">Approved ({customerOrders.filter(o => o.status === 'approved' || o.status === 'confirmed').length})</option>
                    <option value="in_production" className="bg-white text-slate-800">In Production ({customerOrders.filter(o => o.status === 'in_production').length})</option>
                    <option value="ready_dispatch" className="bg-white text-slate-800">Ready / QC ({customerOrders.filter(o => o.status === 'ready_dispatch').length})</option>
                    <option value="shipped" className="bg-white text-slate-800">Dispatched ({customerOrders.filter(o => o.status === 'shipped').length})</option>
                    <option value="delivered" className="bg-white text-slate-800">Delivered ({customerOrders.filter(o => o.status === 'delivered').length})</option>
                    <option value="rejected" className="bg-white text-slate-800">Rejected ({customerOrders.filter(o => o.status === 'rejected').length})</option>
                  </select>
                </div>

                {(orderStatusFilter !== 'all' || searchBrandSpecs || searchDoriPlastic || searchQty || searchRate) && (
                  <button
                    onClick={() => {
                      setOrderStatusFilter('all');
                      setSearchBrandSpecs('');
                      setSearchDoriPlastic('');
                      setSearchQty('');
                      setSearchRate('');
                    }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors font-medium flex items-center space-x-1"
                    title="Reset all search and status filters"
                  >
                    <span>Clear Filters</span>
                  </button>
                )}

                <span className="text-xs text-slate-700 font-mono bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
                  {filteredCustomerOrders.length} of {customerOrders.length} Order(s)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-y border-slate-200 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Order ID</th>
                    <th className="py-3 px-4 font-semibold">Artwork</th>
                    <th className="py-3 px-4 font-semibold">Brand &amp; Item Specs</th>
                    <th className="py-3 px-4 font-semibold">Dori &amp; Plastic</th>
                    <th className="py-3 px-4 font-semibold">Qty</th>
                    <th className="py-3 px-4 font-semibold">Rate</th>
                    <th className="py-3 px-4 text-right font-semibold">Amt</th>
                    <th className="py-3 px-4 text-center font-semibold">Action</th>
                  </tr>
                  {/* Individual search bar below brand and item spec | dori plastic | qty | rate */}
                  <tr className="bg-slate-50/70 border-b border-slate-200">
                    <th className="py-2.5 px-4 font-normal"></th>
                    <th className="py-2.5 px-4 font-normal"></th>
                    {/* Search: Brand & Item Specs */}
                    <th className="py-2.5 px-4 font-normal">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchBrandSpecs}
                          onChange={(e) => setSearchBrandSpecs(e.target.value)}
                          placeholder="Search specs..."
                          className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors normal-case font-normal"
                        />
                        {searchBrandSpecs && (
                          <button
                            onClick={() => setSearchBrandSpecs('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                            title="Clear"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </th>
                    {/* Search: Dori Plastic */}
                    <th className="py-2.5 px-4 font-normal">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchDoriPlastic}
                          onChange={(e) => setSearchDoriPlastic(e.target.value)}
                          placeholder="Search dori / plastic..."
                          className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors normal-case font-normal"
                        />
                        {searchDoriPlastic && (
                          <button
                            onClick={() => setSearchDoriPlastic('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                            title="Clear"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </th>
                    {/* Search: Qty */}
                    <th className="py-2.5 px-4 font-normal">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQty}
                          onChange={(e) => setSearchQty(e.target.value)}
                          placeholder="Filter qty..."
                          className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors normal-case font-normal"
                        />
                        {searchQty && (
                          <button
                            onClick={() => setSearchQty('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                            title="Clear"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </th>
                    {/* Search: Rate */}
                    <th className="py-2.5 px-4 font-normal">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchRate}
                          onChange={(e) => setSearchRate(e.target.value)}
                          placeholder="Filter rate..."
                          className="w-full bg-white border border-slate-300 focus:border-slate-400 rounded-lg px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 outline-none transition-colors normal-case font-normal"
                        />
                        {searchRate && (
                          <button
                            onClick={() => setSearchRate('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                            title="Clear"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    </th>
                    <th className="py-2.5 px-4 font-normal"></th>
                    <th className="py-2.5 px-4 text-center font-normal">
                      {(searchBrandSpecs || searchDoriPlastic || searchQty || searchRate) && (
                        <button
                          onClick={() => {
                            setSearchBrandSpecs('');
                            setSearchDoriPlastic('');
                            setSearchQty('');
                            setSearchRate('');
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
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomerOrders.map(order => {
                    const firstItem = order.items[0] || {};
                    const isEditable = !order.status || order.status === 'pending' || order.status === 'placed' || order.status === 'rejected';

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. ORDER ID */}
                        <td className="py-4 px-4 align-top">
                          <div className="font-mono font-semibold text-slate-900 text-sm">{order.id}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{formatDate(order.createdAt)}</div>
                          <div className="mt-1.5">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase inline-flex items-center space-x-1 ${
                              order.status === 'approved' || order.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              order.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              order.status === 'in_production' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                              order.status === 'ready_dispatch' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              order.status === 'shipped' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              <span>
                                {order.status === 'pending' || order.status === 'placed' ? 'Pending' :
                                 order.status === 'approved' || order.status === 'confirmed' ? 'Approved' :
                                 order.status === 'rejected' ? 'Rejected' :
                                 (order.status || '').replace(/_/g, ' ')}
                              </span>
                            </span>
                          </div>
                        </td>

                        {/* 2. ARTWORK (LARGER SIZE WITH CLICK TO ENLARGE) */}
                        <td className="py-4 px-4 align-top">
                          {firstItem.image ? (
                            <div 
                              onClick={() => setPreviewArtworkUrl(firstItem.image)}
                              className="relative group cursor-pointer inline-block"
                              title="Click to view large artwork"
                            >
                              <img 
                                src={firstItem.image} 
                                alt="Artwork" 
                                className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-xs group-hover:border-slate-400 transition-all bg-slate-50" 
                              />
                              <div className="absolute inset-0 bg-slate-900/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                                Zoom
                              </div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                              No Art
                            </div>
                          )}
                        </td>

                        {/* 3. BRAND AND ITEM SPECS */}
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-semibold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                              {firstItem.itemCode || firstItem.name || 'ITEM'}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              {firstItem.brandName || order.customerCompany}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-medium text-[11px]">
                              {firstItem.type || 'Tag'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-medium">
                              {firstItem.material || 'Standard'}
                            </span>
                          </div>

                          {firstItem.isMultiCard && firstItem.cards && firstItem.cards.length > 0 && (
                            <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                              <span className="text-[10px] font-semibold text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded inline-block">
                                {firstItem.cards.length}-Card Set
                              </span>
                              <div className="text-[11px] text-slate-600 space-y-0.5">
                                {firstItem.cards.map((c, ci) => (
                                  <div key={ci} className="flex items-center space-x-1">
                                    <span className="text-slate-900 font-medium">• {c.title}:</span>
                                    <span className="text-slate-700">{c.catalogCode || c.name} ({c.gsm} GSM)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {order.status === 'rejected' && (
                            <div className="mt-2 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-rose-800 text-xs">
                              <span className="font-bold text-rose-700">Rejection Reason:</span> {order.rejectionReason || 'Please place a fresh order with revised specifications.'}
                            </div>
                          )}

                          {order.items.length > 1 && (
                            <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                              + {order.items.length - 1} more item(s)
                            </span>
                          )}
                        </td>

                        {/* 4. DORI PLASTIC */}
                        <td className="py-4 px-4 align-top text-xs space-y-1">
                          <div className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                            Dori: <strong>{firstItem.dori || 'Reg.'}</strong>
                          </div>
                          <div className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                            Plastic: <strong>{firstItem.plastic || 'Reg.'}</strong>
                          </div>
                        </td>

                        {/* 5. QTY */}
                        <td className="py-4 px-4 align-top">
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            {Number(firstItem.quantity || 0).toLocaleString()}
                          </div>
                          <span className="text-[11px] text-slate-400">pcs</span>
                        </td>

                        {/* 6. RATE */}
                        <td className="py-4 px-4 align-top font-mono font-medium text-slate-700 text-sm whitespace-nowrap">
                          {formatCurrency(firstItem.unitPrice || 0)}
                        </td>

                        {/* 7. AMT */}
                        <td className="py-4 px-4 align-top text-right">
                          <span className="font-bold text-slate-900 text-base font-mono whitespace-nowrap">
                            {formatCurrency(order.total)}
                          </span>
                        </td>

                        {/* 8. EDIT / RE-ORDER */}
                        <td className="py-4 px-4 align-top text-center">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            {order.status === 'rejected' ? (
                              <button
                                onClick={() => handleDuplicateOrder(order)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center justify-center space-x-1"
                                title="Duplicate order details into a new draft with new order number"
                              >
                                <span>Place New Order</span>
                              </button>
                            ) : isEditable ? (
                              <button
                                onClick={() => handleOpenEditModal(order)}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shadow-xs flex items-center space-x-1"
                                title="Edit order specifications"
                              >
                                <span>Edit</span>
                              </button>
                            ) : (
                              <span 
                                className="text-[11px] text-slate-500 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200" 
                                title="Order approved by admin. Editing locked."
                              >
                                <span>Locked</span>
                              </span>
                            )}

                            <button
                              onClick={() => onOpenInvoice(order)}
                              className="w-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-xl text-xs border border-slate-300 transition-colors flex items-center justify-center space-x-1 font-medium"
                              title="View Invoice & Receipt"
                            >
                              <span>Invoice</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCustomerOrders.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <div className="font-medium text-slate-700">No orders match your filter criteria</div>
                        <p className="text-xs text-slate-400 mt-1">Try clearing or adjusting the search bars or status filter.</p>
                        <button
                          onClick={() => {
                            setOrderStatusFilter('all');
                            setSearchBrandSpecs('');
                            setSearchDoriPlastic('');
                            setSearchQty('');
                            setSearchRate('');
                          }}
                          className="mt-3 inline-block px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-xl border border-slate-200"
                        >
                          Clear all filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 3: INVOICE REGISTER */}
      {activeTab === 'invoice_register' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-slate-800">
            <h3 className="font-extrabold text-slate-900 text-base mb-1">Customer Invoice Register</h3>
            <p className="text-xs text-slate-500 mb-4">Invoices issued against completed orders.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-600 bg-slate-50 border-y border-slate-200 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-bold">Invoice No</th>
                    <th className="py-3 px-4 font-bold">Order Ref</th>
                    <th className="py-3 px-4 font-bold">Issue Date</th>
                    <th className="py-3 px-4 font-bold">Invoice Total</th>
                    <th className="py-3 px-4 font-bold">Paid</th>
                    <th className="py-3 px-4 font-bold">Balance Due</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{inv.id}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{inv.orderId}</td>
                      <td className="py-3.5 px-4">{formatDate(inv.issueDate)}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{formatCurrency(inv.total)}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-bold">{formatCurrency(inv.paidAmount)}</td>
                      <td className="py-3.5 px-4 font-extrabold text-amber-700">{formatCurrency(inv.balanceDue)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            const linkedOrder = orders.find(o => o.id === inv.orderId) || { ...inv, priority: 'standard' };
                            onOpenInvoice(linkedOrder);
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                        >
                          Print / PDF
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

      {/* MODULE 4: OUTSTANDING LEDGER */}
      {activeTab === 'outstanding_ledger' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <span className="text-slate-500 text-xs font-bold block uppercase">Total Outstanding</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(outstandingLedger.totalOutstanding)}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <span className="text-slate-500 text-xs font-bold block uppercase">0 - 30 Days Aging</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(outstandingLedger.aging0to30)}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <span className="text-slate-500 text-xs font-bold block uppercase">31 - 60 Days Aging</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(outstandingLedger.aging31to60)}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <span className="text-slate-500 text-xs font-bold block uppercase">60+ Days Overdue</span>
              <div className="text-2xl font-black text-rose-700 mt-1">{formatCurrency(outstandingLedger.aging60Plus)}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-slate-800">
            <h3 className="font-extrabold text-slate-900 text-base mb-1">Unpaid Dues Breakdown</h3>
            <table className="w-full text-left text-xs text-slate-700 mt-3">
              <thead className="text-[11px] uppercase tracking-wider text-slate-600 bg-slate-50 border-y border-slate-200 rounded-xl">
                <tr>
                  <th className="py-3 px-4 font-bold">Invoice No</th>
                  <th className="py-3 px-4 font-bold">Issue Date</th>
                  <th className="py-3 px-4 font-bold">Due Date</th>
                  <th className="py-3 px-4 font-bold">Total Amount</th>
                  <th className="py-3 px-4 font-bold">Balance Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outstandingLedger.bills.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{b.id}</td>
                    <td className="py-3.5 px-4">{formatDate(b.issueDate)}</td>
                    <td className="py-3.5 px-4">{formatDate(b.dueDate)}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatCurrency(b.total)}</td>
                    <td className="py-3.5 px-4 font-extrabold text-rose-600">{formatCurrency(b.balanceDue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 5: GENERAL LEDGER */}
      {activeTab === 'general_ledger' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <span className="text-slate-500 text-xs font-bold uppercase block">Total Debited (Invoices)</span>
              <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(generalLedger.totalDebited)}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <span className="text-slate-500 text-xs font-bold uppercase block">Total Credited (Payments)</span>
              <div className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(generalLedger.totalCredited)}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
              <span className="text-slate-500 text-xs font-bold uppercase block">Closing Ledger Balance</span>
              <div className="text-xl font-black text-amber-700 mt-1">{formatCurrency(generalLedger.closingBalance)}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-slate-800">
            <h3 className="font-extrabold text-slate-900 text-base mb-1">Statement of Account (General Ledger)</h3>
            <table className="w-full text-left text-xs text-slate-700 mt-3">
              <thead className="text-[11px] uppercase tracking-wider text-slate-600 bg-slate-50 border-y border-slate-200 rounded-xl">
                <tr>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Particulars</th>
                  <th className="py-3 px-4 font-bold">Ref No</th>
                  <th className="py-3 px-4 text-right font-bold">Debit (₹)</th>
                  <th className="py-3 px-4 text-right font-bold">Credit (₹)</th>
                  <th className="py-3 px-4 text-right font-bold">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generalLedger.journal.map((j, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-500">{formatDate(j.date)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{j.particulars}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{j.refNo}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">{j.debit > 0 ? formatCurrency(j.debit) : '—'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{j.credit > 0 ? formatCurrency(j.credit) : '—'}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-amber-700">{formatCurrency(j.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 6: CHAT WITH ACCOUNT MANAGER */}
      {activeTab === 'chat' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-slate-800 animate-fade-in max-w-4xl mx-auto flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white shadow-xs">
                PS
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{customerThread.accountManager}</h3>
                <span className="text-[11px] text-emerald-600 flex items-center space-x-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Assigned Account Manager &bull; Online</span>
                </span>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono">Thread: {customer.id}</span>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
            {customerThread.messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.isCustomer ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.isCustomer
                    ? 'bg-slate-900 text-white rounded-br-none shadow-xs'
                    : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none shadow-xs'
                }`}>
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.sender} &bull; {msg.timestamp}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              placeholder={`Message ${customerThread.accountManager}...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 focus:bg-white"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              Send &rarr;
            </button>
          </form>
        </div>
      )}

      {/* CUSTOMER EDIT ORDER MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-5 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                  <span>Edit Manufacturing Order</span>
                  <span className="font-mono text-slate-600 text-sm ml-2">({editingOrder.id})</span>
                </h3>
                <p className="text-xs text-slate-500">Order is awaiting admin approval. You can modify any specifications below.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdits} className="space-y-4">
              {/* Row 1: Brand, Type, Material */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={editBrandName}
                    onChange={(e) => setEditBrandName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Type *</label>
                  <select
                    value={editSelectedType}
                    onChange={(e) => {
                      setEditSelectedType(e.target.value);
                      const tObj = availableTypes.find(t => t.name === e.target.value);
                      if (tObj) setEditSelectedMaterial(tObj.materials[0] || '');
                    }}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    {availableTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Material *</label>
                  <select
                    value={editSelectedMaterial}
                    onChange={(e) => setEditSelectedMaterial(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    {(availableTypes.find(t => t.name === editSelectedType)?.materials || []).map((m, idx) => (
                      <option key={idx} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Dori, Plastic, Artwork */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* DORI */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Dori</label>
                    <div className="flex space-x-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px]">
                      <button
                        type="button"
                        onClick={() => { setEditDoriOption('reg'); setEditDoriCustom(''); }}
                        className={`px-2 py-0.5 rounded font-semibold transition-colors ${editDoriOption === 'reg' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Reg.
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditDoriOption('custom')}
                        className={`px-2 py-0.5 rounded font-semibold transition-colors ${editDoriOption === 'custom' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>
                  {editDoriOption === 'custom' ? (
                    <input
                      type="text"
                      required
                      placeholder="Specify custom dori"
                      value={editDoriCustom}
                      onChange={(e) => setEditDoriCustom(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-none"
                    />
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">Standard / Regular Dori</div>
                  )}
                </div>

                {/* PLASTIC */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Plastic</label>
                    <div className="flex space-x-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px]">
                      <button
                        type="button"
                        onClick={() => { setEditPlasticOption('reg'); setEditPlasticCustom(''); }}
                        className={`px-2 py-0.5 rounded font-semibold transition-colors ${editPlasticOption === 'reg' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Reg.
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPlasticOption('custom')}
                        className={`px-2 py-0.5 rounded font-semibold transition-colors ${editPlasticOption === 'custom' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>
                  {editPlasticOption === 'custom' ? (
                    <input
                      type="text"
                      required
                      placeholder="Specify custom plastic"
                      value={editPlasticCustom}
                      onChange={(e) => setEditPlasticCustom(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-none"
                    />
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">Standard / Regular Plastic lock</div>
                  )}
                </div>

                {/* ARTWORK */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Artwork Image</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-slate-900 file:text-white cursor-pointer"
                    />
                    {editOrderImage && (
                      <img src={editOrderImage} alt="Artwork" className="w-8 h-8 rounded object-cover border border-slate-200" />
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Quantity, Rate, Subtotal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quantity (Pcs) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rate per Pc (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editRate}
                    onChange={(e) => setEditRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
                <div className="bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 flex flex-col justify-center">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">Order Total</span>
                  <span className="text-emerald-700 font-black text-sm">{formatCurrency(editQty * editRate)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Customer Remarks</label>
                <input
                  type="text"
                  placeholder="Additional order instructions"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
                >
                  Save Order Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARTWORK LIGHTBOX MODAL */}
      {previewArtworkUrl && (
        <div 
          onClick={() => setPreviewArtworkUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">High-Resolution Artwork Preview</span>
              <button
                type="button"
                onClick={() => setPreviewArtworkUrl(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center"
              >
                &times;
              </button>
            </div>
            <img 
              src={previewArtworkUrl} 
              alt="High Resolution Artwork" 
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-2xl mx-auto shadow-xs border border-slate-200" 
            />
          </div>
        </div>
      )}

      {/* CROP MODAL FOR PLACE ORDER ARTWORK */}
      {showCropModal && orderImage && (
        <window.uBMS.ImageCropModal
          imageSrc={orderImage}
          onSave={handleSaveCroppedImage}
          onClose={() => setShowCropModal(false)}
        />
      )}

      {/* FULL IMAGE MODAL FOR CURRENT ARTWORK */}
      {showFullImageModal && orderImage && (
        <div 
          onClick={() => setShowFullImageModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Artwork Preview</span>
              <button
                type="button"
                onClick={() => setShowFullImageModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center"
              >
                &times;
              </button>
            </div>
            <div className="flex items-center justify-center bg-slate-50 rounded-2xl p-2 max-h-[60vh] overflow-hidden">
              <img 
                src={orderImage} 
                alt="Artwork" 
                className="max-h-[55vh] w-auto max-w-full object-contain rounded-xl mx-auto shadow-xs border border-slate-200" 
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowFullImageModal(false); setShowCropModal(true); }}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <span>Crop Artwork</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

window.uBMS.CustomerPortal = CustomerPortal;
