// Main uBMS App Component
window.uBMS = window.uBMS || {};

function App() {
  const [loading, setLoading] = React.useState(true);
  const [currentPortal, setPortal] = React.useState('customer'); // 'customer' or 'admin'
  const [orders, setOrders] = React.useState([]);
  const [users, setUsers] = React.useState({ team: [], customers: [] });
  const [products, setProducts] = React.useState([]);
  const [estimates, setEstimates] = React.useState([]);
  const [invoices, setInvoices] = React.useState([]);
  const [payments, setPayments] = React.useState([]);
  const [production, setProduction] = React.useState([]);
  const [payroll, setPayroll] = React.useState({ staffSummary: [], dailyAttendance: [] });
  const [messages, setMessages] = React.useState([]);
  const [labelTypes, setLabelTypes] = React.useState([]);
  const [catalogs, setCatalogs] = React.useState([]);
  const [inventory, setInventory] = React.useState([]);
  const [activePersona, setActivePersona] = React.useState(null);
  const [invoiceOrder, setInvoiceOrder] = React.useState(null);
  const [toasts, setToasts] = React.useState([]);

  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Initial Load from DataService
  React.useEffect(() => {
    async function init() {
      try {
        const [
          loadedOrders,
          loadedUsers,
          loadedProducts,
          loadedEstimates,
          loadedInvoices,
          loadedPayments,
          loadedProduction,
          loadedPayroll,
          loadedMessages,
          loadedLabelTypes,
          loadedCatalogs,
          loadedInventory
        ] = await Promise.all([
          window.uBMS.DataService.fetchOrders(),
          window.uBMS.DataService.fetchUsers(),
          window.uBMS.DataService.fetchProducts(),
          window.uBMS.DataService.fetchEstimates(),
          window.uBMS.DataService.fetchInvoices(),
          window.uBMS.DataService.fetchPayments(),
          window.uBMS.DataService.fetchProduction(),
          window.uBMS.DataService.fetchPayroll(),
          window.uBMS.DataService.fetchMessages(),
          window.uBMS.DataService.fetchLabelTypes(),
          window.uBMS.DataService.fetchCatalogs(),
          window.uBMS.DataService.fetchInventory()
        ]);

        setOrders(loadedOrders);
        setUsers(loadedUsers);
        setProducts(loadedProducts);
        setEstimates(loadedEstimates);
        setInvoices(loadedInvoices);
        setPayments(loadedPayments);
        setProduction(loadedProduction);
        setPayroll(loadedPayroll);
        setMessages(loadedMessages);
        setLabelTypes(loadedLabelTypes);
        setCatalogs(loadedCatalogs || []);
        setInventory(loadedInventory || []);

        // Default Persona: First Customer
        if (loadedUsers.customers && loadedUsers.customers.length > 0) {
          setActivePersona({ ...loadedUsers.customers[0], isCustomer: true });
        } else if (loadedUsers.team && loadedUsers.team.length > 0) {
          setActivePersona({ ...loadedUsers.team[0], isCustomer: false });
        }
      } catch (err) {
        console.error('Failed to initialize uBMS data', err);
        showToast('Initialized with local memory dataset', 'warning');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Save new order
  const handleSaveOrder = (newOrder) => {
    const updated = [newOrder, ...orders];
    setOrders(updated);
    window.uBMS.DataService.saveOrders(updated);
    showToast(`Order ${newOrder.id} confirmed!`, 'success');
  };

  // Update existing order
  const handleUpdateOrder = (updatedOrder) => {
    const updated = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setOrders(updated);
    window.uBMS.DataService.saveOrders(updated);
    showToast(`Order ${updatedOrder.id} status updated (${updatedOrder.status})`, 'success');
  };

  // Save estimate
  const handleSaveEstimate = (newOrUpdatedEst) => {
    const exists = estimates.find(e => e.id === newOrUpdatedEst.id);
    const updated = exists 
      ? estimates.map(e => e.id === newOrUpdatedEst.id ? newOrUpdatedEst : e)
      : [newOrUpdatedEst, ...estimates];
    setEstimates(updated);
    window.uBMS.DataService.saveEstimates(updated);
    showToast(`Quotation ${newOrUpdatedEst.id} updated`, 'success');
  };

  // Save invoice
  const handleSaveInvoice = (newInvoice) => {
    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    window.uBMS.DataService.saveInvoices(updated);
    showToast(`Invoice ${newInvoice.id} generated!`, 'success');
  };

  // Save payment & update invoice balance if applicable
  const handleSavePayment = (newPayment, knockInvoiceId, amount) => {
    const updatedPayments = [newPayment, ...payments];
    setPayments(updatedPayments);
    window.uBMS.DataService.savePayments(updatedPayments);

    if (knockInvoiceId) {
      const updatedInvoices = invoices.map(inv => {
        if (inv.id === knockInvoiceId) {
          const newBal = Math.max(0, inv.balanceDue - amount);
          const newPaid = inv.paidAmount + amount;
          return {
            ...inv,
            paidAmount: newPaid,
            balanceDue: newBal,
            status: newBal <= 0 ? 'paid' : 'partial'
          };
        }
        return inv;
      });
      setInvoices(updatedInvoices);
      window.uBMS.DataService.saveInvoices(updatedInvoices);
    }
    showToast(`Payment receipt ${newPayment.id} recorded!`, 'success');
  };

  // Update Production Jobs
  const handleUpdateProduction = (updatedProd) => {
    setProduction(updatedProd);
    window.uBMS.DataService.saveProduction(updatedProd);
    showToast('Production workflow updated', 'success');
  };

  // Update Payroll
  const handleUpdatePayroll = (updatedPayroll) => {
    setPayroll(updatedPayroll);
    window.uBMS.DataService.savePayroll(updatedPayroll);
    showToast('Attendance & Payroll saved', 'success');
  };

  // Save Message in Chat
  const handleSaveMessage = (updatedThread) => {
    const exists = messages.find(m => m.threadId === updatedThread.threadId);
    const updated = exists
      ? messages.map(m => m.threadId === updatedThread.threadId ? updatedThread : m)
      : [...messages, updatedThread];
    setMessages(updated);
    window.uBMS.DataService.saveMessages(updated);
  };

  // Update Label Types & Materials
  const handleUpdateLabelTypes = (updatedTypes) => {
    setLabelTypes(updatedTypes);
    window.uBMS.DataService.saveLabelTypes(updatedTypes);
    showToast('Types & Materials catalog updated', 'success');
  };

  // Update Raw Material Inventory
  const handleUpdateInventory = (updatedInventory) => {
    setInventory(updatedInventory);
    window.uBMS.DataService.saveInventory(updatedInventory);
    showToast('Inventory stock levels updated', 'success');
  };

  // Update Paper Catalogs Master
  const handleUpdateCatalogs = (updatedCatalogs) => {
    setCatalogs(updatedCatalogs);
    window.uBMS.DataService.saveCatalogs(updatedCatalogs);
    showToast('Paper catalog master updated', 'success');
  };

  if (loading || !activePersona) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 animate-spin flex items-center justify-center font-bold text-lg mb-4">
          Ω
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">Loading uBMS Enterprise Suite...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center space-x-2 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold text-white animate-fade-in ${
              t.type === 'success' ? 'bg-emerald-600 border border-emerald-500' :
              t.type === 'warning' ? 'bg-amber-600 border border-amber-500' :
              'bg-blue-600 border border-blue-500'
            }`}
          >
            <span>{t.type === 'success' ? '✓' : 'ℹ'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Main Header */}
      <window.uBMS.Header
        currentPortal={currentPortal}
        setPortal={setPortal}
        activePersona={activePersona}
        setActivePersona={setActivePersona}
        users={users}
        orders={orders}
        onNewOrderClick={() => {
          setPortal('customer');
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-[1750px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentPortal === 'customer' ? (
          <window.uBMS.CustomerPortal
            customer={activePersona.isCustomer ? activePersona : users.customers[0]}
            orders={orders}
            estimates={estimates}
            invoices={invoices}
            payments={payments}
            products={products}
            labelTypes={labelTypes}
            catalogs={catalogs}
            messages={messages}
            onUpdateOrder={handleUpdateOrder}
            onSaveOrder={handleSaveOrder}
            onSaveEstimate={handleSaveEstimate}
            onSaveMessage={handleSaveMessage}
            onOpenInvoice={(o) => setInvoiceOrder(o)}
          />
        ) : (
          <window.uBMS.AdminPortal
            currentMember={!activePersona.isCustomer ? activePersona : users.team[0]}
            orders={orders}
            invoices={invoices}
            payments={payments}
            production={production}
            payroll={payroll}
            users={users}
            products={products}
            labelTypes={labelTypes}
            catalogs={catalogs}
            inventory={inventory}
            onUpdateLabelTypes={handleUpdateLabelTypes}
            onUpdateInventory={handleUpdateInventory}
            onUpdateCatalogs={handleUpdateCatalogs}
            onUpdateOrder={handleUpdateOrder}
            onSaveOrder={handleSaveOrder}
            onSaveInvoice={handleSaveInvoice}
            onSavePayment={handleSavePayment}
            onUpdateProduction={handleUpdateProduction}
            onUpdatePayroll={handleUpdatePayroll}
            onOpenInvoice={(o) => setInvoiceOrder(o)}
          />
        )}
      </main>

      {/* Printable Invoice Modal */}
      {invoiceOrder && (
        <window.uBMS.InvoiceModal
          order={invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {/* Footer & Version Indicator */}
      <footer className="no-print border-t border-[#e8e5de] bg-[#f4f2ec] py-4 px-4 sm:px-8 text-xs text-stone-600">
        <div className="max-w-[1750px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-stone-800">uBMS Enterprise</span>
            <span>&bull;</span>
            <span>Tags &amp; Labels Manufacturing &amp; Accounting Suite</span>
          </div>

          <div className="flex items-center space-x-2.5 bg-white border border-[#e8e5de] px-3.5 py-1.5 rounded-full shadow-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold text-[11px]">
              v1.0 beta
            </span>
            <span className="text-stone-500 text-[11px]">
              &bull; Warm Ivory Paper Theme
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}

window.uBMS.App = App;

// Bootstrap React Root
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}
