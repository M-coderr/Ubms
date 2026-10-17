// Printable Invoice & Order Receipt Modal Component
window.uBMS = window.uBMS || {};

function InvoiceModal({ order, onClose }) {
  if (!order) return null;

  const formatCurrency = window.uBMS.formatCurrency;
  const formatDate = window.uBMS.formatDate;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print-bg">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Modal Controls Bar (Hidden in Print) */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="font-bold text-slate-900">Commercial Invoice &amp; Receipt</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-sm font-bold transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div id="printable-invoice" className="p-8 sm:p-10 bg-white text-slate-900 space-y-6">
          
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-slate-900 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">uBMS</span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Enterprises Ltd.</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Plot 108, Phase 2, Industrial Estate, Ahmedabad, Gujarat 382445<br />
                CIN: U22100GJ2020PTC118921<br />
                support@ubms.internal &bull; +91 79 4890 2200
              </p>
            </div>

            <div className="sm:text-right">
              <h2 className="text-2xl font-black uppercase text-slate-900">INVOICE</h2>
              <div className="text-sm font-bold text-slate-900 font-mono mt-1">INV-{order.id}</div>
              <div className="text-xs text-slate-500 mt-1">Date: {formatDate(order.createdAt)}</div>
              <div className="text-xs text-slate-500">Delivery: {formatDate(order.expectedDelivery)}</div>
            </div>
          </div>

          {/* Client & Order Info */}
          <div className="grid grid-cols-2 gap-6 text-xs pb-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Billed To
              </span>
              <div className="font-bold text-sm text-slate-900">{order.customerName}</div>
              <div className="text-slate-700 font-medium">{order.customerCompany}</div>
              <div className="text-slate-600 mt-1">{order.customerEmail}</div>
              <div className="text-slate-600">{order.customerPhone}</div>
            </div>

            <div>
              {order.shippingAddress ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Ship To Address
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {order.shippingAddress}
                  </p>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Manufacturing Reference
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    Direct Manufacturing Order
                  </p>
                </>
              )}
              <div className="mt-2 text-[11px] text-slate-500">
                <strong>Status:</strong> {order.status ? order.status.toUpperCase() : 'CONFIRMED'}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-500 text-[10px] uppercase tracking-wider">
                <th className="py-2.5">#</th>
                <th className="py-2.5">Description of Goods / Services</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Rate</th>
                <th className="py-2.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item, idx) => (
                <tr key={idx} className="py-2.5">
                  <td className="py-2.5 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5">
                    <div className="flex items-center space-x-2.5">
                      {item.image && (
                        <img src={item.image} alt={item.type || 'Item'} className="w-8 h-8 object-cover rounded border border-slate-300" />
                      )}
                      <div>
                        <span className="font-bold text-slate-900 font-mono tracking-wide">{item.itemCode || item.name}</span>
                        {item.brandName && (
                          <div className="text-[10px] text-slate-500">
                            Brand: <strong>{item.brandName}</strong> &bull; {item.type} ({item.material})
                          </div>
                        )}
                        {(item.dori || item.plastic) && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {item.dori && <span className="mr-2">Dori: <strong>{item.dori}</strong></span>}
                            {item.plastic && <span>Plastic: <strong>{item.plastic}</strong></span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 text-center font-mono font-medium">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.total || item.quantity * item.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Calculation (NO TAXES) */}
          <div className="flex justify-between items-start pt-4 border-t-2 border-slate-300">
            <div className="text-xs text-slate-500 max-w-xs">
              <span className="font-bold text-slate-700 block mb-1">Payment Status:</span>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {order.paymentStatus === 'paid' ? 'Paid in Full' : 'Awaiting Payment'}
              </span>
              <p className="mt-3 text-[10px] text-slate-500 leading-normal">
                Standard terms: Goods manufactured against approved order specifications. Subject to Ahmedabad jurisdiction.
              </p>
            </div>

            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(order.subtotal || order.total)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                <span>Total Amount</span>
                <span className="font-mono text-slate-900">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signatory */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
            <div>
              Generated electronically by <strong>uBMS OMS System</strong>.
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-800">For uBMS Enterprises</div>
              <div className="mt-6 text-[10px] text-slate-400">Authorized Signatory</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

window.uBMS.InvoiceModal = InvoiceModal;
