// Customer Portal: Tags & Labels Manufacturing Order System
window.uBMS = window.uBMS || {};

function CustomerPortal({ 
  customer, 
  orders, 
  invoices, 
  payments, 
  labelTypes = [], 
  messages, 
  onSaveOrder, 
  onUpdateOrder,
  onSaveMessage, 
  onOpenInvoice, 
  defaultTab = 'order_register' 
}) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  const [previewArtworkUrl, setPreviewArtworkUrl] = React.useState(null);

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

  // Chat Thread
  const customerThread = React.useMemo(() => {
    const thread = messages.find(m => m.threadId === customer.id);
    return thread || { threadId: customer.id, customerName: customer.name, accountManager: 'Priya Sharma', messages: [] };
  }, [messages, customer]);

  const [chatInput, setChatInput] = React.useState('');

  // ---------------------------------------------------------------------------
  // Available Types & Materials Catalog
  // ---------------------------------------------------------------------------
  const availableTypes = labelTypes.length > 0 ? labelTypes : [
    { id: 'TYPE-TAG', name: 'Tag', materials: ['100 GSM', '200 GSM', '300 GSM'], defaultRate: 2.50 },
    { id: 'TYPE-PULABEL', name: 'PU Label', materials: ['1.2', '1.8', '2.2'], defaultRate: 14.00 }
  ];

  // ---------------------------------------------------------------------------
  // Tags & Labels Order Creation State
  // 1. Order Image
  // 2. Brand Name
  // 3. Type
  // 4. Material
  // 5. Qty
  // 6. Rate
  // 7. Dori (Reg. or Custom)
  // 8. Plastic (Reg. or Custom)
  // ---------------------------------------------------------------------------
  const [orderImage, setOrderImage] = React.useState('');
  const [brandName, setBrandName] = React.useState('');
  const [selectedType, setSelectedType] = React.useState(availableTypes[0]?.name || 'Tag');
  
  const currentTypeObj = availableTypes.find(t => t.name === selectedType) || availableTypes[0];
  const [selectedMaterial, setSelectedMaterial] = React.useState(currentTypeObj?.materials[0] || '100 GSM');
  const [qty, setQty] = React.useState(0);
  const [rate, setRate] = React.useState(0);

  // Dori & Plastic States (Reg. vs Custom)
  const [doriOption, setDoriOption] = React.useState('reg'); // 'reg' or 'custom'
  const [doriCustom, setDoriCustom] = React.useState('');

  const [plasticOption, setPlasticOption] = React.useState('reg'); // 'reg' or 'custom'
  const [plasticCustom, setPlasticCustom] = React.useState('');

  // Update material when type changes
  const handleTypeChange = (newType) => {
    setSelectedType(newType);
    const typeObj = availableTypes.find(t => t.name === newType);
    if (typeObj) {
      setSelectedMaterial(typeObj.materials[0] || '');
    }
  };

  // Image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setOrderImage(reader.result);
      reader.readAsDataURL(file);
    }
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

  // Add Item to Order and CLEAR ALL FIELDS
  const handleAddItemToOrder = (e) => {
    e.preventDefault();
    if (!brandName.trim()) return alert('Please enter a Brand Name.');
    if (!qty || Number(qty) <= 0) return alert('Please enter a valid quantity.');
    if (!rate || Number(rate) <= 0) return alert('Please enter a valid rate.');
    if (doriOption === 'custom' && !doriCustom.trim()) return alert('Please enter the custom Dori specification.');
    if (plasticOption === 'custom' && !plasticCustom.trim()) return alert('Please enter the custom Plastic specification.');

    const doriValue = doriOption === 'custom' ? `Custom: ${doriCustom.trim()}` : 'Reg.';
    const plasticValue = plasticOption === 'custom' ? `Custom: ${plasticCustom.trim()}` : 'Reg.';

    const newItem = {
      id: 'ITEM-' + Date.now().toString().slice(-4),
      itemCode: currentCustomerItemCode,
      name: currentCustomerItemCode,
      brandName: brandName.trim(),
      type: selectedType,
      material: selectedMaterial,
      dori: doriValue,
      plastic: plasticValue,
      image: orderImage || 'https://placehold.co/120x120/1e293b/ffffff?text=' + encodeURIComponent(selectedType),
      quantity: Number(qty),
      unitPrice: Number(rate),
      total: Number(qty) * Number(rate)
    };

    setOrderItems(prev => [...prev, newItem]);

    // CLEAR ALL FIELDS AFTER ADDING AN ITEM
    setBrandName('');
    setOrderImage('');
    const defaultType = availableTypes[0];
    setSelectedType(defaultType?.name || 'Tag');
    setSelectedMaterial(defaultType?.materials[0] || '100 GSM');
    setQty(0);
    setRate(0);
    setDoriOption('reg');
    setDoriCustom('');
    setPlasticOption('reg');
    setPlasticCustom('');

    // Clear file input element if any
    const fileInput = document.getElementById('customer-file-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleRemoveOrderItem = (id) => {
    setOrderItems(prev => prev.filter(i => i.id !== id));
  };

  // Calculations (NO TAXES, Subtotal = Grand Total)
  const grandTotal = orderItems.reduce((acc, i) => acc + i.total, 0);

  // Submit Final Order
  const handleSubmitFinalOrder = (e) => {
    e.preventDefault();
    if (orderItems.length === 0) return alert('Please add at least one tag or label item to your order.');

    const orderId = 'ORD-2026-' + Math.floor(1000 + Math.random() * 9000);
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const newOrder = {
      id: orderId,
      customerId: customer.id,
      customerName: customer.name,
      customerCompany: customer.company || orderItems[0]?.brandName,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: nowIso,
      expectedDelivery: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      assignedTo: 'Unassigned',
      items: orderItems.map(i => ({
        id: i.id,
        itemCode: i.itemCode || i.name,
        name: i.itemCode || i.name,
        brandName: i.brandName,
        type: i.type,
        material: i.material,
        dori: i.dori,
        plastic: i.plastic,
        image: i.image,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        total: i.total
      })),
      subtotal: grandTotal,
      tax: 0,
      shipping: 0,
      total: grandTotal,
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
          description: `Manufacturing order booked by ${customer.name} (${orderItems.length} item(s)).`,
          timestamp: formattedDate,
          author: customer.name
        }
      ],
      internalNotes: [],
      customerNotes: orderNotes
    };

    onSaveOrder(newOrder);
    setOrderItems([]);
    setOrderNotes('');
    alert(`Order ${orderId} placed successfully!`);
    setActiveTab('order_register');
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

  // 6 Customer Tabs
  const customerTabs = [
    { key: 'place_order', label: 'Place Order', icon: '🛒' },
    { key: 'order_register', label: 'Order Register', icon: '📦' },
    { key: 'invoice_register', label: 'Invoice Register', icon: '📄' },
    { key: 'outstanding_ledger', label: 'Outstanding Ledger', icon: '⏳' },
    { key: 'general_ledger', label: 'General Ledger', icon: '📑' },
    { key: 'chat', label: 'Chat with Acc Manager', icon: '💬' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/20">
              <span>🏷️</span>
              <span>Tags & Labels Client Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {customer.company}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Client: {customer.name} &bull; Acc Manager: <span className="text-indigo-300 font-bold">{customerThread.accountManager}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Outstanding Balance</span>
              <span className="text-lg font-black text-amber-400">{formatCurrency(outstandingLedger.totalOutstanding)}</span>
            </div>
            <button
              onClick={() => setActiveTab('place_order')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-3 py-2 rounded-xl text-xs shadow transition-all ml-2"
            >
              + Place Order
            </button>
          </div>
        </div>

        {/* Modular Navigation Bar (6 Customer Modules) */}
        <div className="flex items-center space-x-1.5 mt-6 pt-4 border-t border-slate-800 overflow-x-auto">
          {customerTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MODULE 1: PLACE ORDER (TAGS & LABELS SPECIFICATION) */}
      {activeTab === 'place_order' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-fade-in">
          
          {/* Left Form: Tag & Label Creation Fields */}
          <div className="xl:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base flex items-center space-x-2">
                  <span>🏷️</span>
                  <span>Create Tag / Label Manufacturing Item</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Specify Brand, Type, Material, Dori, Plastic, artwork and required manufacturing quantities.
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                Customer Ordering Portal
              </span>
            </div>

            <form onSubmit={handleAddItemToOrder} className="space-y-5 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
              
              {/* TIER 1: CORE IDENTIFIERS (4-COLUMNS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Brand Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urban Stitch / Denim Club"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">Item Code</label>
                    <span className="text-[10px] text-blue-400 font-mono">🔒 Auto-assigned</span>
                  </div>
                  <div 
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-blue-400 flex items-center justify-between cursor-not-allowed select-none"
                    title="Unique Article / Item Code is automatically generated and secured by Admin"
                  >
                    <span>{currentCustomerItemCode}</span>
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Auto</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {availableTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Material <span className="text-rose-400">*</span>
                    <span className="text-[10px] text-slate-400 ml-1 font-normal">({selectedType})</span>
                  </label>
                  <select
                    value={selectedMaterial}
                    onChange={(e) => setSelectedMaterial(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {(currentTypeObj?.materials || []).map((mat, i) => (
                      <option key={i} value={mat}>{mat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TIER 2: ACCESSORIES & ARTWORK (3-COLUMNS) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* DORI FIELD */}
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">🧵 Dori</label>
                    <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                      <button
                        type="button"
                        onClick={() => { setDoriOption('reg'); setDoriCustom(''); }}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          doriOption === 'reg' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Reg.
                      </button>
                      <button
                        type="button"
                        onClick={() => setDoriOption('custom')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          doriOption === 'custom' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {doriOption === 'custom' ? (
                    <input
                      type="text"
                      required
                      placeholder="Specify custom dori (e.g. Waxed Cotton Black 7-in)"
                      value={doriCustom}
                      onChange={(e) => setDoriCustom(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-xs text-slate-400 py-1.5 px-2 bg-slate-900/50 rounded-xl border border-slate-800">
                      Standard / Regular Dori assigned
                    </div>
                  )}
                </div>

                {/* PLASTIC FIELD */}
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">🔒 Plastic Lock</label>
                    <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                      <button
                        type="button"
                        onClick={() => { setPlasticOption('reg'); setPlasticCustom(''); }}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          plasticOption === 'reg' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Reg.
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlasticOption('custom')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          plasticOption === 'custom' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {plasticOption === 'custom' ? (
                    <input
                      type="text"
                      required
                      placeholder="Specify custom plastic (e.g. Embossed Square Seal)"
                      value={plasticCustom}
                      onChange={(e) => setPlasticCustom(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <div className="text-xs text-slate-400 py-1.5 px-2 bg-slate-900/50 rounded-xl border border-slate-800">
                      Standard / Regular Plastic Lock assigned
                    </div>
                  )}
                </div>

                {/* ARTWORK UPLOAD & PREVIEW */}
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2">
                  <label className="text-xs font-bold text-slate-200 block">📎 Order Image / Artwork</label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="customer-file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                    />
                    {orderImage && (
                      <div className="flex items-center space-x-2 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700 flex-shrink-0">
                        <img src={orderImage} alt="Preview" className="w-7 h-7 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => {
                            setOrderImage('');
                            const el = document.getElementById('customer-file-upload');
                            if (el) el.value = '';
                          }}
                          className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* TIER 3: COMMERCIALS & ACTION (4-COLUMNS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-2 border-t border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Quantity (Pcs) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={qty}
                    onFocus={() => { if (Number(qty) === 0) setQty(''); }}
                    onBlur={() => { if (qty === '' || isNaN(qty)) setQty(0); }}
                    onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Rate per Pc (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={rate}
                    onFocus={() => { if (Number(rate) === 0) setRate(''); }}
                    onBlur={() => { if (rate === '' || isNaN(rate)) setRate(0); }}
                    onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/80 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Item Subtotal</span>
                  <span className="text-emerald-400 font-extrabold text-sm">{formatCurrency(qty * rate)}</span>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>➕</span>
                    <span>Add Item to Order</span>
                  </button>
                </div>
              </div>

            </form>

            {/* Configured Line Items Table */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Order Line Items ({orderItems.length})
              </h4>

              {orderItems.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                  No items added yet. Fill out the form above and click &quot;+ Add Item to Order&quot;.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
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
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {orderItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <img src={item.image} alt={item.type} className="w-9 h-9 object-cover rounded-lg border border-slate-700" />
                              <div className="flex flex-col">
                                <span className="font-mono font-bold text-xs text-blue-400 bg-blue-950/60 border border-blue-800/80 px-1.5 py-0.5 rounded inline-block w-fit">
                                  {item.itemCode || item.name}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500 mt-0.5">#{idx + 1}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-white">{item.brandName}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 mr-1.5 font-medium">{item.type}</span>
                            <span className="text-sky-300 font-medium">{item.material}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{item.dori}</td>
                          <td className="py-3 px-4 text-slate-300">{item.plastic}</td>
                          <td className="py-3 px-4 text-center font-mono font-medium">{item.quantity.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{formatCurrency(item.total)}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveOrderItem(item.id)}
                              className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold transition-colors inline-flex items-center justify-center"
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

          {/* Right Summary: Total & Submit (No taxes, No shipping, No urgency) */}
          <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200 space-y-4 self-start sticky top-24">
            <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-blue-400 font-mono">({orderItems.length} items)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Special Order Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Cut & fold preference, packaging instructions..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Total Calculation (Pure Subtotal, NO TAXES) */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex justify-between text-base font-black text-white pt-1">
                  <span>Total Amount</span>
                  <span className="text-emerald-400 text-lg">{formatCurrency(grandTotal)}</span>
                </div>
                <p className="text-[10px] text-slate-500">Zero additional taxes applied.</p>
              </div>

              <button
                type="button"
                onClick={handleSubmitFinalOrder}
                disabled={orderItems.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-all mt-3"
              >
                🚀 Confirm & Book Manufacturing Order
              </button>
            </div>
          </div>

        </div>
      )}

      {/* MODULE 2: ORDER REGISTER */}
      {activeTab === 'order_register' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-800 gap-3">
              <div>
                <h3 className="font-bold text-white text-base">Customer Order Register</h3>
                <p className="text-xs text-slate-400">Complete registry of manufacturing orders. Orders can be edited until approved by admin.</p>
              </div>
              <span className="text-xs text-indigo-400 font-mono">
                {customerOrders.length} Order(s)
              </span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/80 rounded-xl">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Artwork</th>
                    <th className="py-3 px-4">Brand &amp; Item Specs</th>
                    <th className="py-3 px-4">Dori &amp; Plastic</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Total Amt</th>
                    <th className="py-3 px-4 text-center">Edit / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {customerOrders.map(order => {
                    const firstItem = order.items[0] || {};
                    const isEditable = !order.status || order.status === 'pending' || order.status === 'placed' || order.status === 'rejected';

                    return (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* 1. ORDER ID */}
                        <td className="py-4 px-4">
                          <div className="font-mono font-bold text-blue-400 text-sm">{order.id}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{formatDate(order.createdAt)}</div>
                        </td>

                        {/* 2. ARTWORK (LARGER SIZE WITH CLICK TO ENLARGE) */}
                        <td className="py-4 px-4">
                          {firstItem.image ? (
                            <div 
                              onClick={() => setPreviewArtworkUrl(firstItem.image)}
                              className="relative group cursor-pointer inline-block"
                              title="Click to view large artwork"
                            >
                              <img 
                                src={firstItem.image} 
                                alt="Artwork" 
                                className="w-20 h-20 object-cover rounded-2xl border-2 border-slate-700 shadow-md group-hover:border-blue-500 group-hover:scale-105 transition-all" 
                              />
                              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                                🔍 Zoom
                              </div>
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg text-slate-500">
                              🏷️
                            </div>
                          )}
                        </td>

                        {/* 3. BRAND AND ITEM SPECS */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {firstItem.itemCode || firstItem.name || 'ITEM'}
                            </span>
                            <span className="font-extrabold text-white text-sm">
                              {firstItem.brandName || order.customerCompany}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold text-[11px]">
                              {firstItem.type || 'Tag'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[11px] font-medium">
                              {firstItem.material || 'Standard'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 font-mono">
                            Qty: <strong className="text-white">{Number(firstItem.quantity || 0).toLocaleString()} pcs</strong> &bull; Rate: <strong className="text-slate-300">{formatCurrency(firstItem.unitPrice || 0)}</strong>
                          </div>
                        </td>

                        {/* 4. DORI AND PLASTIC */}
                        <td className="py-4 px-4 text-xs space-y-1">
                          <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-slate-200">
                            🧵 Dori: <strong>{firstItem.dori || 'Reg.'}</strong>
                          </div>
                          <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-slate-200">
                            🔒 Plastic: <strong>{firstItem.plastic || 'Reg.'}</strong>
                          </div>
                        </td>

                        {/* 5. STATUS */}
                        <td className="py-4 px-4">
                          <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase inline-flex items-center space-x-1 ${
                            order.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 shadow-emerald-900/20' :
                            order.status === 'rejected' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                            order.status === 'in_production' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                            order.status === 'delivered' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                            'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            <span>{order.status === 'approved' ? '✓' : order.status === 'rejected' ? '✕' : '⏳'}</span>
                            <span>
                              {order.status === 'pending' || order.status === 'placed' ? 'Pending Approval' :
                               order.status === 'approved' ? 'Approved' :
                               order.status === 'rejected' ? 'Rejected' :
                               order.status.replace('_', ' ')}
                            </span>
                          </span>
                        </td>

                        {/* 6. TOTAL AMT */}
                        <td className="py-4 px-4 text-right">
                          <span className="font-extrabold text-emerald-400 text-base font-mono">
                            {formatCurrency(order.total)}
                          </span>
                        </td>

                        {/* 7. EDIT (CUSTOMER GRANTED EDIT UNTIL APPROVED BY ADMIN) */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {isEditable ? (
                              <button
                                onClick={() => handleOpenEditModal(order)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1"
                                title="Edit order specifications"
                              >
                                <span>✏️</span>
                                <span>Edit</span>
                              </button>
                            ) : (
                              <span 
                                className="text-[11px] text-slate-500 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60" 
                                title="Order approved by admin. Editing locked."
                              >
                                <span>🔒</span>
                                <span>Locked</span>
                              </span>
                            )}

                            <button
                              onClick={() => onOpenInvoice(order)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs border border-slate-700 transition-colors"
                              title="View Invoice & Receipt"
                            >
                              📄
                            </button>
                          </div>
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

      {/* MODULE 3: INVOICE REGISTER */}
      {activeTab === 'invoice_register' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
            <h3 className="font-bold text-white text-base mb-1">Customer Invoice Register</h3>
            <p className="text-xs text-slate-400 mb-4">Invoices issued against completed orders.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 rounded-xl">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Invoice Total</th>
                    <th className="py-3 px-4">Paid</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {customerInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{inv.id}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{inv.orderId}</td>
                      <td className="py-3.5 px-4">{formatDate(inv.issueDate)}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{formatCurrency(inv.total)}</td>
                      <td className="py-3.5 px-4 text-emerald-400">{formatCurrency(inv.paidAmount)}</td>
                      <td className="py-3.5 px-4 font-extrabold text-amber-400">{formatCurrency(inv.balanceDue)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          inv.status === 'paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                          'bg-amber-950 text-amber-400 border border-amber-800'
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
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs font-semibold"
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-bold block uppercase">Total Outstanding</span>
              <div className="text-2xl font-black text-rose-400 mt-1">{formatCurrency(outstandingLedger.totalOutstanding)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-bold block uppercase">0 - 30 Days Aging</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(outstandingLedger.aging0to30)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-bold block uppercase">31 - 60 Days Aging</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{formatCurrency(outstandingLedger.aging31to60)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-bold block uppercase">60+ Days Overdue</span>
              <div className="text-2xl font-black text-rose-500 mt-1">{formatCurrency(outstandingLedger.aging60Plus)}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
            <h3 className="font-bold text-white text-base mb-1">Unpaid Dues Breakdown</h3>
            <table className="w-full text-left text-xs text-slate-300 mt-3">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 rounded-xl">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Balance Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {outstandingLedger.bills.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{b.id}</td>
                    <td className="py-3.5 px-4">{formatDate(b.issueDate)}</td>
                    <td className="py-3.5 px-4">{formatDate(b.dueDate)}</td>
                    <td className="py-3.5 px-4 font-bold text-white">{formatCurrency(b.total)}</td>
                    <td className="py-3.5 px-4 font-extrabold text-rose-400">{formatCurrency(b.balanceDue)}</td>
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-bold uppercase block">Total Debited (Invoices)</span>
              <div className="text-xl font-bold text-white mt-1">{formatCurrency(generalLedger.totalDebited)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-bold uppercase block">Total Credited (Payments)</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">{formatCurrency(generalLedger.totalCredited)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-bold uppercase block">Closing Ledger Balance</span>
              <div className="text-xl font-bold text-amber-400 mt-1">{formatCurrency(generalLedger.closingBalance)}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
            <h3 className="font-bold text-white text-base mb-1">Statement of Account (General Ledger)</h3>
            <table className="w-full text-left text-xs text-slate-300 mt-3">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 rounded-xl">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4">Ref No</th>
                  <th className="py-3 px-4 text-right">Debit (₹)</th>
                  <th className="py-3 px-4 text-right">Credit (₹)</th>
                  <th className="py-3 px-4 text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {generalLedger.journal.map((j, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-400">{formatDate(j.date)}</td>
                    <td className="py-3 px-4 font-bold text-white">{j.particulars}</td>
                    <td className="py-3 px-4 font-mono text-blue-400">{j.refNo}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">{j.debit > 0 ? formatCurrency(j.debit) : '—'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{j.credit > 0 ? formatCurrency(j.credit) : '—'}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-amber-400">{formatCurrency(j.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODULE 6: CHAT WITH ACCOUNT MANAGER */}
      {activeTab === 'chat' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200 animate-fade-in max-w-4xl mx-auto flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow">
                PS
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{customerThread.accountManager}</h3>
                <span className="text-[11px] text-emerald-400 flex items-center space-x-1">
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
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none shadow'
                }`}>
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.sender} &bull; {msg.timestamp}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder={`Message ${customerThread.accountManager}...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all"
            >
              Send &rarr;
            </button>
          </form>
        </div>
      )}

      {/* CUSTOMER EDIT ORDER MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-5 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-black text-white flex items-center space-x-2">
                  <span>✏️</span>
                  <span>Edit Manufacturing Order</span>
                  <span className="font-mono text-blue-400 text-sm ml-2">({editingOrder.id})</span>
                </h3>
                <p className="text-xs text-slate-400">Order is awaiting admin approval. You can modify any specifications below.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdits} className="space-y-4">
              {/* Row 1: Brand, Type, Material */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={editBrandName}
                    onChange={(e) => setEditBrandName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Type *</label>
                  <select
                    value={editSelectedType}
                    onChange={(e) => {
                      setEditSelectedType(e.target.value);
                      const tObj = availableTypes.find(t => t.name === e.target.value);
                      if (tObj) setEditSelectedMaterial(tObj.materials[0] || '');
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {availableTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Material *</label>
                  <select
                    value={editSelectedMaterial}
                    onChange={(e) => setEditSelectedMaterial(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
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
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">🧵 Dori</label>
                    <div className="flex space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                      <button
                        type="button"
                        onClick={() => { setEditDoriOption('reg'); setEditDoriCustom(''); }}
                        className={`px-2 py-0.5 rounded font-semibold ${editDoriOption === 'reg' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                      >
                        Reg.
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditDoriOption('custom')}
                        className={`px-2 py-0.5 rounded font-semibold ${editDoriOption === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">Standard / Regular Dori</div>
                  )}
                </div>

                {/* PLASTIC */}
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200">🔒 Plastic</label>
                    <div className="flex space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700 text-[11px]">
                      <button
                        type="button"
                        onClick={() => { setEditPlasticOption('reg'); setEditPlasticCustom(''); }}
                        className={`px-2 py-0.5 rounded font-semibold ${editPlasticOption === 'reg' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                      >
                        Reg.
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPlasticOption('custom')}
                        className={`px-2 py-0.5 rounded font-semibold ${editPlasticOption === 'custom' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">Standard / Regular Plastic lock</div>
                  )}
                </div>

                {/* ARTWORK */}
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 block">📎 Artwork Image</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      className="w-full text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-blue-600 file:text-white cursor-pointer"
                    />
                    {editOrderImage && (
                      <img src={editOrderImage} alt="Artwork" className="w-8 h-8 rounded object-cover border border-slate-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Quantity, Rate, Subtotal */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end pt-2 border-t border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Quantity (Pcs) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Rate per Pc (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editRate}
                    onChange={(e) => setEditRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Order Total</span>
                  <span className="text-emerald-400 font-extrabold text-sm">{formatCurrency(editQty * editRate)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Customer Remarks</label>
                <input
                  type="text"
                  placeholder="Additional order instructions"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                >
                  ✓ Save Order Changes
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">High-Resolution Artwork Preview</span>
              <button
                type="button"
                onClick={() => setPreviewArtworkUrl(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center"
              >
                &times;
              </button>
            </div>
            <img 
              src={previewArtworkUrl} 
              alt="High Resolution Artwork" 
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-2xl mx-auto shadow-lg border border-slate-800" 
            />
          </div>
        </div>
      )}

    </div>
  );
}

window.uBMS.CustomerPortal = CustomerPortal;
