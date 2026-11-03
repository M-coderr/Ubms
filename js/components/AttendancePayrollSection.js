// Attendance, Shifts & Workforce Payroll Module for uBMS
window.uBMS = window.uBMS || {};

function AttendancePayrollSection({
  activeTab,
  setActiveTab,
  payroll,
  onUpdatePayroll,
  users,
  orders,
  formatCurrency,
  formatDate
}) {
  const staffSummary = payroll?.staffSummary || [];
  const dailyAttendance = payroll?.dailyAttendance || [];
  const pieceRateLedger = payroll?.pieceRateLedger || [];
  const shifts = payroll?.shifts || [
    {
      shiftId: 'SHIFT-GEN',
      name: 'General Day Shift',
      category: 'Office & Executive',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      standardHours: 8,
      breakMinutes: 60,
      gracePeriodMinutes: 15,
      halfDayMinHours: 4.5,
      overtimeRatePerHour: 350,
      description: 'Standard administrative & executive shift with 1 hour lunch break.'
    },
    {
      shiftId: 'SHIFT-PRESS',
      name: 'Printing Press Early Shift',
      category: 'Machine Operations',
      startTime: '08:00 AM',
      endTime: '05:00 PM',
      standardHours: 8,
      breakMinutes: 60,
      gracePeriodMinutes: 15,
      halfDayMinHours: 4.5,
      overtimeRatePerHour: 250,
      description: 'Pre-press calibration and multi-color offset printing machinery line.'
    },
    {
      shiftId: 'SHIFT-PUNCH',
      name: 'Punching & Die Press Shift',
      category: 'Machine Operations',
      startTime: '08:30 AM',
      endTime: '05:30 PM',
      standardHours: 8,
      breakMinutes: 60,
      gracePeriodMinutes: 15,
      halfDayMinHours: 4.5,
      overtimeRatePerHour: 250,
      description: 'Heavy die cutting, corner rounding, 3mm hole-punch and initial packing.'
    },
    {
      shiftId: 'SHIFT-ARTISAN',
      name: 'Artisan Flexible Piece Shift',
      category: 'Handwork & Karigars',
      startTime: '09:00 AM',
      endTime: '07:00 PM',
      standardHours: 8,
      breakMinutes: 60,
      gracePeriodMinutes: 30,
      halfDayMinHours: 4.0,
      overtimeRatePerHour: 200,
      description: 'Flexible assembly station for Dori attachment & plastic seal lock tagging.'
    }
  ];

  // Local state for filters and controls
  const [selectedDate, setSelectedDate] = React.useState('2026-11-03');
  const [typeFilter, setTypeFilter] = React.useState('all'); // 'all', 'office', 'operator', 'karigar'
  const [statusFilter, setStatusFilter] = React.useState('all'); // 'all', 'Present', 'Late', 'Leave'
  const [shiftFilter, setShiftFilter] = React.useState('all');
  const [showManualPunchModal, setShowManualPunchModal] = React.useState(false);
  const [showNewShiftModal, setShowNewShiftModal] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState(null);

  // Mobile Terminal Simulator State
  const [terminalTab, setTerminalTab] = React.useState('facescan'); // 'facescan', 'geofence', 'jobmove'
  const [selectedMobileStaffId, setSelectedMobileStaffId] = React.useState(staffSummary[0]?.staffId || 'USR-SADM-01');
  const [scanState, setScanState] = React.useState('idle'); // 'idle', 'scanning', 'matched', 'punched'
  const [jobMovePieces, setJobMovePieces] = React.useState('5200');

  const showLocalToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- STATS COMPUTATION ---
  const totalStaffCount = staffSummary.length;
  const presentCount = dailyAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const lateCount = dailyAttendance.filter(a => a.status === 'Late').length;
  const absentOrLeaveCount = dailyAttendance.filter(a => a.status === 'Leave' || a.status === 'Absent').length;
  const attendanceRate = totalStaffCount > 0 ? Math.round((presentCount / totalStaffCount) * 100) : 0;

  // Payroll Metrics
  const totalCalculatedPayroll = staffSummary.reduce((sum, s) => sum + (Number(s.netPayable) || 0), 0);
  const pendingStaffList = staffSummary.filter(s => s.status !== 'Paid');
  const pendingPayrollAmount = pendingStaffList.reduce((sum, s) => sum + (Number(s.netPayable) || 0), 0);
  const disbursedPayrollAmount = staffSummary.filter(s => s.status === 'Paid').reduce((sum, s) => sum + (Number(s.netPayable) || 0), 0);

  // --- HANDLERS ---
  const handleToggleAttendanceStatus = (staffId, newStatus) => {
    const updatedDaily = dailyAttendance.map(att => {
      if (att.staffId === staffId) {
        return {
          ...att,
          status: newStatus,
          hoursWorked: newStatus === 'Leave' || newStatus === 'Absent' ? 0 : att.hoursWorked || 8
        };
      }
      return att;
    });

    onUpdatePayroll({
      ...payroll,
      dailyAttendance: updatedDaily
    });
    showLocalToast(`Attendance status updated to "${newStatus}"`);
  };

  const handleDisburseStaffSalary = (staffId) => {
    const staff = staffSummary.find(s => s.staffId === staffId);
    if (!staff) return;

    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedSummary = staffSummary.map(s => {
      if (s.staffId === staffId) {
        return {
          ...s,
          status: 'Paid',
          disbursedAt: timestamp
        };
      }
      return s;
    });

    onUpdatePayroll({
      ...payroll,
      staffSummary: updatedSummary
    });
    showLocalToast(`Disbursed ${formatCurrency(staff.netPayable)} to ${staff.name} successfully!`);
  };

  const handleBulkDisburseAll = () => {
    if (pendingStaffList.length === 0) {
      showLocalToast('No pending salaries to disburse.');
      return;
    }

    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedSummary = staffSummary.map(s => ({
      ...s,
      status: 'Paid',
      disbursedAt: s.disbursedAt || timestamp
    }));

    onUpdatePayroll({
      ...payroll,
      staffSummary: updatedSummary
    });
    showLocalToast(`Bulk disbursed ${formatCurrency(pendingPayrollAmount)} across ${pendingStaffList.length} staff members!`);
  };

  const handleAssignShift = (staffId, newShiftId) => {
    const matchedShift = shifts.find(sh => sh.shiftId === newShiftId);
    if (!matchedShift) return;

    const updatedSummary = staffSummary.map(s => {
      if (s.staffId === staffId) {
        return {
          ...s,
          shiftId: newShiftId,
          shiftName: matchedShift.name
        };
      }
      return s;
    });

    const updatedDaily = dailyAttendance.map(a => {
      if (a.staffId === staffId) {
        return {
          ...a,
          shiftId: newShiftId,
          shiftName: matchedShift.name
        };
      }
      return a;
    });

    onUpdatePayroll({
      ...payroll,
      staffSummary: updatedSummary,
      dailyAttendance: updatedDaily
    });
    showLocalToast(`Shift reassigned to "${matchedShift.name}"`);
  };

  const handleSimulateMobilePunch = (staffId, method = 'Face Scan (Android App)') => {
    const staff = staffSummary.find(s => s.staffId === staffId);
    if (!staff) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const today = selectedDate;

    const existingIndex = dailyAttendance.findIndex(a => a.staffId === staffId && a.date === today);
    let updatedDaily;

    if (existingIndex >= 0) {
      const existing = dailyAttendance[existingIndex];
      const isPunchOut = existing.checkIn && existing.checkOut === '--:--';
      updatedDaily = dailyAttendance.map((a, idx) => {
        if (idx === existingIndex) {
          return {
            ...a,
            checkOut: isPunchOut ? timeStr : a.checkOut,
            hoursWorked: isPunchOut ? 8.5 : a.hoursWorked,
            overtime: isPunchOut ? '0.5 hrs' : a.overtime,
            punchMethod: method,
            locationVerified: true
          };
        }
        return a;
      });
      showLocalToast(`${isPunchOut ? 'Punch-Out' : 'Punch-In'} logged for ${staff.name} at ${timeStr}`);
    } else {
      const newPunch = {
        date: today,
        staffId: staff.staffId,
        name: staff.name,
        role: staff.role,
        employeeType: staff.employeeType || 'Office Staff',
        shiftId: staff.shiftId || 'SHIFT-GEN',
        shiftName: staff.shiftName || 'General Day Shift',
        status: 'Present',
        checkIn: timeStr,
        checkOut: '--:--',
        hoursWorked: 0,
        overtime: '0.0 hrs',
        punchMethod: method,
        device: 'Android Terminal Kiosk',
        location: 'Factory Floor (Unit 1)',
        locationVerified: true
      };
      updatedDaily = [newPunch, ...dailyAttendance];
      showLocalToast(`Instant Punch-In logged for ${staff.name} via ${method}`);
    }

    onUpdatePayroll({
      ...payroll,
      dailyAttendance: updatedDaily
    });
  };

  // Filtered Daily Attendance Records
  const filteredDailyAttendance = dailyAttendance.filter(att => {
    if (att.date && att.date !== selectedDate) return false;
    if (typeFilter !== 'all') {
      const type = (att.employeeType || '').toLowerCase();
      if (typeFilter === 'office' && !type.includes('office')) return false;
      if (typeFilter === 'operator' && !type.includes('operator')) return false;
      if (typeFilter === 'karigar' && !type.includes('karigar') && !type.includes('artisan')) return false;
    }
    if (statusFilter !== 'all' && att.status !== statusFilter) return false;
    if (shiftFilter !== 'all' && att.shiftId !== shiftFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <span className="text-emerald-400">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SUB-HEADER / TAB NAVIGATION BAR (If rendered inside the module) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            HR
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Workforce Attendance &amp; Shift Payroll Suite</h2>
            <p className="text-[11px] text-slate-500">Decoupled from production: biometric floor punches, shift roasters &amp; compensation disbursements.</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('attendance_dashboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'attendance_dashboard' || activeTab === 'payroll'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ◈ Attendance Dashboard
          </button>
          <button
            onClick={() => setActiveTab('daily_attendance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'daily_attendance'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ◈ Daily Punch Register
          </button>
          <button
            onClick={() => setActiveTab('shift_management')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'shift_management'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ◈ Shift Roster &amp; Rules
          </button>
          <button
            onClick={() => setActiveTab('payroll_register')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'payroll_register'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ₹ Payroll &amp; Compensation
          </button>
          <button
            onClick={() => setActiveTab('mobile_punch_terminal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'mobile_punch_terminal'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            ◈ Android App &amp; Terminal
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ATTENDANCE & PAYROLL DASHBOARD TAB */}
      {/* ========================================================================= */}
      {(activeTab === 'attendance_dashboard' || activeTab === 'payroll') && (
        <div className="space-y-6 animate-fade-in">
          
          {/* TOP 6 METRICS STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* 1. Total Workforce */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Staff</span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-2xl font-bold text-slate-900 font-mono">{totalStaffCount}</span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                  {staffSummary.filter(s => s.employeeType === 'Office Staff').length} Off &bull; {staffSummary.filter(s => s.employeeType !== 'Office Staff').length} Shop
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Karigars &amp; operators enrolled</p>
            </div>

            {/* 2. Present Today */}
            <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-xs bg-gradient-to-br from-white to-emerald-50/20">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Present Today</span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-2xl font-bold text-emerald-700 font-mono">{presentCount}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  {attendanceRate}% Present
                </span>
              </div>
              <p className="text-[10px] text-emerald-600 mt-1">{lateCount > 0 ? `${lateCount} Late Check-in` : 'All On-Time'}</p>
            </div>

            {/* 3. Absent / On Leave */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Absent / Leave</span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-2xl font-bold text-rose-600 font-mono">{absentOrLeaveCount}</span>
                <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-medium">
                  {absentOrLeaveCount === 0 ? 'Full Presence' : 'Leave logged'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Roster vacancy tracking</p>
            </div>

            {/* 4. Active Floor Shifts */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Shifts</span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-2xl font-bold text-slate-900 font-mono">{shifts.length}</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                  4 Active Lines
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Press, Punch, Flex &amp; Office</p>
            </div>

            {/* 5. PAYROLL PENDING TO GIVE (Highlighted User Requirement) */}
            <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-4 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Pending Payroll</span>
                <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded">Action Req</span>
              </div>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-xl font-bold text-amber-950 font-mono">
                  {formatCurrency(pendingPayrollAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-semibold text-amber-800">{pendingStaffList.length} staff pending</span>
                <button
                  type="button"
                  onClick={handleBulkDisburseAll}
                  className="text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded shadow-2xs transition-colors"
                  title="Disburse all pending staff payouts"
                >
                  Disburse All &rarr;
                </button>
              </div>
            </div>

            {/* 6. Disbursed Payroll (Paid) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Paid / Disbursed</span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-xl font-bold text-emerald-700 font-mono">
                  {formatCurrency(disbursedPayrollAmount)}
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                  Settled
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Total {formatCurrency(totalCalculatedPayroll)}</p>
            </div>

          </div>

          {/* SHIFT COVERAGE & FLOOR PRESENCE MATRIX */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Shift Coverage &amp; Machine Line Occupancy</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time presence mapped against assigned production shifts</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('shift_management')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
              >
                <span>Manage Shift Roster</span>
                <span>&rarr;</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {shifts.map(shift => {
                const assigned = staffSummary.filter(s => s.shiftId === shift.shiftId);
                const assignedIds = assigned.map(s => s.staffId);
                const presentInShift = dailyAttendance.filter(a => assignedIds.includes(a.staffId) && (a.status === 'Present' || a.status === 'Late')).length;
                const coveragePercent = assigned.length > 0 ? Math.round((presentInShift / assigned.length) * 100) : 100;

                return (
                  <div key={shift.shiftId} className="border border-slate-200/80 rounded-xl p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{shift.category}</span>
                        <h4 className="text-xs font-bold text-slate-900 mt-0.5">{shift.name}</h4>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        coveragePercent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {coveragePercent}%
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-600 font-mono mt-2 bg-white px-2 py-1 rounded-lg border border-slate-200/60">
                      <span>🕒 {shift.startTime} &ndash; {shift.endTime}</span>
                      <span className="text-slate-300">|</span>
                      <span>OT: ₹{shift.overtimeRatePerHour}/h</span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-500">Manned:</span>
                      <span className="font-bold text-slate-900 font-mono">{presentInShift} / {assigned.length} Members</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TWO-COLUMN SPLIT: LIVE FLOOR PUNCH FEED & PENDING PAYROLL QUEUE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT (7 cols): Today's Live Attendance Feed */}
            <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-sm font-bold text-slate-900">Today&apos;s Live Shop-Floor Attendance Feed</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('mobile_punch_terminal')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium transition-colors"
                  >
                    ◈ Test Mobile Punch
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('daily_attendance')}
                    className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                  >
                    View All &rarr;
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Staff &amp; Role</th>
                      <th className="py-2.5 px-3 font-semibold">Assigned Shift</th>
                      <th className="py-2.5 px-3 font-semibold">Check-In</th>
                      <th className="py-2.5 px-3 font-semibold">Punch Method</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyAttendance.map(att => (
                      <tr key={att.staffId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{att.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{att.role} &bull; {att.employeeType || 'Staff'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[11px] font-medium text-slate-700">{att.shiftName}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-800">
                          {att.checkIn || '--:--'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            (att.punchMethod || '').includes('Face')
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {att.punchMethod || 'Face Scan (App)'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                            att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            att.status === 'Late' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {att.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleAttendanceStatus(att.staffId, 'Present')}
                            className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold"
                            title="Mark Present"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleToggleAttendanceStatus(att.staffId, 'Leave')}
                            className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-semibold"
                            title="Mark Leave"
                          >
                            Leave
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT (5 cols): PAYROLL PENDING TO DISBURSE ACTION QUEUE */}
            <div className="lg:col-span-5 bg-white border border-amber-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Payroll Pending to Give (Disburse)</h3>
                    <p className="text-[11px] text-amber-800 mt-0.5">Shift-calculated salaries ready for bank transfer or cash handout</p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                    {pendingStaffList.length} Pending
                  </span>
                </div>

                <div className="divide-y divide-slate-100 mt-2 max-h-[380px] overflow-y-auto">
                  {pendingStaffList.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      ✓ All salaries for this cycle have been disbursed!
                    </div>
                  ) : (
                    pendingStaffList.map(staff => (
                      <div key={staff.staffId} className="py-3 flex items-center justify-between gap-2 hover:bg-amber-50/30 rounded-xl px-2 transition-colors">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">{staff.name}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">{staff.staffId}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {staff.role} &bull; <span className="font-mono">{staff.presentDays}/{staff.workingDays} days</span>
                            {staff.overtimeHours > 0 && <span className="text-emerald-600 font-semibold ml-1">(+{staff.overtimeHours}h OT)</span>}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          <div className="text-right">
                            <div className="font-bold text-slate-900 font-mono text-xs">
                              {formatCurrency(staff.netPayable)}
                            </div>
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold uppercase">
                              Pending
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDisburseStaffSalary(staff.staffId)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                          >
                            ₹ Disburse
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {pendingStaffList.length > 0 && (
                <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500">Total Pending:</span>
                    <span className="font-bold text-slate-900 font-mono ml-1.5 text-sm">{formatCurrency(pendingPayrollAmount)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBulkDisburseAll}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
                  >
                    ⚡ Disburse All Pending
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DAILY PUNCH REGISTER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'daily_attendance' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* FILTER CONTROLS BAR */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-500">Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Employee Type Filter */}
              <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${typeFilter === 'all' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'}`}
                >
                  All Staff
                </button>
                <button
                  onClick={() => setTypeFilter('office')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${typeFilter === 'office' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'}`}
                >
                  Office
                </button>
                <button
                  onClick={() => setTypeFilter('operator')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${typeFilter === 'operator' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'}`}
                >
                  Operators
                </button>
                <button
                  onClick={() => setTypeFilter('karigar')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${typeFilter === 'karigar' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'}`}
                >
                  Karigars (Piece-Rate)
                </button>
              </div>

              {/* Shift Filter */}
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none"
              >
                <option value="all">All Shifts</option>
                {shifts.map(sh => (
                  <option key={sh.shiftId} value={sh.shiftId}>{sh.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Leave">Leave / Absent</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowManualPunchModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
              >
                + Manual Override Punch
              </button>
            </div>
          </div>

          {/* ATTENDANCE TABLE */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Daily Shift Attendance Register &mdash; {selectedDate}
              </h3>
              <span className="text-xs text-slate-500">
                Showing {filteredDailyAttendance.length} records
              </span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Staff Member</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Assigned Shift</th>
                    <th className="py-3 px-4 font-semibold">Check-In</th>
                    <th className="py-3 px-4 font-semibold">Check-Out</th>
                    <th className="py-3 px-4 font-semibold">Hours Worked</th>
                    <th className="py-3 px-4 font-semibold">Overtime</th>
                    <th className="py-3 px-4 font-semibold">Punch Verification</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDailyAttendance.map(att => (
                    <tr key={att.staffId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{att.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{att.staffId} &bull; {att.role}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-medium text-slate-600">
                          {att.employeeType || 'Office Staff'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{att.shiftName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{att.shiftId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {att.checkIn || '--:--'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {att.checkOut || '--:--'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {att.hoursWorked ? `${att.hoursWorked} hrs` : '--'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {att.overtime || '0.0 hrs'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            (att.punchMethod || '').includes('Face')
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {att.punchMethod || 'Face Scan'}
                          </span>
                          {att.locationVerified && (
                            <span className="text-[10px] text-emerald-600 font-bold" title={att.location || 'Factory GPS radius verified'}>
                              ✓ GPS
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{att.device || 'Android App'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                          att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          att.status === 'Late' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleAttendanceStatus(att.staffId, 'Present')}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleToggleAttendanceStatus(att.staffId, 'Late')}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                        >
                          Late
                        </button>
                        <button
                          onClick={() => handleToggleAttendanceStatus(att.staffId, 'Leave')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                        >
                          Leave
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MANUAL OVERRIDE MODAL */}
          {showManualPunchModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Record Manual Override Punch</h3>
                  <button onClick={() => setShowManualPunchModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
                </div>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Select Employee</label>
                    <select
                      id="manualStaffSelect"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    >
                      {staffSummary.map(s => (
                        <option key={s.staffId} value={s.staffId}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Punch Type</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                        <input type="radio" name="manualPunchType" value="in" defaultChecked />
                        <span>Punch In</span>
                      </label>
                      <label className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                        <input type="radio" name="manualPunchType" value="out" />
                        <span>Punch Out</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Time</label>
                    <input
                      type="text"
                      defaultValue="09:00 AM"
                      id="manualPunchTime"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowManualPunchModal(false)}
                      className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selStaffId = document.getElementById('manualStaffSelect').value;
                        handleSimulateMobilePunch(selStaffId, 'Admin Manual Override');
                        setShowManualPunchModal(false);
                      }}
                      className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl shadow-xs"
                    >
                      Save Override
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SHIFT ROSTER & RULES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'shift_management' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* MASTER SHIFTS LIST */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Factory Shift Master &amp; Overtime Rules Engine</h3>
                <p className="text-xs text-slate-500 mt-0.5">Defines operational shift windows, grace allowances, and automated overtime triggers</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewShiftModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-3.5 rounded-xl transition-colors"
              >
                + Define New Shift
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {shifts.map(shift => {
                const assigned = staffSummary.filter(s => s.shiftId === shift.shiftId);

                return (
                  <div key={shift.shiftId} className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50/40 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          {shift.category}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-2">{shift.name}</h4>
                        <span className="text-[11px] font-mono text-slate-400">{shift.shiftId}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          {shift.startTime} &ndash; {shift.endTime}
                        </span>
                        <span className="block text-[10px] text-slate-500 font-mono">({shift.standardHours}h Net Work)</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2.5">{shift.description}</p>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
                      <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 block">Grace Window</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">{shift.gracePeriodMinutes} mins</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 block">Half-Day Min</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">{shift.halfDayMinHours} hrs</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                        <span className="text-[10px] text-slate-400 block">Overtime Rate</span>
                        <span className="text-xs font-bold text-emerald-700 font-mono">₹{shift.overtimeRatePerHour}/hr</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Assigned Team:</span>
                      <div className="flex items-center space-x-1">
                        {assigned.map(m => (
                          <span key={m.staffId} className="bg-slate-200 text-slate-800 font-bold text-[10px] px-2 py-0.5 rounded-full" title={`${m.name} (${m.role})`}>
                            {m.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STAFF SHIFT ASSIGNMENT MATRIX */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Employee &amp; Karigar Shift Assignment Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assign each member of the organization to their designated production or office shift</p>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Staff Member</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">Classification</th>
                    <th className="py-3 px-4 font-semibold">Assigned Shift</th>
                    <th className="py-3 px-4 font-semibold">Base Wage Model</th>
                    <th className="py-3 px-4 text-right font-semibold">Reassign Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffSummary.map(staff => (
                    <tr key={staff.staffId} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{staff.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{staff.staffId} &bull; {staff.role}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{staff.department}</td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          (staff.employeeType || '').includes('Karigar')
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : (staff.employeeType || '').includes('Operator')
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {staff.employeeType || 'Office Staff'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {staff.shiftName}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {staff.monthlySalary > 0
                          ? `${formatCurrency(staff.monthlySalary)} / mo`
                          : `Piece-rate (₹${staff.ratePerTag || 0.30}/tag)`}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={staff.shiftId}
                          onChange={(e) => handleAssignShift(staff.staffId, e.target.value)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1 text-slate-800 cursor-pointer"
                        >
                          {shifts.map(sh => (
                            <option key={sh.shiftId} value={sh.shiftId}>{sh.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* NEW SHIFT MODAL */}
          {showNewShiftModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Define New Shift</h3>
                  <button onClick={() => setShowNewShiftModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
                </div>
                <div className="space-y-4 mt-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Shift Name</label>
                    <input type="text" id="newShiftName" placeholder="e.g. Night Offset Press Shift" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Start Time</label>
                      <input type="text" id="newShiftStart" defaultValue="10:00 PM" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">End Time</label>
                      <input type="text" id="newShiftEnd" defaultValue="06:00 AM" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Grace Period (Mins)</label>
                      <input type="number" id="newShiftGrace" defaultValue="15" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Overtime Rate (₹/hr)</label>
                      <input type="number" id="newShiftOT" defaultValue="300" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button onClick={() => setShowNewShiftModal(false)} className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                    <button
                      type="button"
                      onClick={() => {
                        const name = document.getElementById('newShiftName').value || 'Custom Shift';
                        const newSh = {
                          shiftId: `SHIFT-${Date.now().toString().slice(-4)}`,
                          name: name,
                          category: 'Custom Production Shift',
                          startTime: document.getElementById('newShiftStart').value || '09:00 AM',
                          endTime: document.getElementById('newShiftEnd').value || '06:00 PM',
                          standardHours: 8,
                          breakMinutes: 60,
                          gracePeriodMinutes: Number(document.getElementById('newShiftGrace').value) || 15,
                          halfDayMinHours: 4.5,
                          overtimeRatePerHour: Number(document.getElementById('newShiftOT').value) || 250,
                          description: 'Custom added factory shift'
                        };
                        onUpdatePayroll({
                          ...payroll,
                          shifts: [...shifts, newSh]
                        });
                        setShowNewShiftModal(false);
                        showLocalToast(`Created shift "${name}"`);
                      }}
                      className="px-4 py-2 font-bold bg-slate-900 text-white rounded-xl shadow-xs"
                    >
                      Save Shift
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PAYROLL & COMPENSATION REGISTER TAB */}
      {/* ========================================================================= */}
      {activeTab === 'payroll_register' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* HEADER SUMMARY CARD */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Monthly Staff &amp; Karigar Payroll Computation</h3>
                <p className="text-xs text-slate-500 mt-0.5">Calculated based on shift roster attendance days, overtime hours &amp; artisan piece-rate completions</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">Pending To Give:</span>
                  <span className="font-bold text-amber-700 font-mono text-base">{formatCurrency(pendingPayrollAmount)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleBulkDisburseAll}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-colors"
                >
                  ⚡ Disburse All Pending
                </button>
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Staff Member</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Assigned Shift</th>
                    <th className="py-3 px-4 font-semibold">Base Salary / Rate</th>
                    <th className="py-3 px-4 font-semibold">Days (Present/Work)</th>
                    <th className="py-3 px-4 font-semibold">Overtime Pay</th>
                    <th className="py-3 px-4 font-semibold">Piece-Rate Bonus</th>
                    <th className="py-3 px-4 font-semibold">Net Payable</th>
                    <th className="py-3 px-4 font-semibold">Disbursement Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffSummary.map(staff => (
                    <tr key={staff.staffId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{staff.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{staff.role}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-slate-600 font-medium">{staff.employeeType || 'Office'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {staff.shiftName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {staff.monthlySalary > 0 ? formatCurrency(staff.monthlySalary) : `₹${staff.ratePerTag || 0.30}/tag`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-mono">
                        {staff.presentDays} / {staff.workingDays}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">
                        {staff.overtimeHours > 0 ? `+${formatCurrency(staff.overtimeHours * (staff.overtimeRatePerHour || 250))}` : '₹0'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700">
                        {staff.bonus > 0 ? `+${formatCurrency(staff.bonus)}` : '₹0'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-sm">
                        {formatCurrency(staff.netPayable)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          staff.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {staff.status || 'Pending'}
                        </span>
                        {staff.disbursedAt && (
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">{staff.disbursedAt}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {staff.status === 'Paid' ? (
                          <span className="text-[10px] font-bold text-emerald-600">✓ Settled</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDisburseStaffSalary(staff.staffId)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg shadow-2xs transition-all"
                          >
                            ₹ Disburse
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PIECE-RATE HANDWORK PRODUCTION LEDGER */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs text-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Piece-Rate Handwork (Dori &amp; Plastic) Production Ledger
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily earnings accrued per completed tag batch by artisans (Standard: ₹0.20 Dori + ₹0.10 Plastic = ₹0.30/tag)
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500">Total Piece Payouts:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {formatCurrency((pieceRateLedger || []).reduce((s, it) => s + (Number(it.earnedAmount) || 0), 0))}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">Tags Finished:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {(pieceRateLedger || []).reduce((s, it) => s + (Number(it.piecesCompleted) || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>

            {(pieceRateLedger && pieceRateLedger.length > 0) ? (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Date</th>
                      <th className="py-3 px-4 font-semibold">Artisan</th>
                      <th className="py-3 px-4 font-semibold">Job / Order Ref</th>
                      <th className="py-3 px-4 font-semibold">Pieces Assembled</th>
                      <th className="py-3 px-4 font-semibold">Rate / Tag</th>
                      <th className="py-3 px-4 font-mono font-semibold">Total Earned</th>
                      <th className="py-3 px-4 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pieceRateLedger.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4 font-mono text-slate-500">{item.date}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">{item.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{item.staffId}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-900">{item.jobId}</span>
                          <span className="text-slate-500 text-[10px] ml-1.5 font-mono">({item.orderId})</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                          {Number(item.piecesCompleted || 0).toLocaleString()} tags
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          ₹{Number(item.ratePerTag || 0.30).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-sm">
                          {formatCurrency(item.earnedAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.status || 'Earned'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-3">
                No handwork batches completed yet. As soon as a handwork batch is finished in the production flow, piece-rate earnings will automatically post here.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ANDROID APP & TERMINAL SIMULATOR (PUNCH IN/OUT & KARIGAR JOB MOVING) */}
      {/* ========================================================================= */}
      {activeTab === 'mobile_punch_terminal' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT (7 cols): INTERACTIVE ANDROID APP DEVICE VIEWFINDER */}
            <div className="lg:col-span-7 flex flex-col items-center">
              
              {/* Smartphone Bezel Container */}
              <div className="w-full max-w-[400px] bg-slate-900 rounded-[44px] p-4 shadow-2xl border-4 border-slate-800 text-slate-100 relative">
                
                {/* Speaker Grill & Selfie Cam */}
                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                </div>

                {/* In-App Status Bar */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-3 pb-2 border-b border-slate-800">
                  <span>09:41 AM</span>
                  <div className="flex items-center space-x-1.5">
                    <span>📶 5G</span>
                    <span>📍 GPS OK</span>
                    <span>🔋 94%</span>
                  </div>
                </div>

                {/* App Screen Content */}
                <div className="bg-slate-950 rounded-[32px] p-4 min-h-[580px] flex flex-col justify-between mt-2 border border-slate-800/80">
                  
                  {/* App Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold">uBMS Mobile &bull; Floor Terminal</span>
                        <h4 className="text-sm font-bold text-white">Karigar &amp; Staff Suite</h4>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                        v1.2 Live
                      </span>
                    </div>

                    {/* Mode Switcher Tabs Inside Android App */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl mt-3 text-[11px] font-medium text-center">
                      <button
                        onClick={() => { setTerminalTab('facescan'); setScanState('idle'); }}
                        className={`py-1.5 rounded-lg transition-all ${terminalTab === 'facescan' ? 'bg-slate-800 text-emerald-400 font-bold shadow-xs' : 'text-slate-400'}`}
                      >
                        📷 Face Scan
                      </button>
                      <button
                        onClick={() => { setTerminalTab('geofence'); setScanState('idle'); }}
                        className={`py-1.5 rounded-lg transition-all ${terminalTab === 'geofence' ? 'bg-slate-800 text-emerald-400 font-bold shadow-xs' : 'text-slate-400'}`}
                      >
                        📍 Geofence
                      </button>
                      <button
                        onClick={() => { setTerminalTab('jobmove'); setScanState('idle'); }}
                        className={`py-1.5 rounded-lg transition-all ${terminalTab === 'jobmove' ? 'bg-slate-800 text-emerald-400 font-bold shadow-xs' : 'text-slate-400'}`}
                      >
                        📦 Move Job
                      </button>
                    </div>

                    {/* Select Active Testing Staff Member */}
                    <div className="mt-3">
                      <label className="text-[10px] text-slate-400 block mb-1">Simulated User Profile:</label>
                      <select
                        value={selectedMobileStaffId}
                        onChange={(e) => { setSelectedMobileStaffId(e.target.value); setScanState('idle'); }}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-2.5 py-1.5 focus:outline-none"
                      >
                        {staffSummary.map(s => (
                          <option key={s.staffId} value={s.staffId}>
                            {s.name} ({s.role} &bull; {s.employeeType || 'Staff'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ACTIVE TAB 1: FACE SCAN TERMINAL */}
                  {terminalTab === 'facescan' && (
                    <div className="my-auto py-2 flex flex-col items-center">
                      
                      {/* Biometric Camera Viewfinder Reticle */}
                      <div className="w-52 h-52 rounded-3xl border-2 border-dashed border-emerald-500/80 bg-slate-900/60 relative flex flex-col items-center justify-center overflow-hidden shadow-inner">
                        
                        {/* Animated Laser Scan Bar */}
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2"></div>
                        
                        {/* Face Silhouette Icon */}
                        <svg className="w-24 h-24 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                          <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
                          <path d="M19 14v1a7 7 0 0 1-14 0v-1" />
                          <line x1="12" y1="19" x2="12" y2="22" />
                        </svg>

                        {/* Corner Target Marks */}
                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>

                        {/* Confidence Match Badge */}
                        <div className="absolute bottom-2 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full">
                          99.4% Match Verified
                        </div>
                      </div>

                      {/* Recognized Member Details */}
                      {(() => {
                        const activeUser = staffSummary.find(s => s.staffId === selectedMobileStaffId) || staffSummary[0];
                        return (
                          <div className="w-full mt-3 bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Identified Employee</span>
                            <div className="text-sm font-bold text-white mt-0.5">{activeUser?.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{activeUser?.role} &bull; {activeUser?.shiftName}</div>
                            <div className="text-[10px] text-slate-500 mt-1">Liveness: Passive Blink Verified &bull; Latency 240ms</div>
                          </div>
                        );
                      })()}

                      <button
                        type="button"
                        onClick={() => {
                          handleSimulateMobilePunch(selectedMobileStaffId, 'Face Scan (Android App)');
                          setScanState('punched');
                        }}
                        className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2"
                      >
                        <span>📷</span>
                        <span>{scanState === 'punched' ? '✓ Punch Recorded Live!' : 'Confirm & Auto-Punch In/Out'}</span>
                      </button>
                    </div>
                  )}

                  {/* ACTIVE TAB 2: GEOFENCE / LOCATION TERMINAL */}
                  {terminalTab === 'geofence' && (
                    <div className="my-auto py-2 flex flex-col items-center text-center">
                      
                      {/* Radar Animation Box */}
                      <div className="w-48 h-48 rounded-full border border-blue-500/40 bg-slate-900/40 relative flex items-center justify-center">
                        <div className="w-36 h-36 rounded-full border border-blue-500/30"></div>
                        <div className="w-24 h-24 rounded-full border border-blue-500/20"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-500 animate-ping"></div>
                        <div className="w-3 h-3 rounded-full bg-blue-400 absolute"></div>
                        <div className="absolute top-3 text-[9px] font-mono text-blue-400">FACTORY GEOFENCE (50m)</div>
                      </div>

                      <div className="w-full mt-3 bg-slate-900 border border-slate-800 rounded-xl p-3 text-left">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Current Position:</span>
                          <span className="font-bold text-emerald-400 font-mono">18m from Unit 1 Gate</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-slate-400">Factory Wi-Fi BSSID:</span>
                          <span className="font-mono text-white text-[11px]">UBMS_FACTORY_5G (Matched)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-slate-400">Mock Location Check:</span>
                          <span className="text-emerald-400 text-[11px] font-bold">Passed (Zero Spoofing)</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleSimulateMobilePunch(selectedMobileStaffId, 'Location / Geofence');
                          setScanState('punched');
                        }}
                        className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2"
                      >
                        <span>📍</span>
                        <span>{scanState === 'punched' ? '✓ Punch Recorded Live!' : 'Mark Attendance (Within Geofence)'}</span>
                      </button>
                    </div>
                  )}

                  {/* ACTIVE TAB 3: KARIGAR JOB MOVING SCANNER */}
                  {terminalTab === 'jobmove' && (
                    <div className="my-auto py-2 flex flex-col justify-between">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded">Karigar Studio</span>
                          <span className="text-[11px] font-mono text-slate-300">Job: JO_01_P1</span>
                        </div>

                        <div className="mt-2.5 space-y-1">
                          <div className="text-xs font-bold text-white">Order: MGC01 &bull; MG Creation</div>
                          <div className="text-[11px] text-slate-400">Item: 350 GSM Art Card Luxury Hangtag</div>
                          <div className="text-[11px] text-emerald-400">Current Stage: 4. Handwork &amp; Assembly</div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-800">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Enter Completed Tags (Pieces):
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={jobMovePieces}
                              onChange={(e) => setJobMovePieces(e.target.value)}
                              className="bg-slate-950 border border-slate-700 text-white font-mono text-sm rounded-xl px-3 py-2 w-full focus:outline-none"
                            />
                            <span className="text-xs text-slate-400">pcs</span>
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs">
                            <span className="text-slate-400">Piece Rate (@ ₹0.30/tag):</span>
                            <span className="font-bold text-emerald-400 font-mono text-sm">
                              {formatCurrency((Number(jobMovePieces) || 0) * 0.30)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const pieces = Number(jobMovePieces) || 0;
                          const earned = pieces * 0.30;
                          const activeUser = staffSummary.find(s => s.staffId === selectedMobileStaffId) || staffSummary[0];

                          const newLedgerItem = {
                            date: selectedDate,
                            jobId: 'JO_01_P1',
                            orderId: 'MGC01',
                            staffId: activeUser.staffId,
                            name: activeUser.name,
                            piecesCompleted: pieces,
                            ratePerTag: 0.30,
                            earnedAmount: earned,
                            status: 'Earned'
                          };

                          const updatedSummary = staffSummary.map(s => s.staffId === activeUser.staffId ? {
                            ...s,
                            netPayable: (s.netPayable || 0) + earned,
                            bonus: (s.bonus || 0) + earned
                          } : s);

                          onUpdatePayroll({
                            ...payroll,
                            staffSummary: updatedSummary,
                            pieceRateLedger: [newLedgerItem, ...pieceRateLedger]
                          });

                          showLocalToast(`Job JO_01_P1 moved! Credited ${formatCurrency(earned)} to ${activeUser.name}'s payroll!`);
                        }}
                        className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2"
                      >
                        <span>✓</span>
                        <span>Complete Batch &amp; Credit My Payroll</span>
                      </button>
                    </div>
                  )}

                  {/* Bottom Home Indicator */}
                  <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-3"></div>

                </div>
              </div>
            </div>

            {/* RIGHT (5 cols): EXPERT ARCHITECTURAL RECOMMENDATION & ANALYSIS */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                  Technical Architecture
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">
                  Face Scan vs. Location-Based Punch: The Best Approach
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Here is an honest, production-tested engineering evaluation of biometric face recognition vs. location geofencing for manufacturing units and karigars:
                </p>

                <div className="space-y-3 mt-4 text-xs">
                  
                  {/* Face Scan Analysis */}
                  <div className="border border-emerald-200/90 bg-emerald-50/30 p-3.5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900">★ 1. Face Scan (Your Favorite &amp; Recommended)</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Best Choice</span>
                    </div>
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-700">
                      <li><strong>Hands-Free &amp; Karigar Friendly</strong>: Karigars handling glue, ink, and dori cords have soiled fingertips where fingerprint scanners fail. Face scan is 100% contactless.</li>
                      <li><strong>Zero Buddy-Punching</strong>: Impossible for one worker to punch in for another.</li>
                      <li><strong>On-Device Machine Learning</strong>: Uses Google ML Kit Face Detection + TensorFlow Lite MobileFaceNet running fully offline on the Android device in under 300ms without internet delays.</li>
                    </ul>
                  </div>

                  {/* Location Analysis */}
                  <div className="border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">2. Location / Geofence Only</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">Fallback</span>
                    </div>
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-slate-600">
                      <li><strong>Weakness in Industrial Sheds</strong>: Metal roofs and RCC factory structures cause severe GPS signal attenuation and drift (accuracy drops from 5m to 80m).</li>
                      <li><strong>Vulnerable to Spoofing</strong>: Android mock-location apps can spoof coordinates unless developer mode checks are strictly enforced.</li>
                      <li><strong>Solution if used</strong>: Pair GPS with <em>Factory Wi-Fi BSSID (Router MAC)</em> verification as demonstrated in the simulator.</li>
                    </ul>
                  </div>

                  {/* Unified Karigar App Recommendation */}
                  <div className="border border-indigo-200 bg-indigo-50/30 p-3.5 rounded-xl">
                    <span className="font-bold text-indigo-950">★ The Unified App Strategy:</span>
                    <p className="mt-1 text-slate-700 leading-relaxed">
                      Deploy <strong>One Single Android App</strong> with role-adaptive permissions:
                    </p>
                    <ol className="list-decimal pl-4 mt-1.5 space-y-1 text-slate-700">
                      <li><strong>Factory Gate / Shop Floor Terminal</strong>: A single mounted Android tablet (e.g. ₹10,000 Samsung Tab A8) at the entrance handles fast kiosk face scans for all employees as they enter.</li>
                      <li><strong>Karigar Floor Mode</strong>: Sumit and artisans open the app on floor phones to scan Job QR codes (`JO_01_P1`), move work across stations, and track live piece-rate earnings.</li>
                    </ol>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

window.uBMS.AttendancePayrollSection = AttendancePayrollSection;
