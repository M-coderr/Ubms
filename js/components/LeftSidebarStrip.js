// Left Floating White Navigation Strip (Two-Tier Hierarchy: Level 1 Module Groups)
window.uBMS = window.uBMS || {};

function LeftSidebarStrip({
  currentPortal,
  setPortal,
  currentTab,
  onTabChange,
  activePersona,
  setActivePersona,
  users,
  orders
}) {
  const [showPersonaPopover, setShowPersonaPopover] = React.useState(false);

  const teamMembers = users?.team || [];
  const customers = users?.customers || [];

  // Determine active group ID from the current tab
  const activeGroupId = currentPortal === 'customer'
    ? (window.uBMS.getCustomerGroupForTab ? window.uBMS.getCustomerGroupForTab(currentTab) : 'orders')
    : (window.uBMS.getAdminGroupForTab ? window.uBMS.getAdminGroupForTab(currentTab) : 'orders');

  // Customer Group Items
  const customerNavGroups = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      )
    },
    {
      id: 'billing',
      label: 'Billing & Ledgers',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 3 2 3-2 3 2 3-2 3 2V4a2 2 0 0 0-2-2z" />
          <path d="M9 9h6M9 13h4" />
        </svg>
      )
    },
    {
      id: 'support',
      label: 'Support & Chat',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    }
  ];

  // Admin Group Items
  const adminNavGroups = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      )
    },
    {
      id: 'operations',
      label: 'Production & Ops',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      )
    },
    {
      id: 'billing',
      label: 'Billing & Finance',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16l3-2 3 2 3-2 3 2 3-2 3 2V4a2 2 0 0 0-2-2z" />
          <path d="M9 9h6M9 13h4" />
        </svg>
      )
    }
  ];

  const currentGroupsList = currentPortal === 'customer' ? customerNavGroups : adminNavGroups;

  const handleGroupSelect = (groupId) => {
    const groups = currentPortal === 'customer'
      ? (window.uBMS.CUSTOMER_NAV_GROUPS || [])
      : (window.uBMS.ADMIN_NAV_GROUPS || []);
    const match = groups.find(g => g.id === groupId);
    if (!match) return;

    // Check if current tab is already within this group
    const isAlreadyInGroup = (match.tabs || []).some(t => t.key === currentTab);
    if (!isAlreadyInGroup) {
      onTabChange(match.defaultTab);
    }
  };

  return (
    <aside className="hidden md:flex flex-col items-center justify-between bg-white text-stone-800 my-4 ml-3 rounded-[30px] py-4 w-12 sm:w-12.5 border border-stone-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] z-40 sticky top-4 h-[calc(100vh-2rem)] shrink-0 select-none transition-all duration-300">
      
      {/* Top: Compact Brand Asterisk */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => onTabChange('dashboard')}
          className="w-8 h-8 flex items-center justify-center text-stone-800 hover:scale-105 active:scale-95 transition-all group relative cursor-pointer"
          title="uBMS Dashboard"
        >
          <svg className="w-5.5 h-5.5 text-stone-900" viewBox="0 0 24 24" fill="currentColor">
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
          <div className="absolute left-full ml-3 px-2 py-0.5 bg-[#18181b] text-white text-[11px] font-semibold rounded-md shadow-xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all z-50">
            uBMS
          </div>
        </button>
      </div>

      {/* Center Stack: Level 1 Module Groups */}
      <div className="flex flex-col items-center space-y-2.5 my-auto py-2">
        {currentGroupsList.map((item) => {
          const isActive = activeGroupId === item.id && currentTab !== 'profile';

          return (
            <div key={item.id} className="relative group flex items-center">
              <button
                type="button"
                onClick={() => handleGroupSelect(item.id)}
                className={`relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#18181b] text-white shadow-xs scale-105'
                    : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                }`}
                title={item.label}
              >
                {item.icon}
              </button>

              {/* Sleek Tooltip */}
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#18181b] text-white text-[11px] font-semibold rounded-lg shadow-xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 z-50">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: Profile Icon */}
      <div className="flex flex-col items-center pt-1">
        <div className="relative group">
          <button
            type="button"
            onClick={() => {
              onTabChange('profile');
              setShowPersonaPopover(prev => !prev);
            }}
            className={`w-8 h-8 rounded-full border border-stone-200 overflow-hidden flex items-center justify-center shadow-2xs cursor-pointer hover:scale-105 transition-all ${
              currentTab === 'profile' ? 'ring-2 ring-stone-900 ring-offset-1' : ''
            }`}
          >
            {activePersona?.avatar ? (
              <span className="font-bold text-[10px] text-stone-700">{activePersona.avatar}</span>
            ) : (
              <svg className="w-full h-full text-stone-700 bg-stone-100 p-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </button>
          
          <div className="absolute left-full ml-3 px-2 py-1 bg-[#18181b] text-white text-[11px] font-semibold rounded-lg shadow-xl pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all z-50">
            Profile ({activePersona?.name || 'User'})
          </div>

          {/* Quick Persona & Portal Switcher Popover */}
          {showPersonaPopover && (
            <div className="absolute left-full bottom-0 ml-3 w-60 bg-white border border-stone-200 rounded-2xl shadow-2xl p-3 z-50 text-stone-800 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100 mb-2">
                <span className="text-[11px] font-bold text-stone-800">Switch Persona &amp; Portal</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPersonaPopover(false);
                  }}
                  className="text-stone-400 hover:text-stone-800 text-xs px-1"
                >
                  ✕
                </button>
              </div>

              {/* Portal Toggle */}
              <div className="flex items-center bg-stone-100 p-0.5 rounded-lg mb-2 text-[10px] font-bold">
                <button
                  onClick={() => {
                    setPortal('customer');
                    if (!activePersona?.isCustomer && customers.length > 0) setActivePersona({ ...customers[0], isCustomer: true });
                  }}
                  className={`flex-1 py-1 rounded-md transition-all ${currentPortal === 'customer' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}
                >
                  Customer
                </button>
                <button
                  onClick={() => {
                    setPortal('admin');
                    if (activePersona?.isCustomer && teamMembers.length > 0) setActivePersona({ ...teamMembers[0], isCustomer: false });
                  }}
                  className={`flex-1 py-1 rounded-md transition-all ${currentPortal === 'admin' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}
                >
                  Admin
                </button>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto">
                <div className="text-[9px] uppercase font-bold text-stone-400 px-2 py-0.5">
                  {currentPortal === 'customer' ? 'Customers' : 'Team Members'}
                </div>
                {(currentPortal === 'customer' ? customers : teamMembers).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActivePersona({ ...p, isCustomer: currentPortal === 'customer' });
                      setShowPersonaPopover(false);
                    }}
                    className={`w-full text-left px-2 py-1 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activePersona?.id === p.id
                        ? 'bg-stone-900 text-white font-bold'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-[10px] opacity-75 font-mono truncate ml-1">{p.company || p.roleLabel || p.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </aside>
  );
}

window.uBMS.LeftSidebarStrip = LeftSidebarStrip;
