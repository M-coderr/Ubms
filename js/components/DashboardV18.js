// Dashboard V18 (Video UI elements populated with real site content and working actions)
window.uBMS = window.uBMS || {};

function DashboardV18({
  activeTab = 'dashboard',
  portalType = 'customer',
  persona,
  orders = [],
  users = { team: [], customers: [] },
  onNavigateTab
}) {
  const [isSageOpen, setIsSageOpen] = React.useState(false);
  const [sageQuery, setSageQuery] = React.useState('');
  const [sageChat, setSageChat] = React.useState([
    {
      sender: 'sage',
      text: `Hello ${persona?.name || 'there'}! I'm your uBMS smart assistant. Ask me anything about your orders, invoices, or client balances.`
    }
  ]);
  const [topStudioCard, setTopStudioCard] = React.useState(0);

  // Real data calculations
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'placed' || o.status === 'pending').length;
  const inProductionOrders = orders.filter(o => o.status === 'in_production').length;
  const approvedOrders = orders.filter(o => o.status === 'approved' || o.status === 'confirmed').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'shipped').length;
  
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const outstandingAmount = orders
    .filter(o => o.paymentStatus !== 'paid')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  
  const customerList = users?.customers || [];
  const totalCustomers = customerList.length || 1;
  const fulfillmentRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 75;

  const formatCurrency = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  // Sage AI Handler using real site numbers
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
      if (lower.includes('order') || lower.includes('status')) {
        reply = `You have ${totalOrders} total orders recorded: ${deliveredOrders} delivered, ${inProductionOrders} currently on the production floor, and ${pendingOrders + approvedOrders} queued.`;
      } else if (lower.includes('due') || lower.includes('outstanding') || lower.includes('balance') || lower.includes('money')) {
        reply = `Current outstanding dues across unsettled orders total ${formatCurrency(outstandingAmount)}. All active ledgers are tracked under the Ledger tab.`;
      } else if (lower.includes('revenue') || lower.includes('total') || lower.includes('sales')) {
        reply = `Total gross order value booked in the system is ${formatCurrency(totalRevenue)} across ${totalOrders} orders.`;
      } else if (lower.includes('client') || lower.includes('customer') || lower.includes('user')) {
        reply = `There are ${totalCustomers} client accounts registered in the database, with ${customerList[0]?.name || 'Mohit Samnani'} as the primary client.`;
      } else {
        reply = `Status for "${q}": All operations are running smoothly. ${inProductionOrders} job cards are active in production, and delivery fulfillment is at ${fulfillmentRate}%.`;
      }

      setSageChat(prev => [...prev, { sender: 'sage', text: reply }]);
    }, 400);
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
                onClick={() => onNavigateTab('dashboard')}
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
  // VIEW: MAIN DASHBOARD (Exact video UI elements populated with site data)
  // ---------------------------------------------------------------------------
  return (
    <div className="relative min-h-[calc(100vh-6rem)] w-full text-stone-800 pb-16 font-sans">
      
      {/* ===================================================================== */}
      {/* TOP HEADER BAR (Video UI elements with site content)                  */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 pt-1">
        
        {/* Left: 10-Spoke Asterisk Logo + Title + Real Subtitle */}
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
              Welcome, {persona?.name || 'Partner'}!
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              {persona?.company ? `${persona.company} · ` : ''}Tags &amp; Packaging Order Operations
            </p>
          </div>
        </div>

        {/* Right: Search Pill + New Order Action + Chat Icon + Notifications */}
        <div className="flex items-center space-x-2.5">
          {/* Search Pill */}
          <div 
            onClick={() => setIsSageOpen(true)}
            className="flex items-center bg-white border border-stone-200/80 rounded-full pl-4 pr-1 py-1 shadow-xs hover:border-stone-400 transition-all cursor-pointer group"
          >
            <span className="text-xs text-stone-400 group-hover:text-stone-600 pr-3 font-normal">
              Search orders, invoices, clients...
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

          {/* New Order Button */}
          <button
            type="button"
            onClick={() => onNavigateTab('place_order')}
            className="hidden sm:inline-flex items-center space-x-1.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xs cursor-pointer transition-all"
          >
            <span>+</span>
            <span>New Order</span>
          </button>

          {/* Chat Icon Button */}
          <button
            type="button"
            onClick={() => onNavigateTab('chat')}
            className="relative w-9 h-9 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all"
            title="Chat Messages"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-white" />
          </button>

          {/* Bell Icon Button */}
          <button
            type="button"
            onClick={() => onNavigateTab(portalType === 'customer' ? 'order_register' : 'all_orders')}
            className="relative w-9 h-9 rounded-full bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 hover:bg-stone-50 shadow-xs cursor-pointer transition-all"
            title="Order Alerts"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-stone-900 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs">
              {pendingOrders || 1}
            </span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ROW 1: 4 METRIC CARDS (Exact Video UI with Real Site Content)          */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Orders Placed */}
        <div 
          onClick={() => onNavigateTab(portalType === 'customer' ? 'order_register' : 'all_orders')}
          className="bg-white rounded-3xl p-5 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div>
            <p className="text-xs text-stone-500 font-medium">Orders Placed</p>
            <h3 className="text-2xl font-bold font-mono text-stone-900 mt-1">{totalOrders}</h3>
            <p className="text-[11px] text-stone-400 mt-0.5">{inProductionOrders} in production</p>
          </div>
          {/* Mini vertical bar chart from video */}
          <div className="flex items-end space-x-1.5 h-10">
            <span className="w-1.5 bg-stone-800 rounded-full h-4" />
            <span className="w-1.5 bg-stone-800 rounded-full h-7" />
            <span className="w-1.5 bg-stone-800 rounded-full h-10" />
            <span className="w-1.5 bg-stone-800 rounded-full h-5" />
            <span className="w-1.5 bg-stone-800 rounded-full h-8" />
          </div>
        </div>

        {/* Card 2: Active Clients */}
        <div 
          onClick={() => onNavigateTab(portalType === 'customer' ? 'order_register' : 'all_orders')}
          className="bg-white rounded-3xl p-5 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-stone-500 font-medium">Client Accounts</p>
              <h3 className="text-2xl font-bold font-mono text-stone-900 mt-0.5">{totalCustomers}</h3>
              <p className="text-[11px] text-stone-400">Registered brands</p>
            </div>
          </div>
          {/* Mini sparkline from video */}
          <svg className="w-16 h-8 text-stone-700" viewBox="0 0 80 40" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M0,25 Q20,10 40,25 T80,12" />
          </svg>
        </div>

        {/* Card 3: Total Revenue Volume */}
        <div 
          onClick={() => onNavigateTab(portalType === 'customer' ? 'invoice_register' : 'all_invoices')}
          className="bg-white rounded-3xl p-5 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center space-x-3.5 hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#f7eedf] flex items-center justify-center text-[#8d693f]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <path d="M9.5 10a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Order Revenue</p>
            <h3 className="text-2xl font-bold font-mono text-stone-900 mt-0.5">{formatCurrency(totalRevenue)}</h3>
            <p className="text-[11px] text-stone-400">Booked value</p>
          </div>
        </div>

        {/* Card 4: Outstanding Dues (Dark Forest Green Card from Video UI) */}
        <div 
          onClick={() => onNavigateTab(portalType === 'customer' ? 'outstanding_ledger' : 'ledgers')}
          className="bg-[#415b4e] rounded-3xl p-5 text-white shadow-[0_6px_25px_rgba(65,91,78,0.25)] flex items-center justify-between hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-emerald-100">Live Ledger</span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4e6b5d] text-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>Live</span>
              </span>
            </div>
            <h3 className="text-2xl font-bold font-mono text-white mt-1">{formatCurrency(outstandingAmount)}</h3>
            <p className="text-[11px] text-emerald-100/70 mt-0.5 font-medium">Unsettled Balance</p>
          </div>
          {/* White wavy sparkline from video */}
          <svg className="w-20 h-10 text-emerald-200" viewBox="0 0 80 40" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M0,28 Q15,5 30,22 T60,10 T80,24" />
          </svg>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* ROW 2: ORDER VELOCITY (Wide) + FULFILLMENT GAUGE + PROFILE CARD       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        
        {/* Card 1: Order Velocity & Sine-Wave Area Chart (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <h3 className="text-base font-bold text-stone-900">Order Delivery Velocity</h3>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>On track</span>
              </span>
            </div>
            <div className="text-xs font-medium text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
              Production Cycle ▾
            </div>
          </div>

          {/* Floating Stat Pills inside card */}
          <div className="flex items-center space-x-3 my-4">
            <div className="bg-stone-50 border border-stone-200/70 px-3.5 py-2 rounded-2xl flex items-center space-x-2">
              <span className="text-xs text-stone-500 font-medium">Delivered</span>
              <span className="text-sm font-bold font-mono text-stone-900">{deliveredOrders}</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                {fulfillmentRate}%
              </span>
            </div>
            <div className="bg-stone-50 border border-stone-200/70 px-3.5 py-2 rounded-2xl flex items-center space-x-2">
              <span className="text-xs text-stone-500 font-medium">In Process</span>
              <span className="text-sm font-bold font-mono text-stone-900">{inProductionOrders + pendingOrders}</span>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">Active</span>
            </div>
          </div>

          {/* Large Smooth Sine-Wave Area Chart with Interactive Floating Sage Orb */}
          <div className="relative h-44 w-full pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
              <defs>
                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,130 C100,120 180,165 260,110 C340,55 420,130 500,100 L500,160 L0,160 Z"
                fill="url(#velocityGradient)"
              />
              <path
                d="M0,130 C100,120 180,165 260,110 C340,55 420,130 500,100"
                fill="none"
                stroke="#27272a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Floating 3D Glowing Sage Orb with Smiling Eyes sitting on curve */}
            <div 
              onClick={() => setIsSageOpen(true)}
              className="absolute right-[28%] top-[28%] -translate-y-1/2 cursor-pointer group z-20"
            >
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white text-stone-900 border border-stone-200 px-3 py-1 rounded-full text-[11px] font-semibold shadow-lg whitespace-nowrap pointer-events-none group-hover:scale-105 transition-all">
                Ask uBMS Assistant
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 sage-orb-glow flex items-center justify-center shadow-lg group-hover:scale-110 transition-all">
                <div className="flex items-center space-x-1.5">
                  <span className="w-1 h-3 bg-white rounded-full sage-eye-blink shadow-xs" />
                  <span className="w-1 h-3 bg-white rounded-full sage-eye-blink shadow-xs" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Fulfillment Rate Radial Gauge (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-900">Fulfillment Rate</h3>
            <p className="text-xs text-stone-500 font-medium mt-0.5">Dispatched vs total orders</p>
            <div className="text-2xl font-bold font-mono text-stone-900 mt-2">
              {deliveredOrders} of {totalOrders} Orders
            </div>
            <p className="text-xs text-stone-500 font-medium mt-1">
              Production accuracy is <span className="font-bold text-emerald-600">Optimal</span>
            </p>
          </div>

          {/* Radial Donut Gauge from video */}
          <div className="flex flex-col items-center justify-center pt-4">
            <div className="relative w-36 h-24 flex items-end justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f1efe9" strokeWidth="10" strokeDasharray="125 125" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" stroke="#405a4e" strokeWidth="10" 
                  strokeDasharray={`${Math.round((fulfillmentRate / 100) * 125)} 125`} 
                  strokeLinecap="round" 
                />
              </svg>
              <div className="absolute bottom-2 text-center">
                <span className="text-2xl font-black font-mono text-stone-900">{fulfillmentRate}%</span>
                <span className="block text-[11px] text-stone-400 font-medium">delivered rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: User Profile Card with Real Member Info (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-center justify-between text-center">
          <div className="flex flex-col items-center pt-2">
            <div className="relative w-18 h-18 rounded-full bg-stone-900 text-white font-bold text-xl flex items-center justify-center border-4 border-stone-100 shadow-md">
              {persona?.avatar || (persona?.name ? persona.name.slice(0, 2).toUpperCase() : 'ME')}
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold">
                ✓
              </span>
            </div>

            <h4 className="text-base font-bold text-stone-900 mt-3">{persona?.name || 'Account User'}</h4>
            <p className="text-xs text-stone-500 font-medium">{persona?.company || persona?.roleLabel || 'uBMS Member'}</p>
          </div>

          {/* 3 Real Stats Columns */}
          <div className="w-full grid grid-cols-3 gap-2 pt-5 border-t border-stone-100">
            <div>
              <div className="text-xs text-stone-400 font-medium">Orders</div>
              <div className="text-lg font-bold font-mono text-stone-900 mt-0.5">{totalOrders}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 font-medium">In Flow</div>
              <div className="text-lg font-bold font-mono text-stone-900 mt-0.5">{inProductionOrders}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 font-medium">Completed</div>
              <div className="text-lg font-bold font-mono text-stone-900 mt-0.5">{deliveredOrders}</div>
            </div>
          </div>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* ROW 3: ORDER STUDIO CARD + RECENT ORDERS REGISTER + QC CARD           */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        
        {/* Card 1: Order Studio (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
          <div className="space-y-3 max-w-xs">
            <h3 className="text-base font-bold text-stone-900 leading-snug">
              Order Studio &amp; Custom Tags
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed font-medium">
              Configure custom hang tags, Indian PU leather labels, and garment packaging directly.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('place_order')}
              className="inline-flex items-center space-x-1.5 bg-[#405a4e] hover:bg-[#344b40] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm cursor-pointer transition-all"
            >
              <span>+ Book New Order</span>
            </button>
          </div>

          {/* 3D Visual Manufacturing Cards */}
          <div className="card-stack-container relative w-64 h-36 flex items-center justify-center shrink-0 py-2">
            {/* Card 3: Barcode Plastic Tag */}
            <div 
              onClick={() => setTopStudioCard(2)}
              className={`credit-card-3d absolute w-56 h-32 rounded-2xl p-3.5 text-white flex flex-col justify-between cursor-pointer border border-neutral-700/50 ${
                topStudioCard === 2 ? 'z-30 scale-105' : 'z-10'
              }`}
              style={{
                backgroundColor: '#18181b',
                transform: topStudioCard === 2 
                  ? 'translateY(-12px) rotateX(10deg) rotateY(-8deg) rotateZ(2deg)' 
                  : 'translateY(18px) rotateX(25deg) rotateY(-18deg) rotateZ(7deg)'
              }}
            >
              <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono">
                <span>BARCODE PLASTIC TAG</span>
                <span className="w-5 h-3 bg-amber-400/80 rounded-sm" />
              </div>
              <div className="font-mono text-xs tracking-widest text-stone-300">
                PL-0.45 MM &bull; WATERPROOF
              </div>
              <div className="flex justify-between items-center text-[9px] text-stone-400">
                <span>BATCH #2026-B</span>
                <span className="font-bold text-stone-200">uBMS TAGS</span>
              </div>
            </div>

            {/* Card 2: Indian PU Leather Label */}
            <div 
              onClick={() => setTopStudioCard(1)}
              className={`credit-card-3d absolute w-56 h-32 rounded-2xl p-3.5 text-white flex flex-col justify-between cursor-pointer border border-emerald-600/50 ${
                topStudioCard === 1 ? 'z-30 scale-105' : 'z-20'
              }`}
              style={{
                backgroundColor: '#3b5548',
                transform: topStudioCard === 1 
                  ? 'translateY(-12px) rotateX(10deg) rotateY(-8deg) rotateZ(2deg)' 
                  : 'translateY(6px) rotateX(25deg) rotateY(-18deg) rotateZ(7deg)'
              }}
            >
              <div className="flex justify-between items-center text-[10px] text-emerald-200 font-mono">
                <span>INDIAN PU LEATHER</span>
                <span className="w-5 h-3 bg-amber-300/80 rounded-sm" />
              </div>
              <div className="font-mono text-xs tracking-widest text-emerald-100">
                THICKNESS 1.8 MM &bull; HEAT PRESS
              </div>
              <div className="flex justify-between items-center text-[9px] text-emerald-200">
                <span>DENIM PATCH</span>
                <span className="font-bold text-white">GENUINE PU</span>
              </div>
            </div>

            {/* Card 1: 300 GSM Kraft Paper Tag */}
            <div 
              onClick={() => setTopStudioCard(0)}
              className={`credit-card-3d absolute w-56 h-32 rounded-2xl p-3.5 text-stone-800 flex flex-col justify-between cursor-pointer border border-stone-200 shadow-xl ${
                topStudioCard === 0 ? 'z-30 scale-105' : 'z-10'
              }`}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #ebe8e1 100%)',
                transform: topStudioCard === 0 
                  ? 'translateY(-12px) rotateX(10deg) rotateY(-8deg) rotateZ(2deg)' 
                  : 'translateY(-8px) rotateX(25deg) rotateY(-18deg) rotateZ(7deg)'
              }}
            >
              <div className="flex justify-between items-center text-[10px] text-stone-500 font-mono">
                <span>ECO KRAFT PAPER TAG</span>
                <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold">
                  ✓
                </div>
              </div>
              <div className="font-mono text-xs tracking-widest font-semibold text-stone-700">
                300 GSM &bull; DIE PUNCH
              </div>
              <div className="flex justify-between items-center text-[9px] text-stone-500">
                <span>DORI + EYELET</span>
                <span className="font-bold text-stone-700">PREMIUM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Recent Orders & Ledger (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="text-base font-bold text-stone-900">Recent Orders</h3>
            <button 
              onClick={() => onNavigateTab(portalType === 'customer' ? 'order_register' : 'all_orders')}
              className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors text-xs cursor-pointer"
            >
              ↗
            </button>
          </div>

          <div className="space-y-3 py-2">
            {orders.length > 0 ? (
              orders.slice(0, 3).map((ord) => (
                <div key={ord.id} className="flex items-center justify-between">
                  <div className="truncate mr-2">
                    <div className="text-xs font-semibold text-stone-900 truncate">
                      {ord.customerCompany || ord.customerName || ord.id}
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono">{ord.id}</div>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${
                    ord.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                    ord.status === 'in_production' ? 'bg-sky-50 text-sky-700 border border-sky-200/60' :
                    'bg-amber-50 text-amber-700 border border-amber-200/60'
                  }`}>
                    {formatCurrency(ord.total || 1200)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-stone-400">No orders placed yet</div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab(portalType === 'customer' ? 'order_register' : 'all_orders')}
            className="w-full text-center text-xs text-stone-500 hover:text-stone-900 font-medium pt-2 border-t border-stone-100 cursor-pointer"
          >
            View full order register &rarr;
          </button>
        </div>

        {/* Card 3: Quality Standards & Specs (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-stone-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-center justify-between text-center">
          <div className="flex flex-col items-center pt-2">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-stone-900">Quality &amp; Standards</h4>
            <p className="text-xs text-stone-500 mt-1 font-medium">Verify sheet allocation &amp; die punch tolerances</p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab(portalType === 'customer' ? 'order_register' : 'all_orders')}
            className="w-full py-2.5 rounded-2xl bg-[#405a4e] hover:bg-[#344b40] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer mt-4"
          >
            Inspect Order Specs
          </button>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* FLOATING "ASK SAGE" BUTTON (Video UI Element)                         */}
      {/* ===================================================================== */}
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

      {/* ===================================================================== */}
      {/* SLIDING AI DRAWER (Video UI Element with Real Site Content)           */}
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
                  Query order statuses, outstanding balances, and production fulfillment in real time.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pb-2">
                {[
                  { text: 'Total active orders?', icon: '📦' },
                  { text: 'Outstanding ledger balance?', icon: '💰' },
                  { text: 'Orders in production?', icon: '⚙️' },
                  { text: 'What is our delivery rate?', icon: '📈' }
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
