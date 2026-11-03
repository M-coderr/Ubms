// Dashboard V18 (Customer Dashboard Redesign & Enterprise OMS Dashboard)
window.uBMS = window.uBMS || {};

function DashboardV18({
  activeTab = 'dashboard',
  portalType = 'customer',
  persona,
  orders = [],
  invoices = [],
  payments = [],
  estimates = [],
  messages = [],
  users = { team: [], customers: [] },
  onNavigateTab,
  onOpenInvoice
}) {
  // ---------------------------------------------------------------------------
  // SHARED STATE & ASSISTANT STATE
  // ---------------------------------------------------------------------------
  const [isSageOpen, setIsSageOpen] = React.useState(false);
  const [sageQuery, setSageQuery] = React.useState('');
  const [sageChat, setSageChat] = React.useState([
    {
      sender: 'sage',
      text: `Hello ${persona?.name || 'there'}! I'm your uBMS smart assistant. Ask me anything about your orders, invoices, or account balances.`
    }
  ]);
  const [topStudioCard, setTopStudioCard] = React.useState(0);

  // Customer Dashboard Specific State
  const [nowBarTab, setNowBarTab] = React.useState('last_order'); // 'last_order' | 'pending_review' | 'last_bill'
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const [isMessageOpen, setIsMessageOpen] = React.useState(false);
  const [dismissedNotifications, setDismissedNotifications] = React.useState([]);

  // Auto-set the most relevant Now Bar tab on mount or data changes
  React.useEffect(() => {
    const hasPendingReview = orders.some(o => o.status === 'placed' || o.status === 'pending');
    if (hasPendingReview) {
      setNowBarTab('pending_review');
    } else if (orders.length > 0) {
      setNowBarTab('last_order');
    } else if (invoices.length > 0) {
      setNowBarTab('last_bill');
    }
  }, [orders.length, invoices.length]);

  // Global Keyboard shortcut: Cmd+K / Ctrl+K opens search, Esc closes
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationOpen(false);
        setIsMessageOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ---------------------------------------------------------------------------
  // DATA CALCULATIONS
  // ---------------------------------------------------------------------------
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => 
    o.status === 'placed' || 
    o.status === 'pending' || 
    o.status === 'approved' || 
    o.status === 'in_production' || 
    o.status === 'ready_dispatch'
  ).length;
  const inProductionOrders = orders.filter(o => o.status === 'in_production').length;
  const strictPendingOrders = orders.filter(o => o.status === 'placed' || o.status === 'pending').length;
  const approvedOrders = orders.filter(o => o.status === 'approved' || o.status === 'confirmed').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'shipped').length;
  
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  
  // Outstanding ledger dues calculation (prefers real invoice balances, falls back to unpaid orders)
  const invoiceList = invoices || [];
  const outstandingAmount = invoiceList.length > 0
    ? invoiceList.reduce((sum, inv) => sum + (Number(inv.balanceDue !== undefined ? inv.balanceDue : inv.total) || 0), 0)
    : orders.filter(o => o.paymentStatus !== 'paid').reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const unsettledInvoices = invoiceList.filter(inv => inv.status !== 'paid' && Number(inv.balanceDue !== undefined ? inv.balanceDue : inv.total) > 0);
  
  const customerList = users?.customers || [];
  const totalCustomers = customerList.length || 1;
  const fulfillmentRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 100;

  const formatCurrency = (val) => {
    return '\u20B9' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const formatDate = (isoOrDateStr) => {
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
  };

  // Helper to ensure customers only see their customer order number (e.g. MGC01), never full admin order ID
  const getCustomerOrderNumber = (orderOrId) => {
    if (!orderOrId) return '';
    if (window.uBMS && typeof window.uBMS.getCustomerFacingOrderId === 'function') {
      const res = window.uBMS.getCustomerFacingOrderId(orderOrId);
      if (res) return res;
    }
    if (typeof orderOrId === 'object') {
      if (orderOrId.customerOrderId) return orderOrId.customerOrderId;
      const rawId = orderOrId.id || orderOrId.orderId || '';
      return rawId.includes('-') ? rawId.split('-').pop() : rawId;
    }
    const idStr = String(orderOrId).trim();
    const found = orders.find(o => o.id === idStr || o.customerOrderId === idStr);
    if (found && found.customerOrderId) return found.customerOrderId;
    return idStr.includes('-') ? idStr.split('-').pop() : idStr;
  };

  // Dynamic Time-Based Greeting
  const hour = new Date().getHours();
  const greetingText = hour >= 5 && hour < 12 ? 'Good morning' : hour >= 12 && hour < 17 ? 'Good afternoon' : 'Good evening';
  const customerName = persona?.name || 'Customer';
  const customerFirstName = customerName.split(' ')[0] || customerName;
  const customerCompany = persona?.company || 'MG Creation';

  // Key entities for the Samsung Now Bar Widget
  const lastPlacedOrder = orders.length > 0 ? orders[0] : null;
  const pendingReviewOrder = orders.find(o => o.status === 'placed' || o.status === 'pending') || (estimates.length > 0 ? estimates[0] : null);
  const lastGeneratedBill = invoiceList.length > 0 ? invoiceList[0] : null;

  // Real Notifications List
  const notificationsList = React.useMemo(() => {
    const list = [];
    orders.forEach(o => {
      const custOrdNum = getCustomerOrderNumber(o);
      if (o.status === 'placed' || o.status === 'pending') {
        list.push({
          id: `notif-review-${o.id}`,
          type: 'review',
          title: `Order #${custOrdNum} awaiting review`,
          desc: `${o.items?.[0]?.brandName || 'Custom'} items awaiting design & commercial confirmation.`,
          time: formatDate(o.createdAt),
          tab: 'order_register',
          color: 'amber'
        });
      } else if (o.status === 'in_production') {
        list.push({
          id: `notif-prod-${o.id}`,
          type: 'production',
          title: `Order #${custOrdNum} is in production`,
          desc: `Printing & die-punch manufacturing actively in progress.`,
          time: formatDate(o.createdAt),
          tab: 'order_register',
          color: 'sky'
        });
      } else if (o.status === 'ready_dispatch') {
        list.push({
          id: `notif-ready-${o.id}`,
          type: 'dispatch',
          title: `Order #${custOrdNum} ready for dispatch`,
          desc: `Quality check passed. Packaged and prepared for courier dispatch.`,
          time: formatDate(o.createdAt),
          tab: 'order_register',
          color: 'purple'
        });
      }
    });

    invoiceList.forEach(inv => {
      if (inv.status !== 'paid' && Number(inv.balanceDue || inv.total) > 0) {
        list.push({
          id: `notif-bill-${inv.id}`,
          type: 'billing',
          title: `Invoice #${inv.id} has balance due`,
          desc: `Unsettled amount of ${formatCurrency(inv.balanceDue || inv.total)}.`,
          time: formatDate(inv.issueDate || inv.createdAt),
          tab: 'outstanding_ledger',
          color: 'rose',
          invoice: inv
        });
      }
    });

    return list.filter(item => !dismissedNotifications.includes(item.id));
  }, [orders, invoiceList, dismissedNotifications]);

  // Live Search Filtering
  const searchResults = React.useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return { matchedOrders: [], matchedInvoices: [] };

    const matchedOrders = orders.filter(o => {
      if (o.id && o.id.toLowerCase().includes(q)) return true;
      if (o.customerOrderId && o.customerOrderId.toLowerCase().includes(q)) return true;
      if (o.status && o.status.toLowerCase().includes(q)) return true;
      if (o.items && o.items.some(it => 
        (it.brandName && it.brandName.toLowerCase().includes(q)) || 
        (it.name && it.name.toLowerCase().includes(q)) ||
        (it.material && it.material.toLowerCase().includes(q))
      )) return true;
      return false;
    });

    const matchedInvoices = invoiceList.filter(inv => {
      if (inv.id && inv.id.toLowerCase().includes(q)) return true;
      if (inv.orderId && inv.orderId.toLowerCase().includes(q)) return true;
      if (inv.status && inv.status.toLowerCase().includes(q)) return true;
      return false;
    });

    return { matchedOrders, matchedInvoices };
  }, [orders, invoiceList, searchQuery]);

  // ---------------------------------------------------------------------------
  // SAGE AI ASSISTANT QUERY HANDLER
  // ---------------------------------------------------------------------------
  const handleSageAsk = (questionText) => {
    const q = (questionText || sageQuery).trim();
    if (!q) return;

    const newChat = [...sageChat, { sender: 'user', text: q }];
    setSageChat(newChat);
    setSageQuery('');
    if (!isSageOpen) setIsSageOpen(true);

    setTimeout(() => {
      let reply = "";
      const lower = q.toLowerCase();
      if (lower.includes('order') || lower.includes('status') || lower.includes('last')) {
        if (lastPlacedOrder) {
          reply = `You have ${totalOrders} total orders booked. ${deliveredOrders} are delivered, ${inProductionOrders} currently on the production floor, and ${strictPendingOrders} awaiting review. Your latest order is #${getCustomerOrderNumber(lastPlacedOrder)} for ${lastPlacedOrder.items?.[0]?.brandName || 'Custom'} (${formatCurrency(lastPlacedOrder.total)}) with status "${lastPlacedOrder.status}".`;
        } else {
          reply = `You currently have 0 orders in the system. You can easily start a custom packaging run by clicking "+ New Order".`;
        }
      } else if (lower.includes('due') || lower.includes('outstanding') || lower.includes('balance') || lower.includes('money') || lower.includes('pay')) {
        reply = `Current outstanding dues across unsettled invoices total ${formatCurrency(outstandingAmount)} (${unsettledInvoices.length} unsettled bills). You can review all ledger items in the Outstanding Ledger tab.`;
      } else if (lower.includes('bill') || lower.includes('invoice')) {
        if (lastGeneratedBill) {
          reply = `There are ${invoiceList.length} invoices generated. The most recent invoice is #${lastGeneratedBill.id} for ${formatCurrency(lastGeneratedBill.total)} (Balance: ${formatCurrency(lastGeneratedBill.balanceDue || 0)}).`;
        } else {
          reply = `No invoices have been issued yet. Billing invoices are automatically generated as soon as your manufacturing runs are approved.`;
        }
      } else if (lower.includes('place') || lower.includes('new order') || lower.includes('book')) {
        reply = `To place a new order, click the "+ New Order" button at the top right of your dashboard, or select Place Order from the sidebar. You can configure custom hang tags, PU leather patches, woven labels, and rigid boxes.`;
      } else {
        reply = `Regarding "${q}": All operations are running smoothly. You have ${totalOrders} total orders (${inProductionOrders} in production) and your fulfillment rate is ${fulfillmentRate}%. Outstanding balance is ${formatCurrency(outstandingAmount)}.`;
      }

      setSageChat(prev => [...prev, { sender: 'sage', text: reply }]);
    }, 350);
  };

  // Helper to trigger invoice modal
  const handleOpenInvoiceModal = (invOrOrd) => {
    if (!onOpenInvoice) {
      if (onNavigateTab) onNavigateTab('invoice_list');
      return;
    }
    const matchingOrder = orders.find(o => o.id === (invOrOrd.orderId || invOrOrd.id));
    onOpenInvoice(matchingOrder || invOrOrd);
  };

  // ---------------------------------------------------------------------------
  // VIEW: PROFILE VIEW (when profile tab is active)
  // ---------------------------------------------------------------------------
  if (activeTab === 'profile') {
    return (
      <div className="space-y-6 animate-fade-in max-w-[1500px] mx-auto text-stone-800">
        <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
                {persona?.avatar || (persona?.name ? persona.name.slice(0, 2).toUpperCase() : 'ME')}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-stone-900">{persona?.name || 'Account User'}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  {persona?.company || persona?.roleLabel || (persona?.isCustomer ? 'Client Partner' : 'Enterprise Staff')}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  ✉ {persona?.email || 'user@ubms.internal'} &bull; 📞 {persona?.phone || '+91 98250 00000'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('dashboard')}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-stone-100">
            <div className="bg-stone-50 border border-stone-200/70 p-4 rounded-2xl">
              <span className="text-xs text-stone-400 font-medium">Orders Placed</span>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-1">{totalOrders}</div>
            </div>
            <div className="bg-stone-50 border border-stone-200/70 p-4 rounded-2xl">
              <span className="text-xs text-stone-400 font-medium">In Production</span>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-1">{inProductionOrders}</div>
            </div>
            <div className="bg-stone-50 border border-stone-200/70 p-4 rounded-2xl">
              <span className="text-xs text-stone-400 font-medium">Total Volume</span>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-1">{formatCurrency(totalRevenue)}</div>
            </div>
            <div className="bg-stone-50 border border-stone-200/70 p-4 rounded-2xl">
              <span className="text-xs text-stone-400 font-medium">Fulfillment Rate</span>
              <div className="text-2xl font-bold font-mono text-stone-900 mt-1">{fulfillmentRate}%</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: CUSTOMER DASHBOARD (REDESIGNED EXACTLY AS REQUESTED)
  // ---------------------------------------------------------------------------
  if (portalType === 'customer') {
    return (
      <div className="relative min-h-[calc(100vh-6rem)] w-full text-stone-800 pb-20 font-sans animate-fade-in">
        
        {/* ===================================================================== */}
        {/* TOP BAR: GREETING (LEFT) & ACTIONS: SEARCH, NEW ORDER, NOTIF, MSG     */}
        {/* ===================================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 pt-1">
          
          {/* Left Top: Greeting Customer */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
              {persona?.avatar || (persona?.name ? persona.name.slice(0, 2).toUpperCase() : 'CU')}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                  {greetingText}, {customerFirstName}!
                </h1>
                <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Verified Client</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5 flex items-center space-x-1.5">
                <span className="font-semibold text-stone-700">{customerCompany}</span>
                <span>&bull;</span>
                <span>Tags, Labels &amp; Packaging Order Operations</span>
              </p>
            </div>
          </div>

          {/* Right Top: Search, New Order, Notification, Message */}
          <div className="flex items-center space-x-2.5 relative">
            
            {/* 1. Working Search Pill */}
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center bg-white border border-stone-200/80 rounded-full pl-4 pr-1 py-1 shadow-xs hover:border-stone-400 transition-all cursor-pointer group"
              title="Search orders, bills, and items (⌘K)"
            >
              <span className="text-xs text-stone-400 group-hover:text-stone-600 pr-3 font-normal">
                Search orders, bills...
              </span>
              <span className="text-[10px] text-stone-400 border border-stone-200 rounded px-1.5 py-0.5 mr-2 font-mono hidden md:inline">
                ⌘K
              </span>
              <div className="w-7 h-7 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center group-hover:scale-105 transition-all">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {/* 2. Working + New Order Button */}
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('place_order')}
              className="inline-flex items-center space-x-1.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xs cursor-pointer active:scale-95 transition-all"
              title="Place a new custom manufacturing run"
            >
              <span className="text-sm font-bold leading-none">+</span>
              <span>New Order</span>
            </button>

            {/* 3. Working Notification Bell Icon & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsNotificationOpen(prev => !prev);
                  setIsMessageOpen(false);
                }}
                className={`relative w-9 h-9 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all ${
                  isNotificationOpen ? 'ring-2 ring-stone-900 border-stone-900' : ''
                }`}
                title="Order & Billing Alerts"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notificationsList.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                    {notificationsList.length}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white border border-stone-200/90 rounded-3xl shadow-2xl p-4 z-50 animate-fade-in text-stone-800">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-stone-900">Notifications &amp; Alerts</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 font-mono">
                        {notificationsList.length}
                      </span>
                    </div>
                    {notificationsList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDismissedNotifications(notificationsList.map(n => n.id));
                        }}
                        className="text-[11px] text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="py-2 divide-y divide-stone-50 max-h-72 overflow-y-auto space-y-1">
                    {notificationsList.length > 0 ? (
                      notificationsList.map(item => (
                        <div 
                          key={item.id}
                          onClick={() => {
                            setIsNotificationOpen(false);
                            if (item.invoice) {
                              handleOpenInvoiceModal(item.invoice);
                            } else if (onNavigateTab) {
                              onNavigateTab(item.tab || 'order_register');
                            }
                          }}
                          className="p-2.5 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer flex items-start space-x-3 text-left"
                        >
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            item.color === 'amber' ? 'bg-amber-500' :
                            item.color === 'sky' ? 'bg-sky-500' :
                            item.color === 'purple' ? 'bg-purple-500' : 'bg-rose-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-stone-900 leading-tight">
                              {item.title}
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-2">
                              {item.desc}
                            </p>
                            <span className="text-[10px] text-stone-400 font-mono mt-1 block">
                              {item.time}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-stone-400 font-medium">
                        ✓ All caught up! No unread notifications.
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-100 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        if (onNavigateTab) onNavigateTab('order_register');
                      }}
                      className="text-xs text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
                    >
                      View Order Alerts &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Working Message Icon & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsMessageOpen(prev => !prev);
                  setIsNotificationOpen(false);
                }}
                className={`relative w-9 h-9 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all ${
                  isMessageOpen ? 'ring-2 ring-stone-900 border-stone-900' : ''
                }`}
                title="Account Manager Messages & Support"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white" />
              </button>

              {/* Message Popover */}
              {isMessageOpen && (
                <div className="absolute right-0 top-11 w-80 sm:w-88 bg-white border border-stone-200/90 rounded-3xl shadow-2xl p-4 z-50 animate-fade-in text-stone-800">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-stone-900">Account Support</span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">Direct Desk</span>
                  </div>

                  <div className="py-3">
                    <div className="flex items-center space-x-3 p-3 bg-stone-50 rounded-2xl border border-stone-200/60">
                      <div className="w-10 h-10 rounded-full bg-stone-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        PM
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-stone-900">Parth (Account Desk)</div>
                        <p className="text-[11px] text-stone-500 truncate">Senior Production Coordinator</p>
                        <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">● Online for order queries</p>
                      </div>
                    </div>

                    <p className="text-xs text-stone-500 mt-3 px-1 leading-relaxed">
                      Need custom die punching, expedited dispatch, or invoice reconciliation? Chat directly with your production lead.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMessageOpen(false);
                        if (onNavigateTab) onNavigateTab('chat');
                      }}
                      className="flex-1 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-semibold shadow-xs cursor-pointer text-center transition-all"
                    >
                      Open Live Chat &rarr;
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMessageOpen(false);
                        setIsSageOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer transition-all"
                      title="Ask AI Assistant"
                    >
                      AI Help
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ===================================================================== */}
        {/* INTERACTIVE SEARCH MODAL (Triggered via Search Pill or ⌘K)           */}
        {/* ===================================================================== */}
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            <div 
              onClick={() => setIsSearchOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
            />
            <div className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-2xl p-5 z-10 animate-fade-in text-stone-800">
              
              {/* Search Bar Input */}
              <div className="flex items-center space-x-3 pb-3 border-b border-stone-100">
                <svg className="w-5 h-5 text-stone-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order ID, brand name, item name, or invoice #..."
                  className="w-full text-sm font-medium text-stone-900 placeholder-stone-400 bg-transparent outline-hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-bold text-stone-400 hover:text-stone-700 px-2 py-1"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Instant Search Results */}
              <div className="py-4 max-h-96 overflow-y-auto space-y-4">
                {searchQuery.trim() ? (
                  <>
                    {/* Matched Orders */}
                    <div>
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                        Orders ({searchResults.matchedOrders.length})
                      </div>
                      {searchResults.matchedOrders.length > 0 ? (
                        <div className="space-y-2">
                          {searchResults.matchedOrders.slice(0, 4).map(ord => (
                            <div 
                              key={ord.id}
                              onClick={() => {
                                setIsSearchOpen(false);
                                if (onNavigateTab) onNavigateTab('order_register');
                              }}
                              className="p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex items-center justify-between"
                            >
                              <div>
                                <div className="text-xs font-bold text-stone-900 font-mono">
                                  #{getCustomerOrderNumber(ord)}
                                </div>
                                <div className="text-xs text-stone-600 font-medium">
                                  {ord.items?.[0]?.brandName || 'Custom'} &bull; {ord.items?.[0]?.name || 'Hang Tags & Labels'}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-mono font-bold text-stone-900">
                                  {formatCurrency(ord.total)}
                                </span>
                                <span className="block text-[10px] font-semibold text-stone-500 uppercase">
                                  {ord.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-stone-400 py-1 font-medium">No matching orders found</div>
                      )}
                    </div>

                    {/* Matched Invoices */}
                    <div className="pt-2 border-t border-stone-100">
                      <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                        Bills &amp; Invoices ({searchResults.matchedInvoices.length})
                      </div>
                      {searchResults.matchedInvoices.length > 0 ? (
                        <div className="space-y-2">
                          {searchResults.matchedInvoices.slice(0, 3).map(inv => (
                            <div 
                              key={inv.id}
                              onClick={() => {
                                setIsSearchOpen(false);
                                handleOpenInvoiceModal(inv);
                              }}
                              className="p-3 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer flex items-center justify-between"
                            >
                              <div>
                                <div className="text-xs font-bold text-stone-900 font-mono">
                                  #{inv.id}
                                </div>
                                <div className="text-xs text-stone-500 font-medium">
                                  Order Ref: #{getCustomerOrderNumber(inv.orderId) || 'Direct'}
                                </div>
                              </div>
                              <div className="text-right flex items-center space-x-3">
                                <div>
                                  <div className="text-xs font-mono font-bold text-stone-900">
                                    {formatCurrency(inv.total)}
                                  </div>
                                  <div className="text-[10px] font-semibold text-amber-700">
                                    Due: {formatCurrency(inv.balanceDue || 0)}
                                  </div>
                                </div>
                                <span className="text-xs bg-stone-900 text-white px-2.5 py-1 rounded-lg font-semibold">
                                  View Bill
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-stone-400 py-1 font-medium">No matching bills found</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-xs text-stone-500">
                      Type to search your manufacturing orders, tax invoices, and specifications.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          if (onNavigateTab) onNavigateTab('place_order');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 cursor-pointer"
                      >
                        + Book New Order
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          if (onNavigateTab) onNavigateTab('outstanding_ledger');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 cursor-pointer"
                      >
                        Outstanding Ledger
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSearchOpen(false);
                          setIsSageOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 cursor-pointer"
                      >
                        Ask AI Assistant
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SAMSUNG "NOW BAR" TYPE WIDGET (IMPORTANT INFO AT A GLANCE)            */}
        {/* ===================================================================== */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.03)] relative overflow-hidden transition-all">
          
          {/* Subtle Samsung Galaxy Aura Top Glow */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-stone-900 via-emerald-600 to-indigo-600 opacity-80" />

          {/* Now Bar Header Bar: Samsung Pill + Glanceable Switcher Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            
            {/* Left: Samsung Style Now Badge */}
            <div className="flex items-center space-x-2.5">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-stone-900 text-white text-[11px] font-bold tracking-wide shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>✦ NOW BRIEF</span>
              </span>
              <span className="text-xs font-medium text-stone-500 hidden md:inline">
                Glanceable updates for your active orders &amp; account
              </span>
            </div>

            {/* Right: 3 Interactive Now Bar Switcher Pills */}
            <div className="flex items-center space-x-1.5 bg-stone-100/90 p-1 rounded-2xl overflow-x-auto scrollbar-none">
              
              {/* Tab 1: Last Placed Order */}
              <button
                type="button"
                onClick={() => setNowBarTab('last_order')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  nowBarTab === 'last_order'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <span>📦</span>
                <span>Last Placed Order</span>
                {lastPlacedOrder && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </button>

              {/* Tab 2: Pending Order to Review */}
              <button
                type="button"
                onClick={() => setNowBarTab('pending_review')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  nowBarTab === 'pending_review'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <span>⏳</span>
                <span>Pending Review</span>
                {strictPendingOrders > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                    {strictPendingOrders}
                  </span>
                )}
              </button>

              {/* Tab 3: Last Bill Generated */}
              <button
                type="button"
                onClick={() => setNowBarTab('last_bill')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  nowBarTab === 'last_bill'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <span>🧾</span>
                <span>Latest Bill</span>
                {unsettledInvoices.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
              </button>

              {/* Quick Arrow Cycler */}
              <div className="flex items-center pl-1 space-x-0.5 border-l border-stone-200 text-stone-400">
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['last_order', 'pending_review', 'last_bill'];
                    const idx = tabs.indexOf(nowBarTab);
                    setNowBarTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
                  }}
                  className="w-6 h-6 rounded-lg hover:bg-white hover:text-stone-800 flex items-center justify-center text-xs font-bold cursor-pointer"
                  title="Previous glance"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const tabs = ['last_order', 'pending_review', 'last_bill'];
                    const idx = tabs.indexOf(nowBarTab);
                    setNowBarTab(tabs[(idx + 1) % tabs.length]);
                  }}
                  className="w-6 h-6 rounded-lg hover:bg-white hover:text-stone-800 flex items-center justify-center text-xs font-bold cursor-pointer"
                  title="Next glance"
                >
                  ›
                </button>
              </div>

            </div>

          </div>

          {/* Now Bar Dynamic Content Body */}
          <div className="pt-4">

            {/* VIEW 1: LAST PLACED ORDER */}
            {nowBarTab === 'last_order' && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                {lastPlacedOrder ? (
                  <>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center text-xl shrink-0">
                        📦
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-mono">
                            Last Placed Order
                          </span>
                          <span className="text-xs font-mono font-bold text-stone-900">
                            #{getCustomerOrderNumber(lastPlacedOrder)}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            &bull; {formatDate(lastPlacedOrder.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-stone-900 mt-1">
                          {lastPlacedOrder.items?.[0]?.brandName || 'Custom'} &bull; {lastPlacedOrder.items?.[0]?.name || 'Hang Tags & Labels'}
                        </h3>
                        <p className="text-xs text-stone-500 font-medium mt-0.5">
                          Quantity: <span className="font-semibold text-stone-800 font-mono">{(lastPlacedOrder.items?.[0]?.quantity || 1000).toLocaleString('en-IN')} pcs</span> &bull; Value: <span className="font-semibold text-stone-900 font-mono">{formatCurrency(lastPlacedOrder.total)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        lastPlacedOrder.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        lastPlacedOrder.status === 'in_production' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                        lastPlacedOrder.status === 'ready_dispatch' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        ● {lastPlacedOrder.status.replace('_', ' ').toUpperCase()}
                      </span>

                      <button
                        type="button"
                        onClick={() => onNavigateTab && onNavigateTab('order_register')}
                        className="bg-stone-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span>Track Order</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-lg">
                        🏷️
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">No orders placed yet</h4>
                        <p className="text-xs text-stone-500">Configure your first bespoke hang tag or label manufacturing batch.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('place_order')}
                      className="bg-stone-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                    >
                      + Book First Order
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: PENDING ORDER TO REVIEW */}
            {nowBarTab === 'pending_review' && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                {pendingReviewOrder ? (
                  <>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center text-xl shrink-0">
                        ⚠️
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-mono">
                            Action Required &bull; Review Needed
                          </span>
                          <span className="text-xs font-mono font-bold text-stone-900">
                            #{getCustomerOrderNumber(pendingReviewOrder)}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-stone-900 mt-1">
                          {pendingReviewOrder.items?.[0]?.brandName || 'Custom'} &bull; {pendingReviewOrder.items?.[0]?.name || 'Manufacturing Proof'}
                        </h3>
                        <p className="text-xs text-stone-500 font-medium mt-0.5">
                          Order awaiting client design and commercial confirmation before print plate allocation. Value: <span className="font-semibold text-stone-900 font-mono">{formatCurrency(pendingReviewOrder.total)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onNavigateTab && onNavigateTab('order_register')}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span>Review &amp; Confirm</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">All caught up!</h4>
                        <p className="text-xs text-stone-500">All manufacturing orders are confirmed and progressing smoothly on schedule.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('order_register')}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      View Order Register
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: LAST BILL GENERATED */}
            {nowBarTab === 'last_bill' && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                {lastGeneratedBill ? (
                  <>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center text-xl shrink-0">
                        🧾
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                            Latest Tax Invoice
                          </span>
                          <span className="text-xs font-mono font-bold text-stone-900">
                            #{lastGeneratedBill.id}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            &bull; Issued {formatDate(lastGeneratedBill.issueDate || lastGeneratedBill.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-stone-900 mt-1">
                          Commercial Bill for Order #{getCustomerOrderNumber(lastGeneratedBill.orderId) || 'Bespoke Run'}
                        </h3>
                        <p className="text-xs text-stone-500 font-medium mt-0.5">
                          Bill Total: <span className="font-semibold text-stone-900 font-mono">{formatCurrency(lastGeneratedBill.total)}</span> &bull; Outstanding Balance: <span className="font-semibold text-rose-700 font-mono">{formatCurrency(lastGeneratedBill.balanceDue || 0)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenInvoiceModal(lastGeneratedBill)}
                        className="bg-stone-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span>View Printable Bill</span>
                        <span>&rarr;</span>
                      </button>
                      {lastGeneratedBill.balanceDue > 0 && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab && onNavigateTab('outstanding_ledger')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Pay Ledger
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-lg">
                        📄
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">No bills generated yet</h4>
                        <p className="text-xs text-stone-500">Commercial tax invoices are automatically issued upon order approval.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('invoice_list')}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      View Billing Ledger
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Bottom Glance Dots (Samsung One UI Touch) */}
          <div className="flex items-center justify-center space-x-1.5 pt-4 mt-2 border-t border-stone-100/80">
            {['last_order', 'pending_review', 'last_bill'].map(tabKey => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setNowBarTab(tabKey)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  nowBarTab === tabKey ? 'w-6 bg-stone-900' : 'w-2 bg-stone-300 hover:bg-stone-400'
                }`}
                title={`Switch to ${tabKey.replace('_', ' ')}`}
              />
            ))}
          </div>

        </div>

        {/* ===================================================================== */}
        {/* ROW: TOTAL ORDERS CARD (PENDING & DELIVERED BELOW) + OUTSTANDING CARD */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          
          {/* Card 1: Total Orders (with Pending and Delivered written below) */}
          <div 
            onClick={() => onNavigateTab && onNavigateTab('order_register')}
            className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-stone-400/80 hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center text-sm font-bold">
                    📦
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Total Orders
                  </span>
                </div>
                <span className="text-xs text-stone-400 group-hover:text-stone-800 font-semibold transition-colors">
                  View Register &rarr;
                </span>
              </div>

              {/* Large Metric */}
              <div className="mt-3">
                <div className="text-4xl font-extrabold font-mono text-stone-900">
                  {totalOrders}
                </div>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  Total manufacturing runs booked with uBMS
                </p>
              </div>
            </div>

            {/* Written below in card: Pending and Delivered */}
            <div className="mt-5 pt-4 border-t border-stone-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Pending */}
                <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Pending</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-950 mt-1">
                    {pendingOrders}
                  </div>
                  <p className="text-[10px] text-amber-700/80 mt-0.5 font-medium">
                    {inProductionOrders > 0 ? `${inProductionOrders} in production` : 'Awaiting dispatch'}
                  </p>
                </div>

                {/* Delivered */}
                <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Delivered</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-950 mt-1">
                    {deliveredOrders}
                  </div>
                  <p className="text-[10px] text-emerald-700/80 mt-0.5 font-medium">
                    {fulfillmentRate}% fulfillment rate
                  </p>
                </div>
              </div>

              {/* Segmented visual progress bar */}
              <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full transition-all" 
                  style={{ width: `${totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0}%` }} 
                  title={`Delivered: ${deliveredOrders}`}
                />
                <div 
                  className="bg-sky-500 h-full transition-all" 
                  style={{ width: `${totalOrders > 0 ? (inProductionOrders / totalOrders) * 100 : 0}%` }} 
                  title={`In Production: ${inProductionOrders}`}
                />
                <div 
                  className="bg-amber-400 h-full transition-all" 
                  style={{ width: `${totalOrders > 0 ? (strictPendingOrders / totalOrders) * 100 : 0}%` }} 
                  title={`Pending: ${strictPendingOrders}`}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Outstanding Card */}
          <div 
            onClick={() => onNavigateTab && onNavigateTab('outstanding_ledger')}
            className="bg-[#415b4e] rounded-3xl p-6 text-white shadow-[0_6px_25px_rgba(65,91,78,0.25)] hover:shadow-[0_8px_30px_rgba(65,91,78,0.35)] hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-[#4d6a5c] text-emerald-100 flex items-center justify-center text-sm font-bold">
                    💰
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                    Outstanding Dues
                  </span>
                </div>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#4e6b5d] text-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Live Ledger</span>
                </span>
              </div>

              {/* Large Metric */}
              <div className="mt-3">
                <div className="text-4xl font-extrabold font-mono text-white">
                  {formatCurrency(outstandingAmount)}
                </div>
                <p className="text-xs text-emerald-100/80 font-medium mt-0.5">
                  Total unsettled balance across active accounts
                </p>
              </div>
            </div>

            {/* Written below in card: Unsettled bills breakdown & terms */}
            <div className="mt-5 pt-4 border-t border-[#4d6a5c] space-y-3">
              <div className="flex items-center justify-between text-xs text-emerald-100 font-medium">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-300" />
                  <span>{unsettledInvoices.length} Unsettled Invoices</span>
                </div>
                <span className="text-emerald-200/80 text-[11px]">
                  Standard 15-day cycle
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigateTab) onNavigateTab('outstanding_ledger');
                  }}
                  className="w-full py-2.5 rounded-2xl bg-white text-stone-900 hover:bg-stone-100 text-xs font-semibold shadow-xs transition-all cursor-pointer text-center"
                >
                  View Outstanding Ledger &rarr;
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* ROW: RECENT ORDERS AND RECENT BILLS (JUST BELOW)                      */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          
          {/* Column 1: Recent Orders */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-stone-900">Recent Orders</h3>
                  <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600">
                    {orders.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('order_register')}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer flex items-center space-x-1"
                >
                  <span>View Register</span>
                  <span>&rarr;</span>
                </button>
              </div>

              {/* Order List */}
              <div className="divide-y divide-stone-50 py-1">
                {orders.length > 0 ? (
                  orders.slice(0, 4).map(ord => (
                    <div 
                      key={ord.id}
                      onClick={() => onNavigateTab && onNavigateTab('order_register')}
                      className="py-3 flex items-center justify-between hover:bg-stone-50/80 px-2 rounded-2xl transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold font-mono text-stone-900">
                            #{getCustomerOrderNumber(ord)}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            &bull; {formatDate(ord.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-stone-700 truncate mt-0.5">
                          {ord.items?.[0]?.brandName || 'Custom Brand'} &bull; {ord.items?.[0]?.name || 'Hang Tags & Labels'}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono">
                          {(ord.items?.[0]?.quantity || 1000).toLocaleString('en-IN')} pcs
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-stone-900">
                          {formatCurrency(ord.total)}
                        </div>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                          ord.status === 'in_production' ? 'bg-sky-50 text-sky-700 border border-sky-200/60' :
                          ord.status === 'ready_dispatch' ? 'bg-purple-50 text-purple-700 border border-purple-200/60' :
                          ord.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200/60' :
                          'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}>
                          {ord.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-xs text-stone-400 font-medium">No manufacturing orders placed yet</p>
                    <button
                      type="button"
                      onClick={() => onNavigateTab && onNavigateTab('place_order')}
                      className="mt-3 text-xs bg-stone-900 hover:bg-black text-white px-4 py-2 rounded-xl font-semibold shadow-xs cursor-pointer"
                    >
                      + Place Your First Order
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('order_register')}
                className="w-full text-center text-xs text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
              >
                Inspect all past &amp; active production jobs &rarr;
              </button>
            </div>
          </div>

          {/* Column 2: Recent Bills */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-stone-900">Recent Bills</h3>
                  <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600">
                    {invoiceList.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('invoice_list')}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer flex items-center space-x-1"
                >
                  <span>View Invoices</span>
                  <span>&rarr;</span>
                </button>
              </div>

              {/* Bills List */}
              <div className="divide-y divide-stone-50 py-1">
                {invoiceList.length > 0 ? (
                  invoiceList.slice(0, 4).map(inv => (
                    <div 
                      key={inv.id}
                      className="py-3 flex items-center justify-between hover:bg-stone-50/80 px-2 rounded-2xl transition-colors group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold font-mono text-stone-900">
                            #{inv.id}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            &bull; {formatDate(inv.issueDate || inv.createdAt)}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-stone-700 truncate mt-0.5">
                          Order Ref: #{getCustomerOrderNumber(inv.orderId) || 'Direct Run'}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono">
                          Due: {formatDate(inv.dueDate || inv.expectedDelivery)}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center space-x-3">
                        <div>
                          <div className="text-xs font-mono font-bold text-stone-900">
                            {formatCurrency(inv.total)}
                          </div>
                          <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                            inv.status === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                            'bg-rose-50 text-rose-700 border border-rose-200/60'
                          }`}>
                            {inv.status ? inv.status.toUpperCase() : 'PENDING'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenInvoiceModal(inv)}
                          className="bg-stone-900 hover:bg-black text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          View Bill
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-xs text-stone-400 font-medium">No billing invoices issued yet</p>
                    <p className="text-[11px] text-stone-400 mt-1">Invoices appear here once orders are confirmed.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('outstanding_ledger')}
                className="w-full text-center text-xs text-stone-500 hover:text-stone-900 font-medium cursor-pointer"
              >
                View full customer ledger &amp; tax statements &rarr;
              </button>
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* FLOATING "ASK ASSISTANT" BUTTON (BOTTOM RIGHT)                        */}
        {/* ===================================================================== */}
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setIsSageOpen(prev => !prev)}
            className="flex items-center space-x-2.5 bg-[#18181b] hover:bg-black text-white px-4 py-2.5 rounded-full shadow-2xl border border-stone-700/60 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
            title="Ask uBMS AI Assistant"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 sage-orb-glow flex items-center justify-center">
              <div className="flex space-x-0.5">
                <span className="w-0.5 h-1.5 bg-white rounded-full sage-eye-blink" />
                <span className="w-0.5 h-1.5 bg-white rounded-full sage-eye-blink" />
              </div>
            </div>
            <span className="text-xs font-semibold tracking-wide">Ask Assistant</span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* SLIDING AI ASSISTANT DRAWER                                           */}
        {/* ===================================================================== */}
        {isSageOpen && (
          <div className="fixed inset-y-0 right-0 z-50 flex items-stretch">
            <div 
              onClick={() => setIsSageOpen(false)}
              className="fixed inset-0 bg-stone-900/20 backdrop-blur-xs transition-opacity"
            />

            <div className="relative w-full max-w-[420px] bg-white border-l border-stone-200/90 shadow-2xl flex flex-col justify-between p-6 z-10 animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 sage-orb-glow flex items-center justify-center">
                    <div className="flex space-x-0.5">
                      <span className="w-0.5 h-2 bg-white rounded-full sage-eye-blink" />
                      <span className="w-0.5 h-2 bg-white rounded-full sage-eye-blink" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 leading-none">uBMS Assistant</h3>
                    <p className="text-[10px] text-stone-400 font-medium mt-1 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Live Client Assistant</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-stone-400">
                  <button 
                    onClick={() => setIsSageOpen(false)}
                    className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content & Suggestions */}
              <div className="flex-1 overflow-y-auto py-5 space-y-4">
                <div className="flex flex-col items-center text-center pt-2 pb-4">
                  <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 sage-orb-glow flex items-center justify-center shadow-xl mb-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-4 bg-white rounded-full sage-eye-blink" />
                      <span className="w-1.5 h-4 bg-white rounded-full sage-eye-blink" />
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-stone-900">How can I assist your operations?</h4>
                  <p className="text-xs text-stone-500 max-w-xs mt-1">
                    Ask about order statuses, outstanding balances, or recent bills generated.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pb-2">
                  {[
                    { text: 'What is my latest order status?', icon: '📦' },
                    { text: 'Outstanding ledger balance?', icon: '💰' },
                    { text: 'Show my recent bills', icon: '🧾' },
                    { text: 'How do I place a new order?', icon: '🏷️' }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSageAsk(chip.text)}
                      className="p-2.5 rounded-2xl bg-stone-50 hover:bg-stone-100 border border-stone-200/70 text-left text-[11px] font-medium text-stone-700 transition-all cursor-pointer flex items-center space-x-2"
                    >
                      <span>{chip.icon}</span>
                      <span className="truncate">{chip.text}</span>
                    </button>
                  ))}
                </div>

                {/* Chat Thread */}
                <div className="space-y-3 pt-2">
                  {sageChat.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#18181b] text-white font-medium shadow-xs'
                          : 'bg-stone-100 text-stone-800 border border-stone-200/60 shadow-2xs'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <div className="pt-3 border-t border-stone-100">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSageAsk();
                  }}
                  className="flex items-center bg-stone-100 rounded-full pl-4 pr-1.5 py-1.5"
                >
                  <input
                    type="text"
                    value={sageQuery}
                    onChange={(e) => setSageQuery(e.target.value)}
                    placeholder="Ask about orders, dues, bills..."
                    className="bg-transparent border-none text-xs text-stone-900 placeholder-stone-400 flex-1 outline-hidden"
                  />
                  <button
                    type="submit"
                    className="w-7 h-7 rounded-full bg-stone-800 hover:bg-black text-white flex items-center justify-center text-xs font-bold cursor-pointer transition-all shrink-0"
                  >
                    ↑
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: ADMIN PORTAL DASHBOARD (PRESERVED FOR ENTERPRISE STAFF)
  // ---------------------------------------------------------------------------
  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full text-stone-800 pb-16 font-sans">
      
      {/* TOP HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 pt-1">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 flex items-center justify-center text-stone-800 shrink-0">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="2.2" />
              <path d="M12 2.5 C12.6 2.5, 13 3, 13 3.6 L13 6.5 C13 7.1, 12.6 7.5, 12 7.5 C11.4 7.5, 11 7.1, 11 6.5 L11 3.6 C11 3, 11.4 2.5, 12 2.5 Z" />
              <path d="M12 16.5 C12.6 16.5, 13 17, 13 17.5 L13 20.4 C13 21, 12.6 21.5, 12 21.5 C11.4 21.5, 11 21, 11 20.4 L11 17.5 C11 17, 11.4 16.5, 12 16.5 Z" />
              <path d="M2.5 12 C2.5 11.4, 3 11, 3.6 11 L6.5 11 C7.1 11, 7.5 11.4, 7.5 12 C7.5 12.6, 7.1 13, 6.5 13 L3.6 13 C3 13, 2.5 12.6, 2.5 12 Z" />
              <path d="M16.5 12 C16.5 11.4, 17 11, 17.5 11 L20.4 11 C21 11, 21.5 11.4, 21.5 12 C21.5 12.6, 21 13, 20.4 13 L17.5 13 C17 13, 16.5 12.6, 16.5 12 Z" />
              <path d="M5.3 5.3 C5.7 4.9, 6.4 4.9, 6.8 5.3 L8.9 7.4 C9.3 7.8, 9.3 8.4, 8.9 8.9 C8.4 9.3, 7.8 9.3, 7.4 8.9 L5.3 6.8 C4.9 6.4, 4.9 5.7, 5.3 5.3 Z" />
              <path d="M15.1 15.1 C15.5 14.7, 16.2 14.7, 16.6 15.1 L18.7 17.2 C19.1 17.6, 19.1 18.2, 18.7 18.7 C18.2 19.1, 17.6 19.1, 17.2 18.7 L15.1 16.6 C14.7 16.2, 14.7 15.5, 15.1 15.1 Z" />
              <path d="M18.7 5.3 C19.1 5.7, 19.1 6.4, 18.7 6.8 L16.6 8.9 C16.2 9.3, 15.5 9.3, 15.1 8.9 C14.7 8.4, 14.7 7.8, 15.1 7.4 L17.2 5.3 C17.6 4.9, 18.2 4.9, 18.7 5.3 Z" />
              <path d="M8.9 15.1 C9.3 15.5, 9.3 16.2, 8.9 16.6 L6.8 18.7 C6.4 19.1, 5.7 19.1, 5.3 18.7 C4.9 18.2, 4.9 17.6, 5.3 17.2 L7.4 15.1 C7.8 14.7, 8.4 14.7, 8.9 15.1 Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Welcome, {persona?.name || 'Administrator'}!
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Enterprise Operations &amp; Production Management
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div 
            onClick={() => setIsSageOpen(true)}
            className="flex items-center bg-white border border-stone-200/80 rounded-full pl-4 pr-1 py-1 shadow-xs hover:border-stone-400 transition-all cursor-pointer group"
          >
            <span className="text-xs text-stone-400 group-hover:text-stone-600 pr-3 font-normal">
              Search orders, invoices...
            </span>
            <div className="w-7 h-7 rounded-full bg-[#1c1c1e] text-white flex items-center justify-center">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('place_order')}
            className="inline-flex items-center space-x-1.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xs cursor-pointer transition-all"
          >
            <span>+</span>
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* ADMIN METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateTab && onNavigateTab('all_orders')}
          className="bg-white rounded-3xl p-5 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div>
            <p className="text-xs text-stone-500 font-medium">Orders Placed</p>
            <h3 className="text-2xl font-bold font-mono text-stone-900 mt-1">{totalOrders}</h3>
            <p className="text-[11px] text-stone-400 mt-0.5">{inProductionOrders} in production</p>
          </div>
          <div className="flex items-end space-x-1.5 h-10">
            <span className="w-1.5 bg-stone-800 rounded-full h-4" />
            <span className="w-1.5 bg-stone-800 rounded-full h-7" />
            <span className="w-1.5 bg-stone-800 rounded-full h-10" />
            <span className="w-1.5 bg-stone-800 rounded-full h-5" />
            <span className="w-1.5 bg-stone-800 rounded-full h-8" />
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab && onNavigateTab('all_orders')}
          className="bg-white rounded-3xl p-5 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div>
            <p className="text-xs text-stone-500 font-medium">Client Accounts</p>
            <h3 className="text-2xl font-bold font-mono text-stone-900 mt-0.5">{totalCustomers}</h3>
            <p className="text-[11px] text-stone-400">Registered brands</p>
          </div>
          <svg className="w-16 h-8 text-stone-700" viewBox="0 0 80 40" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M0,25 Q20,10 40,25 T80,12" />
          </svg>
        </div>

        <div 
          onClick={() => onNavigateTab && onNavigateTab('invoice_list')}
          className="bg-white rounded-3xl p-5 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div>
            <p className="text-xs text-stone-500 font-medium">Order Revenue</p>
            <h3 className="text-2xl font-bold font-mono text-stone-900 mt-0.5">{formatCurrency(totalRevenue)}</h3>
            <p className="text-[11px] text-stone-400">Booked value</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#f7eedf] flex items-center justify-center text-[#8d693f]">
            ₹
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab && onNavigateTab('outstanding_ledger')}
          className="bg-[#415b4e] rounded-3xl p-5 text-white shadow-[0_6px_25px_rgba(65,91,78,0.25)] flex items-center justify-between hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-emerald-100">Live Ledger</span>
            </div>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">{formatCurrency(outstandingAmount)}</h3>
            <p className="text-[11px] text-emerald-100/70 mt-0.5 font-medium">Unsettled Balance</p>
          </div>
          <svg className="w-20 h-10 text-emerald-200" viewBox="0 0 80 40" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M0,28 Q15,5 30,22 T60,10 T80,24" />
          </svg>
        </div>
      </div>

      {/* ADMIN RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <div className="bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-base font-bold text-stone-900">Recent Manufacturing Orders</h3>
            <button
              onClick={() => onNavigateTab && onNavigateTab('all_orders')}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              All Orders &rarr;
            </button>
          </div>
          <div className="space-y-3 py-3">
            {orders.length > 0 ? (
              orders.slice(0, 4).map(ord => (
                <div key={ord.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-stone-900 font-mono">#{ord.id}</div>
                    <div className="text-xs text-stone-500">{ord.customerCompany || ord.customerName}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold">{formatCurrency(ord.total)}</div>
                    <span className="text-[10px] font-semibold text-stone-500 uppercase">{ord.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-stone-400 py-4 text-center">No orders currently active</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-base font-bold text-stone-900">Recent Invoices</h3>
            <button
              onClick={() => onNavigateTab && onNavigateTab('invoice_list')}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              All Invoices &rarr;
            </button>
          </div>
          <div className="space-y-3 py-3">
            {invoiceList.length > 0 ? (
              invoiceList.slice(0, 4).map(inv => (
                <div key={inv.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-stone-900 font-mono">#{inv.id}</div>
                    <div className="text-xs text-stone-500">Order: #{inv.orderId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold">{formatCurrency(inv.total)}</div>
                    <span className="text-[10px] font-semibold text-stone-500 uppercase">{inv.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-stone-400 py-4 text-center">No invoices generated yet</div>
            )}
          </div>
        </div>
      </div>

      {/* FLOATING "ASK ASSISTANT" BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsSageOpen(prev => !prev)}
          className="flex items-center space-x-2.5 bg-[#18181b] hover:bg-black text-white px-4 py-2.5 rounded-full shadow-2xl border border-stone-700/60 cursor-pointer hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 sage-orb-glow flex items-center justify-center">
            <div className="flex space-x-0.5">
              <span className="w-0.5 h-1.5 bg-white rounded-full sage-eye-blink" />
              <span className="w-0.5 h-1.5 bg-white rounded-full sage-eye-blink" />
            </div>
          </div>
          <span className="text-xs font-semibold tracking-wide">Ask Assistant</span>
        </button>
      </div>

      {/* SLIDING ASSISTANT DRAWER */}
      {isSageOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex items-stretch">
          <div 
            onClick={() => setIsSageOpen(false)}
            className="fixed inset-0 bg-stone-900/20 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-[420px] bg-white border-l border-stone-200/90 shadow-2xl flex flex-col justify-between p-6 z-10 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 sage-orb-glow flex items-center justify-center">
                  <div className="flex space-x-0.5">
                    <span className="w-0.5 h-2 bg-white rounded-full sage-eye-blink" />
                    <span className="w-0.5 h-2 bg-white rounded-full sage-eye-blink" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 leading-none">uBMS Assistant</h3>
                  <p className="text-[10px] text-stone-400 font-medium mt-1 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Real-time local numbers</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-stone-400">
                <button 
                  onClick={() => setIsSageOpen(false)}
                  className="w-7 h-7 rounded-full hover:bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-4">
              <div className="flex flex-col items-center text-center pt-2 pb-4">
                <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 sage-orb-glow flex items-center justify-center shadow-xl mb-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-4 bg-white rounded-full sage-eye-blink" />
                    <span className="w-1.5 h-4 bg-white rounded-full sage-eye-blink" />
                  </div>
                </div>
                <h4 className="text-base font-bold text-stone-900">How can I assist your operations?</h4>
                <p className="text-xs text-stone-500 max-w-xs mt-1">
                  Query order statuses, outstanding balances, and production fulfillment.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {sageChat.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#18181b] text-white font-medium shadow-xs'
                        : 'bg-stone-100 text-stone-800 border border-stone-200/60 shadow-2xs'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSageAsk();
                }}
                className="flex items-center bg-stone-100 rounded-full pl-4 pr-1.5 py-1.5"
              >
                <input
                  type="text"
                  value={sageQuery}
                  onChange={(e) => setSageQuery(e.target.value)}
                  placeholder="Ask about orders, dues, production..."
                  className="bg-transparent border-none text-xs text-stone-900 placeholder-stone-400 flex-1 outline-hidden"
                />
                <button
                  type="submit"
                  className="w-7 h-7 rounded-full bg-stone-800 hover:bg-black text-white flex items-center justify-center text-xs font-bold cursor-pointer transition-all shrink-0"
                >
                  ↑
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

window.uBMS.DashboardV18 = DashboardV18;
