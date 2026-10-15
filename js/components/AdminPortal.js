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
  onUpdateLabelTypes,
  onUpdateOrder, 
  onSaveOrder, 
  onSaveInvoice, 
  onSavePayment, 
  onUpdateProduction, 
  onUpdatePayroll, 
  onOpenInvoice, 
  defaultTab = 'all_orders' 
}) {
  const [activeTab, setActiveTab] = React.useState(defaultTab);
  const [viewMode, setViewMode] = React.useState('table'); // 'table' or 'kanban'
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = React.useState([]);
  const [previewArtworkUrl, setPreviewArtworkUrl] = React.useState(null);
  const [bulkTargetStatus, setBulkTargetStatus] = React.useState('approved');

  const formatCurrency = window.uBMS.formatCurrency;
  const formatDate = window.uBMS.formatDate;
  const STAGES = window.uBMS.STAGES;

  const availableTypes = labelTypes.length > 0 ? labelTypes : [
    { id: 'TYPE-TAG', name: 'Tag', materials: ['100 GSM', '200 GSM', '300 GSM'], defaultRate: 2.50 },
    { id: 'TYPE-PULABEL', name: 'PU Label', materials: ['1.2', '1.8', '2.2'], defaultRate: 14.00 }
  ];

  // --- MODULE 1: PLACE ORDER (ON-BEHALF) STATE ---
  const [adminOrderCustId, setAdminOrderCustId] = React.useState(users.customers[0]?.id || '');
  const selectedCust = users.customers.find(c => c.id === adminOrderCustId) || users.customers[0];

  const [adminBrandName, setAdminBrandName] = React.useState(selectedCust?.company || '');
  const [adminItemCode, setAdminItemCode] = React.useState('');
  const [adminItemCodeManual, setAdminItemCodeManual] = React.useState(false);
  const [adminSelectedType, setAdminSelectedType] = React.useState(availableTypes[0]?.name || 'Tag');
  const adminTypeObj = availableTypes.find(t => t.name === adminSelectedType) || availableTypes[0];
  const [adminSelectedMaterial, setAdminSelectedMaterial] = React.useState(adminTypeObj?.materials[0] || '100 GSM');
  const [adminQty, setAdminQty] = React.useState(0);
  const [adminRate, setAdminRate] = React.useState(0);
  const [adminOrderImage, setAdminOrderImage] = React.useState('');
  const [adminDoriOption, setAdminDoriOption] = React.useState('reg'); // 'reg' or 'custom'
  const [adminDoriCustom, setAdminDoriCustom] = React.useState('');
  const [adminPlasticOption, setAdminPlasticOption] = React.useState('reg'); // 'reg' or 'custom'
  const [adminPlasticCustom, setAdminPlasticCustom] = React.useState('');

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

    const doriValue = adminDoriOption === 'custom' ? `Custom: ${adminDoriCustom.trim()}` : 'Reg.';
    const plasticValue = adminPlasticOption === 'custom' ? `Custom: ${adminPlasticCustom.trim()}` : 'Reg.';

    const newItem = {
      id: 'ITEM-' + Date.now().toString().slice(-4),
      itemCode: finalCode,
      name: finalCode,
      brandName: adminBrandName.trim(),
      type: adminSelectedType,
      material: adminSelectedMaterial,
      dori: doriValue,
      plastic: plasticValue,
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
        material: i.material,
        dori: i.dori,
        plastic: i.plastic,
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

  // --- MODULE 7: PRODUCTION FLOW ADVANCEMENT ---
  const handleAdvanceProductionStage = (job, nextStage) => {
    const updated = production.map(j => {
      if (j.jobId === job.jobId) {
        return { ...j, stage: nextStage };
      }
      return j;
    });
    onUpdateProduction(updated);
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

  const handleRejectOrder = (order) => {
    const reason = prompt('Please enter reason for rejection (optional):', 'Artwork or specification clarification needed');
    if (reason === null) return;
    const formattedDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const updated = {
      ...order,
      status: 'rejected',
      timeline: [
        ...(order.timeline || []),
        {
          stage: 'rejected',
          title: 'Order Rejected by Admin',
          description: `Rejected by ${currentMember.name}: ${reason}`,
          timestamp: formattedDate,
          author: currentMember.name
        }
      ]
    };
    onUpdateOrder(updated);
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

  // 9 Admin Navigation Tabs
  const adminTabs = [
    { key: 'place_order', label: 'Place Order', icon: '🛒' },
    { key: 'all_orders', label: 'View All Orders', icon: '📦' },
    { key: 'create_invoice', label: 'Create Invoice', icon: '🧾' },
    { key: 'all_invoices', label: 'View All Invoices', icon: '📑' },
    { key: 'ledgers', label: 'Ledgers Hub', icon: '⚖️' },
    { key: 'payments', label: 'Payment Entries', icon: '💵' },
    { key: 'production', label: 'Production Flow', icon: '⚙️' },
    { key: 'payroll', label: 'Attendance & Payroll', icon: '👥' },
    { key: 'label_config', label: 'Types & Materials', icon: '🏷️' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/20">
              <span>🛡️</span>
              <span>Tags & Labels Operations Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Enterprise Operations Control
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Logged in: <strong className="text-white">{currentMember.name}</strong> ({currentMember.roleLabel || currentMember.role}) &bull; Department: {currentMember.department}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('place_order')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-3.5 py-2 rounded-xl text-xs shadow transition-all flex items-center space-x-1"
            >
              <span>➕</span>
              <span>Book Order</span>
            </button>
            <button
              onClick={() => setActiveTab('label_config')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3.5 py-2 rounded-xl text-xs shadow transition-all flex items-center space-x-1 border border-slate-700"
            >
              <span>🏷️</span>
              <span>Manage Types</span>
            </button>
          </div>
        </div>

        {/* Modular Navigation Bar */}
        <div className="flex items-center space-x-1.5 mt-6 pt-4 border-t border-slate-800 overflow-x-auto">
          {adminTabs.map(tab => (
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
          
          <div className="xl:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">Book Manufacturing Order (Tags & Labels)</h3>
                <p className="text-xs text-slate-400">Precision manufacturing order entry with dynamic materials, custom trims & artwork.</p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                Admin Entry Console
              </span>
            </div>

            {/* Line Item Creation Form */}
            <form onSubmit={handleAdminAddItem} className="space-y-5 bg-slate-800/40 p-5 rounded-2xl border border-slate-800">
              
              {/* TIER 1: CORE IDENTIFIERS (5-COLUMNS) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Customer Account Party *</label>
                  <select
                    value={adminOrderCustId}
                    onChange={(e) => {
                      setAdminOrderCustId(e.target.value);
                      const cust = users.customers.find(c => c.id === e.target.value);
                      if (cust) setAdminBrandName(cust.company || cust.name);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {users.customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urban Stitch / Denim Club"
                    value={adminBrandName}
                    onChange={(e) => setAdminBrandName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">Item Code *</label>
                    <span className="text-[10px] text-indigo-400 font-mono">Auto / Admin Edit</span>
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-500 uppercase tracking-wider"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Type *</label>
                  <select
                    value={adminSelectedType}
                    onChange={(e) => handleAdminTypeChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {availableTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Material * <span className="text-slate-400 font-normal">({adminSelectedType})</span>
                  </label>
                  <select
                    value={adminSelectedMaterial}
                    onChange={(e) => setAdminSelectedMaterial(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {(adminTypeObj?.materials || []).map((m, idx) => (
                      <option key={idx} value={m}>{m}</option>
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
                        onClick={() => { setAdminDoriOption('reg'); setAdminDoriCustom(''); }}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          adminDoriOption === 'reg' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Reg.
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminDoriOption('custom')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          adminDoriOption === 'custom' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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
                        onClick={() => { setAdminPlasticOption('reg'); setAdminPlasticCustom(''); }}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          adminPlasticOption === 'reg' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Reg.
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminPlasticOption('custom')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          adminPlasticOption === 'custom' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
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
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <div className="text-xs text-slate-400 py-1.5 px-2 bg-slate-900/50 rounded-xl border border-slate-800">
                      Standard / Regular Plastic lock assigned
                    </div>
                  )}
                </div>

                {/* ARTWORK UPLOAD & PREVIEW */}
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/80 space-y-2">
                  <label className="text-xs font-bold text-slate-200 block">📎 Order Image / Artwork</label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="admin-file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAdminImageUpload}
                      className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                    />
                    {adminOrderImage && (
                      <div className="flex items-center space-x-2 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700 flex-shrink-0">
                        <img src={adminOrderImage} alt="Preview" className="w-7 h-7 object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => {
                            setAdminOrderImage('');
                            const el = document.getElementById('admin-file-upload');
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
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Quantity (Pcs) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={adminQty}
                    onFocus={() => { if (Number(adminQty) === 0) setAdminQty(''); }}
                    onBlur={() => { if (adminQty === '' || isNaN(adminQty)) setAdminQty(0); }}
                    onChange={(e) => setAdminQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Rate per Pc (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={adminRate}
                    onFocus={() => { if (Number(adminRate) === 0) setAdminRate(''); }}
                    onBlur={() => { if (adminRate === '' || isNaN(adminRate)) setAdminRate(0); }}
                    onChange={(e) => setAdminRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/80 flex flex-col justify-center">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Item Subtotal</span>
                  <span className="text-emerald-400 font-extrabold text-sm">{formatCurrency(adminQty * adminRate)}</span>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>➕</span>
                    <span>Add Line Item</span>
                  </button>
                </div>
              </div>

            </form>

            {/* Configured Line Items Table */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Order Line Items ({adminOrderItems.length})
              </h4>

              {adminOrderItems.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                  No items added yet. Configure fields above and click &quot;+ Add Line Item&quot;.
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
                      {adminOrderItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <img src={item.image} alt={item.type} className="w-9 h-9 object-cover rounded-lg border border-slate-700" />
                              <div className="flex flex-col">
                                <span className="font-mono font-bold text-xs text-indigo-400 bg-indigo-950/60 border border-indigo-800/80 px-1.5 py-0.5 rounded inline-block w-fit">
                                  {item.itemCode || item.name}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500 mt-0.5">#{idx + 1}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-white">{item.brandName}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mr-1.5 font-medium">{item.type}</span>
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
                              onClick={() => handleAdminRemoveItem(item.id)}
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

          {/* Admin Order Finalization */}
          <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200 space-y-4 self-start sticky top-24">
            <h3 className="font-bold text-white text-base pb-3 border-b border-slate-800 flex justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-indigo-400 font-mono">{selectedCust?.company}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block font-bold mb-1">Special Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={adminOrderDiscount}
                  onChange={(e) => setAdminOrderDiscount(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block font-bold mb-1">Internal / Production Note</label>
                <input
                  type="text"
                  placeholder="e.g. Color matching approved offline via WhatsApp"
                  value={adminOrderNotes}
                  onChange={(e) => setAdminOrderNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(Math.max(0, adminSubtotal))}</span>
                </div>
                <div className="flex justify-between text-white font-black text-sm pt-2 border-t border-slate-800">
                  <span>Total Amount</span>
                  <span className="text-emerald-400">{formatCurrency(adminTotal)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAdminSubmitOrder}
                disabled={adminOrderItems.length === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl shadow transition-all mt-2"
              >
                Confirm & Create Order
              </button>
            </div>
          </div>

        </div>
      )}

      {/* MODULE 9: TAGS & LABELS CONFIG (ADMIN ACCESS TO ADD TYPES & MATERIALS) */}
      {activeTab === 'label_config' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create New Type Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200 space-y-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <span>➕</span>
                <span>Add New Product Type</span>
              </h3>
              <p className="text-xs text-slate-400 mb-2">Create a new manufacturing classification (e.g. Woven Label, Heat Transfer, Satin Tape).</p>

              <form onSubmit={handleCreateNewType} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Type Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Woven Label / Sticker"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Initial Materials (comma separated) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Damask 50D, Satin, Taffeta"
                    value={newTypeMaterials}
                    onChange={(e) => setNewTypeMaterials(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Default Unit Rate (₹)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newTypeDefaultRate}
                    onChange={(e) => setNewTypeDefaultRate(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl shadow transition-all"
                >
                  Add Type to Catalog
                </button>
              </form>
            </div>

            {/* Add Material to Existing Type Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200 space-y-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <span>➕</span>
                <span>Add Material Thickness / Variant</span>
              </h3>
              <p className="text-xs text-slate-400 mb-2">Add a new material or GSM to an existing type (e.g. add 400 GSM to Tag, or 2.5 to PU Label).</p>

              <form onSubmit={handleAddMaterialToType} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Select Type *</label>
                  <select
                    value={addMatTargetType}
                    onChange={(e) => setAddMatTargetType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {availableTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">New Material / Specification Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 400 GSM / 2.5 / Holographic"
                    value={addMatName}
                    onChange={(e) => setAddMatName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow transition-all"
                >
                  Add Material to {addMatTargetType}
                </button>
              </form>
            </div>

            {/* Active Types & Materials Overview Cards */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
              <h3 className="font-bold text-white text-base mb-1">Active Catalog Matrix</h3>
              <p className="text-xs text-slate-400 mb-3">{availableTypes.length} configured types available for order booking.</p>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {availableTypes.map(type => (
                  <div key={type.id} className="bg-slate-800/70 border border-slate-700 rounded-2xl p-3.5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-white">{type.name}</span>
                      <span className="text-[11px] text-emerald-400 font-mono">Rate: ₹{type.defaultRate}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Materials:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {type.materials.map((mat, i) => (
                          <span
                            key={i}
                            className="bg-slate-900 text-slate-200 border border-slate-700 px-2.5 py-0.5 rounded-lg text-[10px] font-mono flex items-center space-x-1"
                          >
                            <span>{mat}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(type.name, mat)}
                              className="text-slate-500 hover:text-rose-400 font-bold ml-1"
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

        </div>
      )}

      {/* MODULE 2: VIEW ALL ORDERS (ADMIN ORDER REGISTER) */}
      {activeTab === 'all_orders' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* BULK ACTION BAR (Visible when 1 or more orders are selected) */}
          {selectedOrderIds.length > 0 && (
            <div className="sticky top-20 z-20 bg-indigo-950/95 border-2 border-indigo-500/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl backdrop-blur-md animate-fade-in">
              <div className="flex items-center space-x-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                <span className="font-bold text-white text-xs">
                  <strong className="text-indigo-300 font-mono text-sm">{selectedOrderIds.length}</strong> Order(s) Selected for Bulk Movement
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('approved')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow transition-all flex items-center space-x-1"
                >
                  <span>✓</span>
                  <span>Bulk Approve</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBulkStatusChange('rejected')}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow transition-all flex items-center space-x-1"
                >
                  <span>✕</span>
                  <span>Bulk Reject</span>
                </button>

                <div className="h-5 w-px bg-indigo-800 mx-1"></div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] text-slate-300 font-medium">Move Status to:</span>
                  <select
                    value={bulkTargetStatus}
                    onChange={(e) => setBulkTargetStatus(e.target.value)}
                    className="bg-slate-900 border border-indigo-500/60 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-400"
                  >
                    {STAGES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange(bulkTargetStatus)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs shadow transition-all"
                  >
                    Move
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrderIds([])}
                  className="text-xs text-slate-400 hover:text-white underline ml-2"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-800 gap-3">
              <div>
                <h3 className="font-bold text-white text-base">Admin Order Register</h3>
                <p className="text-xs text-slate-400">Complete registry with large artwork inspection, 1-click Approve/Reject, and bulk status movement.</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-indigo-400 font-mono mr-2">{orders.length} Total Orders</span>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  ☰ Table
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  📊 Kanban
                </button>
              </div>
            </div>

            {viewMode === 'table' ? (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/80 rounded-xl">
                    <tr>
                      <th className="py-3 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
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
                  <tbody className="divide-y divide-slate-800">
                    {orders.map(o => {
                      const firstItem = o.items[0] || {};
                      const isSelected = selectedOrderIds.includes(o.id);
                      const isApproved = o.status === 'approved';
                      const isRejected = o.status === 'rejected';

                      return (
                        <tr 
                          key={o.id} 
                          className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-indigo-950/30' : ''}`}
                        >
                          {/* 0. BULK SELECT CHECKBOX */}
                          <td className="py-4 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOrder(o.id)}
                              className="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          {/* 1. ORDER ID */}
                          <td className="py-4 px-4">
                            <div className="font-mono font-bold text-blue-400 text-sm">{o.id}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{formatDate(o.createdAt)}</div>
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
                                  className="w-20 h-20 object-cover rounded-2xl border-2 border-slate-700 shadow-md group-hover:border-indigo-500 group-hover:scale-105 transition-all" 
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

                          {/* 3. CUSTOMER NAME */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-white text-sm">{o.customerCompany}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{o.customerName}</div>
                            {o.customerPhone && (
                              <div className="text-[10px] text-slate-500 font-mono">{o.customerPhone}</div>
                            )}
                          </td>

                          {/* 4. BRAND AND ITEM SPECS */}
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                {firstItem.itemCode || firstItem.name || 'ITEM'}
                              </span>
                              <span className="font-extrabold text-white text-sm">
                                {firstItem.brandName || o.customerCompany}
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
                            {o.items.length > 1 && (
                              <span className="inline-block mt-1 text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-md border border-slate-700 font-semibold">
                                + {o.items.length - 1} more item(s)
                              </span>
                            )}
                          </td>

                          {/* 5. DORI AND PLASTIC */}
                          <td className="py-4 px-4 text-xs space-y-1">
                            <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-slate-200">
                              🧵 Dori: <strong>{firstItem.dori || 'Reg.'}</strong>
                            </div>
                            <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-slate-200">
                              🔒 Plastic: <strong>{firstItem.plastic || 'Reg.'}</strong>
                            </div>
                          </td>

                          {/* 6. STATUS */}
                          <td className="py-4 px-4 space-y-1.5">
                            <div>
                              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase inline-flex items-center space-x-1 ${
                                o.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 shadow-emerald-900/20' :
                                o.status === 'rejected' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                                o.status === 'in_production' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                                o.status === 'delivered' ? 'bg-purple-950 text-purple-400 border border-purple-800' :
                                o.status === 'pending' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                                'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                <span>{STAGES.find(s => s.key === o.status)?.icon || '●'}</span>
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
                              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500 w-full"
                            >
                              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                          </td>

                          {/* 7. TOTAL AMT */}
                          <td className="py-4 px-4 text-right font-extrabold text-emerald-400 font-mono text-sm whitespace-nowrap">
                            {formatCurrency(o.total)}
                          </td>

                          {/* 8. APPROVE / REJECT */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveOrder(o)}
                                  disabled={isApproved}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                                    isApproved 
                                      ? 'bg-emerald-950/60 text-emerald-500/60 border border-emerald-900 cursor-not-allowed' 
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 active:scale-95'
                                  }`}
                                  title={isApproved ? 'Order already approved' : 'Approve this manufacturing order'}
                                >
                                  <span>✓</span>
                                  <span>Approve</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRejectOrder(o)}
                                  disabled={isRejected}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                                    isRejected 
                                      ? 'bg-rose-950/60 text-rose-500/60 border border-rose-900 cursor-not-allowed' 
                                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/20 active:scale-95'
                                  }`}
                                  title={isRejected ? 'Order already rejected' : 'Reject this order'}
                                >
                                  <span>✕</span>
                                  <span>Reject</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => onOpenInvoice(o)}
                                className="text-[11px] text-slate-400 hover:text-slate-200 underline mt-0.5"
                              >
                                📄 View Invoice
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
                  <div key={stg} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                      <span>{stg.replace('_', ' ')}</span>
                      <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700">
                        {orders.filter(o => o.status === stg).length}
                      </span>
                    </h4>
                    <div className="space-y-2">
                      {orders.filter(o => o.status === stg).map(o => (
                        <div key={o.id} className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs space-y-2">
                          <div className="flex justify-between font-mono font-bold text-blue-400">
                            <span>{o.id}</span>
                            <span className="text-emerald-400">{formatCurrency(o.total)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {o.items[0]?.image && (
                              <img src={o.items[0].image} alt="Art" className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
                            )}
                            <div>
                              <div className="font-semibold text-white">{o.customerCompany}</div>
                              <div className="text-[10px] text-slate-400">
                                {o.items[0]?.brandName} &bull; {o.items[0]?.type}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                            <span className="text-[10px] text-slate-400">{o.items[0]?.dori || 'Reg.'}</span>
                            <div className="space-x-1">
                              {o.status !== 'approved' && (
                                <button onClick={() => handleApproveOrder(o)} className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">✓</button>
                              )}
                              {o.status !== 'rejected' && (
                                <button onClick={() => handleRejectOrder(o)} className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded font-bold">✕</button>
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
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-slate-200 animate-fade-in space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Generate Commercial Invoice</h3>
            <p className="text-xs text-slate-400">Issue an invoice against a completed manufacturing order.</p>
          </div>

          <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4 pt-2 border-t border-slate-800">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Select Order to Bill</label>
              <select
                value={invOrderId}
                onChange={(e) => setInvOrderId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {orders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.id} &bull; {o.customerCompany} &bull; {formatCurrency(o.total)} ({o.status})
                  </option>
                ))}
              </select>
            </div>

            {targetOrder && (
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-white">{targetOrder.customerCompany} ({targetOrder.customerName})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Items:</span>
                  <span className="text-slate-200">{targetOrder.items.map(i => i.name).join(', ')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-700">
                  <span className="text-white">Total Billable:</span>
                  <span className="text-emerald-400 font-mono">{formatCurrency(targetOrder.total)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">Payment Due Date</label>
              <input
                type="date"
                value={invDueDate}
                onChange={(e) => setInvDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow transition-all"
            >
              Generate Commercial Invoice
            </button>
          </form>
        </div>
      )}

      {/* MODULE 4: VIEW ALL INVOICES */}
      {activeTab === 'all_invoices' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
            <h3 className="font-bold text-white text-base mb-1">Commercial Invoices Register</h3>
            <p className="text-xs text-slate-400 mb-4">Master record of all tax invoices and payment collections.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 rounded-xl">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Customer Party</th>
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Collected</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{inv.id}</td>
                      <td className="py-3.5 px-4 font-bold text-white">{inv.customerCompany || inv.customerName}</td>
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
                            const linkedOrder = orders.find(o => o.id === inv.orderId) || { ...inv, shippingAddress: 'Client Registered Address', priority: 'standard' };
                            onOpenInvoice(linkedOrder);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs font-semibold"
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-800 gap-3">
              <div>
                <h3 className="font-bold text-white text-base">Party-Wise Customer Ledgers</h3>
                <p className="text-xs text-slate-400">Statement of Account with double-entry debits and credits.</p>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-xs text-slate-400">Select Party:</label>
                <select
                  value={selectedLedgerPartyId}
                  onChange={(e) => setSelectedLedgerPartyId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                >
                  {users.customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Invoiced (Debits)</span>
                <span className="text-lg font-bold text-white">{formatCurrency(partyLedger.totalDebited)}</span>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Received (Credits)</span>
                <span className="text-lg font-bold text-emerald-400">{formatCurrency(partyLedger.totalCredited)}</span>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Net Balance</span>
                <span className="text-lg font-black text-amber-400">{formatCurrency(partyLedger.closingBalance)}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 rounded-xl">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Transaction / Type</th>
                    <th className="py-3 px-4">Ref / Doc No</th>
                    <th className="py-3 px-4">Particulars</th>
                    <th className="py-3 px-4 text-right">Debit (₹)</th>
                    <th className="py-3 px-4 text-right">Credit (₹)</th>
                    <th className="py-3 px-4 text-right">Running Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {partyLedger.journal.map((j, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-400">{formatDate(j.date)}</td>
                      <td className="py-3 px-4 font-bold text-white">{j.type}</td>
                      <td className="py-3 px-4 font-mono text-blue-400">{j.refNo}</td>
                      <td className="py-3 px-4 text-slate-300">{j.particulars}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">{j.debit > 0 ? formatCurrency(j.debit) : '—'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{j.credit > 0 ? formatCurrency(j.credit) : '—'}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-amber-400">{formatCurrency(j.balance)}</td>
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
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
            <h3 className="font-bold text-white text-base mb-1">Record Inward Payment</h3>
            <p className="text-xs text-slate-400 mb-4">Post client collections to update outstanding ledgers.</p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Customer Party</label>
                <select
                  value={payCustId}
                  onChange={(e) => setPayCustId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {users.customers.map(c => (
                    <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Knock-off Invoice (Optional)</label>
                <select
                  value={payInvId}
                  onChange={(e) => setPayInvId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
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
                  <label className="text-xs text-slate-400 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white"
                  >
                    <option value="NEFT / Bank Transfer">NEFT / RTGS</option>
                    <option value="UPI (Corporate)">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Reference / UTR No</label>
                <input
                  type="text"
                  value={payRefNo}
                  onChange={(e) => setPayRefNo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Remarks</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow transition-all mt-2"
              >
                Post Payment Receipt
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
            <h3 className="font-bold text-white text-base mb-1">Recent Collections Log</h3>
            <p className="text-xs text-slate-400 mb-4">Historical receipts posted to accounts.</p>

            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 rounded-xl">
                <tr>
                  <th className="py-3 px-4">Receipt No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Mode & Ref</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">{p.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{p.customerCompany || p.customerName}</td>
                    <td className="py-3.5 px-4">{formatDate(p.date)}</td>
                    <td className="py-3.5 px-4">{p.paymentMode} ({p.referenceNumber})</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* MODULE 7: PRODUCTION FLOW MANAGER */}
      {activeTab === 'production' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
            <h3 className="font-bold text-white text-base mb-1">Shop-Floor Production Flow Manager</h3>
            <p className="text-xs text-slate-400 mb-4">Job cards, machine workstations, and factory quality stage tracking.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {production.map(job => (
                <div key={job.jobId} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-bold text-xs text-blue-400">{job.jobId}</span>
                        <h4 className="font-bold text-sm text-white mt-0.5">{job.itemName}</h4>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        job.priority === 'urgent' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {job.priority}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <div>🏭 <strong>Workstation:</strong> {job.workstation}</div>
                      <div>👤 <strong>Operator:</strong> {job.assignedOperator}</div>
                      <div>📋 <strong>QC Notes:</strong> <span className="text-slate-400 italic">{job.qcNotes}</span></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Current Stage</span>
                      <span className="font-bold text-indigo-300 text-xs uppercase">{job.stage.replace('_', ' ')}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {job.stage === 'running_line' && (
                        <button
                          onClick={() => handleAdvanceProductionStage(job, 'quality_checked')}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow"
                        >
                          Pass QC Check &rarr;
                        </button>
                      )}
                      {job.stage === 'quality_checked' && (
                        <button
                          onClick={() => handleAdvanceProductionStage(job, 'packaged')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow"
                        >
                          Mark Ready for Dispatch &rarr;
                        </button>
                      )}
                      {job.stage === 'packaged' && (
                        <span className="text-xs text-emerald-400 font-bold">✓ Ready for Courier</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 8: ATTENDANCE & PAYROLL FOR STAFF */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
            <h3 className="font-bold text-white text-base mb-1">Today&apos;s Staff Attendance Log</h3>
            <table className="w-full text-left text-xs text-slate-300 mt-3">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 rounded-xl">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Check In</th>
                  <th className="py-3 px-4">Check Out</th>
                  <th className="py-3 px-4">Overtime</th>
                  <th className="py-3 px-4 text-right">Quick Mark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payroll.dailyAttendance.map(att => (
                  <tr key={att.staffId} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-white">{att.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        att.status === 'Present' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {att.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{att.checkIn}</td>
                    <td className="py-3.5 px-4 font-mono">{att.checkOut}</td>
                    <td className="py-3.5 px-4 text-indigo-400 font-bold">{att.overtime}</td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleToggleAttendance(att.staffId, 'Present')}
                        className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleToggleAttendance(att.staffId, 'Leave')}
                        className="bg-rose-950 text-rose-400 border border-rose-800 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                      >
                        Leave
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-slate-200">
            <h3 className="font-bold text-white text-base mb-1">Monthly Staff Payroll & Salary Computation</h3>
            <table className="w-full text-left text-xs text-slate-300 mt-3">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-800/60 rounded-xl">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Base Wage</th>
                  <th className="py-3 px-4">Present Days</th>
                  <th className="py-3 px-4">Net Payable</th>
                  <th className="py-3 px-4">Disbursement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payroll.staffSummary.map(staff => (
                  <tr key={staff.staffId} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-white">{staff.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{staff.role}</td>
                    <td className="py-3.5 px-4 font-mono">{formatCurrency(staff.monthlySalary)}</td>
                    <td className="py-3.5 px-4">{staff.presentDays} / {staff.workingDays}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-400 font-mono">{formatCurrency(staff.netPayable)}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {staff.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

window.uBMS.AdminPortal = AdminPortal;
