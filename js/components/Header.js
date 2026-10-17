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
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-40 shadow-xs">
      <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & System Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-white shadow-xs text-base">
              Ω
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">uBMS</span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                  OMS Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-normal">Order Management System</p>
            </div>
          </div>

          {/* Portal Switcher (Customer vs Team/Admin) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => handlePortalSwitch('customer')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm transition-all ${
                currentPortal === 'customer'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Customer Portal
            </button>
            <button
              onClick={() => handlePortalSwitch('admin')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm transition-all ${
                currentPortal === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Team &amp; Admin
            </button>
          </div>

          {/* User Persona & Role Switcher */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Action Button */}
            {currentPortal === 'customer' ? (
              <button
                onClick={onNewOrderClick}
                className="hidden md:flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <span>+ Place Order</span>
              </button>
            ) : null}

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                className="flex items-center space-x-2.5 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-all text-left shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-xs font-bold">
                  {activePersona.avatar || activePersona.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:block text-xs leading-tight">
                  <div className="font-semibold text-slate-900">{activePersona.name}</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {activePersona.isCustomer ? (activePersona.company || 'Customer') : currentRoleInfo.name}
                  </div>
                </div>
                <span className="text-slate-400 text-xs">▼</span>
              </button>

              {/* Persona Switcher Popover */}
              {showPersonaMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in text-slate-800">
                  <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Active User Persona
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{activePersona.name}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full border ${currentRoleInfo.badge}`}>
                      {currentRoleInfo.name}
                    </span>
                  </div>

                  {/* Switch Team Roles */}
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Team &amp; Staff Roles
                  </div>
                  {teamMembers.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectPersona(member, false)}
                      className={`w-full text-left px-3.5 py-2 flex items-center space-x-2.5 hover:bg-slate-50 text-xs transition-colors ${
                        !activePersona.isCustomer && activePersona.id === member.id ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                        {member.avatar}
                      </div>
                      <div className="flex-1 truncate">
                        <div className="truncate text-slate-800 font-medium">{member.name}</div>
                        <div className="text-[10px] text-slate-500">{member.roleLabel}</div>
                      </div>
                    </button>
                  ))}

                  {/* Switch Customers */}
                  <div className="px-3 py-1.5 mt-2 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Customer Profiles
                  </div>
                  {customers.map((cust) => (
                    <button
                      key={cust.id}
                      onClick={() => handleSelectPersona(cust, true)}
                      className={`w-full text-left px-3.5 py-2 flex items-center space-x-2.5 hover:bg-slate-50 text-xs transition-colors ${
                        activePersona.isCustomer && activePersona.id === cust.id ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-slate-200 text-slate-800 flex items-center justify-center text-[10px] font-bold">
                        {cust.avatar}
                      </div>
                      <div className="flex-1 truncate">
                        <div className="truncate text-slate-800 font-medium">{cust.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{cust.company}</div>
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
