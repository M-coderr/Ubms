// Header Component with Portal Switcher and Persona / Role Selector
window.uBMS = window.uBMS || {};

function Header({ 
  currentPortal, 
  setPortal, 
  activePersona, 
  setActivePersona, 
  users, 
  orders, 
  onNewOrderClick 
}) {
  const [showPersonaMenu, setShowPersonaMenu] = React.useState(false);
  const ROLES = window.uBMS.ROLES;

  const teamMembers = users.team || [];
  const customers = users.customers || [];

  const handlePortalSwitch = (portal) => {
    setPortal(portal);
    // Switch to first persona of the portal if needed
    if (portal === 'customer') {
      if (!activePersona.isCustomer && customers.length > 0) {
        setActivePersona({ ...customers[0], isCustomer: true });
      }
    } else {
      if (activePersona.isCustomer && teamMembers.length > 0) {
        setActivePersona({ ...teamMembers[0], isCustomer: false });
      }
    }
    setShowPersonaMenu(false);
  };

  const handleSelectPersona = (persona, isCustomer) => {
    setActivePersona({ ...persona, isCustomer });
    setShowPersonaMenu(false);
  };

  const currentRoleInfo = !activePersona.isCustomer 
    ? (ROLES[activePersona.role] || { name: activePersona.role, badge: 'bg-gray-100 text-gray-800' })
    : { name: 'Customer', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & System Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 text-lg">
              Ω
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">uBMS</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                  OMS Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Unified Business & Order Tracking</p>
            </div>
          </div>

          {/* Portal Switcher (Customer vs Team/Admin) */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
            <button
              onClick={() => handlePortalSwitch('customer')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentPortal === 'customer'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🛍️</span>
              <span>Customer Portal</span>
            </button>
            <button
              onClick={() => handlePortalSwitch('admin')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentPortal === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>⚡</span>
              <span>Team & Admin Portal</span>
            </button>
          </div>

          {/* User Persona & Role Switcher */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Action Button */}
            {currentPortal === 'customer' ? (
              <button
                onClick={onNewOrderClick}
                className="hidden md:flex items-center space-x-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all transform hover:scale-[1.02]"
              >
                <span>➕</span>
                <span>Place Order</span>
              </button>
            ) : null}

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center space-x-2.5 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-xl border border-slate-700 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow">
                  {activePersona.avatar || activePersona.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:block text-xs leading-tight">
                  <div className="font-semibold text-slate-200">{activePersona.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {activePersona.isCustomer ? (activePersona.company || 'Customer') : currentRoleInfo.name}
                  </div>
                </div>
                <span className="text-slate-400 text-xs">▼</span>
              </button>

              {/* Persona Switcher Popover */}
              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in text-slate-200">
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Active User Persona
                    </p>
                    <p className="text-xs font-semibold text-white mt-0.5">{activePersona.name}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full border ${currentRoleInfo.badge}`}>
                      {currentRoleInfo.name}
                    </span>
                  </div>

                  {/* Switch Team Roles */}
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    🏢 Team & Staff Roles
                  </div>
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectPersona(member, false)}
                      className={`w-full text-left px-3.5 py-2 flex items-center space-x-2.5 hover:bg-slate-800 text-xs transition-colors ${
                        !activePersona.isCustomer && activePersona.id === member.id ? 'bg-indigo-950/60 text-indigo-300 font-semibold' : ''
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                        {member.avatar}
                      </div>
                      <div className="flex-1 truncate">
                        <div className="truncate text-slate-200">{member.name}</div>
                        <div className="text-[10px] text-indigo-400">{member.roleLabel}</div>
                      </div>
                    </button>
                  ))}

                  {/* Switch Customers */}
                  <div className="px-3 py-1.5 mt-2 border-t border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    🛍️ Customer Profiles
                  </div>
                  {customers.map((cust) => (
                    <button
                      key={cust.id}
                      onClick={() => handleSelectPersona(cust, true)}
                      className={`w-full text-left px-3.5 py-2 flex items-center space-x-2.5 hover:bg-slate-800 text-xs transition-colors ${
                        activePersona.isCustomer && activePersona.id === cust.id ? 'bg-emerald-950/60 text-emerald-300 font-semibold' : ''
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-emerald-800/60 text-emerald-200 flex items-center justify-center text-[10px] font-bold">
                        {cust.avatar}
                      </div>
                      <div className="flex-1 truncate">
                        <div className="truncate text-slate-200">{cust.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{cust.company}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}

window.uBMS.Header = Header;
