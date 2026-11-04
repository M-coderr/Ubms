// Attendance, Shifts & Workforce Payroll Module for uBMS (PagarBook Compliant)
window.uBMS = window.uBMS || {};

function AttendancePayrollSection({
  activeTab,
  setActiveTab,
  payroll,
  onUpdatePayroll,
  users,
  onUpdateUsers,
  orders,
  formatCurrency,
  formatDate
}) {
  const staffSummary = payroll?.staffSummary || [];
  const dailyAttendance = payroll?.dailyAttendance || [];
  const pieceRateLedger = payroll?.pieceRateLedger || [];
  
  // Default Factory Shifts with PagarBook Shift Types (Monthly Basis vs Daily Basis)
  const shifts = (payroll?.shifts && payroll.shifts.length > 0) ? payroll.shifts : [
    {
      shiftId: 'SHIFT-GEN',
      name: 'General Day Shift',
      shiftType: 'Monthly Basis',
      category: 'Office & Executive',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      standardHours: 8,
      breakMinutes: 60,
      gracePeriodMinutes: 15,
      halfDayMinHours: 4.5,
      overtimeRatePerHour: 350,
      dailyWage: 0,
      description: 'Monthly salaried shift for executive & administrative staff (pro-rated per 26 days).'
    },
    {
      shiftId: 'SHIFT-PRESS',
      name: 'Printing Press Early Shift',
      shiftType: 'Daily Basis',
      category: 'Machine Operations',
      startTime: '08:00 AM',
      endTime: '05:00 PM',
      standardHours: 8,
      breakMinutes: 60,
      gracePeriodMinutes: 15,
      halfDayMinHours: 4.5,
      overtimeRatePerHour: 250,
      dailyWage: 1050,
      description: 'Daily wage basis shift for pre-press and offset machine operators (calculated per day present).'
    },
    {
      shiftId: 'SHIFT-PUNCH',
      name: 'Punching & Die Press Shift',
      shiftType: 'Daily Basis',
      category: 'Machine Operations',
      startTime: '08:30 AM',
      endTime: '05:30 PM',
      standardHours: 8,
      breakMinutes: 60,
      gracePeriodMinutes: 15,
      halfDayMinHours: 4.5,
      overtimeRatePerHour: 250,
      dailyWage: 1000,
      description: 'Daily wage basis shift for die-cutting, corner rounding, and hole punch operators.'
    },
    {
      shiftId: 'SHIFT-ARTISAN',
      name: 'Artisan Flexible Piece Shift',
      shiftType: 'Piece-Rate Basis',
      category: 'Handwork & Karigars',
      startTime: '09:00 AM',
      endTime: '07:00 PM',
      standardHours: 8,
      breakMinutes: 60,
      gracePeriodMinutes: 30,
      halfDayMinHours: 4.0,
      overtimeRatePerHour: 200,
      dailyWage: 0,
      ratePerTag: 0.30,
      description: 'Flexible assembly station for Dori attachment & plastic seal lock tagging.'
    }
  ];

  // Default Staff Loans & Advance EMI Ledger
  const loans = (payroll?.loans && payroll.loans.length > 0) ? payroll.loans : [
    {
      loanId: 'LOAN-001',
      staffId: 'USR-PRN-01',
      staffName: 'Kanu',
      role: 'Printing Operator',
      department: 'Printing Unit',
      principalAmount: 20000,
      disbursedDate: '2026-10-10',
      reason: 'Family Medical Emergency',
      monthlyEmi: 2000,
      totalTenureMonths: 10,
      totalRepaid: 4000,
      remainingBalance: 16000,
      status: 'Active',
      repaymentHistory: [
        { emiNo: 1, date: '2026-10-31', amount: 2000, method: 'Salary Auto-Deduction', note: 'October Salary EMI' },
        { emiNo: 2, date: '2026-11-01', amount: 2000, method: 'Salary Auto-Deduction', note: 'November Salary EMI' }
      ]
    },
    {
      loanId: 'LOAN-002',
      staffId: 'USR-LAB-01',
      staffName: 'Sumit',
      role: 'Dori Plastic Artisan',
      department: 'Handwork & Assembly Unit',
      principalAmount: 10000,
      disbursedDate: '2026-10-20',
      reason: 'Festival & Travel Advance',
      monthlyEmi: 1000,
      totalTenureMonths: 10,
      totalRepaid: 1000,
      remainingBalance: 9000,
      status: 'Active',
      repaymentHistory: [
        { emiNo: 1, date: '2026-10-31', amount: 1000, method: 'Salary Auto-Deduction', note: 'October Settlement' }
      ]
    }
  ];

  // Local state for filters and controls
  const [selectedDate, setSelectedDate] = React.useState('2026-11-03');
  const [typeFilter, setTypeFilter] = React.useState('all'); // 'all', 'office', 'operator', 'karigar'
  const [statusFilter, setStatusFilter] = React.useState('all'); // 'all', 'Present', 'Late', 'Leave'
  const [shiftFilter, setShiftFilter] = React.useState('all');
  
  // Modals state
  const [showManualPunchModal, setShowManualPunchModal] = React.useState(false);
  const [showNewShiftModal, setShowNewShiftModal] = React.useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = React.useState(false);
  const [showGrantLoanModal, setShowGrantLoanModal] = React.useState(false);
  const [viewingLoanLedger, setViewingLoanLedger] = React.useState(null);
  const [collectingLoanEmi, setCollectingLoanEmi] = React.useState(null);
  const [toastMessage, setToastMessage] = React.useState(null);

  // Instant Inline Edit State for Punch Register
  // { staffId, field: 'checkIn' | 'checkOut', value }
  const [editingPunch, setEditingPunch] = React.useState(null);

  // Month-wise Report Filters
  const [reportMonth, setReportMonth] = React.useState('2026-11');
  const [reportEmployeeId, setReportEmployeeId] = React.useState('all');
  const [viewingStaffCalendar, setViewingStaffCalendar] = React.useState(null);

  // Mobile Terminal Simulator State
  const [terminalTab, setTerminalTab] = React.useState('facescan');
  const [selectedMobileStaffId, setSelectedMobileStaffId] = React.useState(staffSummary[0]?.staffId || 'USR-SADM-01');
  const [scanState, setScanState] = React.useState('idle');
  const [jobMovePieces, setJobMovePieces] = React.useState('5200');

  const showLocalToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper: Parse '08:30 AM' or '17:00' to minutes from midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || timeStr === '--:--') return null;
    const clean = timeStr.trim();
    const isPM = clean.toUpperCase().includes('PM');
    const isAM = clean.toUpperCase().includes('AM');
    const parts = clean.replace(/AM|PM/i, '').trim().split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10) || 0;
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Helper: Format minutes from midnight to '09:00 AM'
  const formatMinutesToTime = (totalMinutes) => {
    if (totalMinutes === null || isNaN(totalMinutes)) return '--:--';
    let hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const mm = minutes < 10 ? `0${minutes}` : minutes;
    const hh = hours < 10 ? `0${hours}` : hours;
    return `${hh}:${mm} ${period}`;
  };

  // --- STATS COMPUTATION ---
  const totalStaffCount = staffSummary.length;
  const presentCount = dailyAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const lateCount = dailyAttendance.filter(a => a.status === 'Late').length;
  const absentOrLeaveCount = dailyAttendance.filter(a => a.status === 'Leave' || a.status === 'Absent').length;
  const attendanceRate = totalStaffCount > 0 ? Math.round((presentCount / totalStaffCount) * 100) : 0;

  // Loan Metrics
  const activeLoans = loans.filter(l => l.status === 'Active');
  const totalLoanPrincipal = loans.reduce((sum, l) => sum + (Number(l.principalAmount) || 0), 0);
  const totalLoanRepaid = loans.reduce((sum, l) => sum + (Number(l.totalRepaid) || 0), 0);
  const totalLoanBalance = loans.reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
  const monthlyEmiDue = activeLoans.reduce((sum, l) => sum + (Number(l.monthlyEmi) || 0), 0);

  // Dynamic Payroll Calculation Engine factoring Shift Basis (Monthly vs Daily) & Loan EMI
  const calculatedStaffList = staffSummary.map(staff => {
    const shift = shifts.find(s => s.shiftId === staff.shiftId) || shifts[0];
    const wageType = staff.wageType || (shift.shiftType === 'Daily Basis' ? 'Daily Basis' : staff.monthlySalary > 0 ? 'Monthly Basis' : 'Piece-Rate Basis');
    const presentDays = Number(staff.presentDays) || 0;
    const workingDays = Number(staff.workingDays) || 26;
    const dailyWage = Number(staff.dailyWage) || shift.dailyWage || 0;
    const monthlySalary = Number(staff.monthlySalary) || 0;
    const overtimeHours = Number(staff.overtimeHours) || 0;
    const otRate = Number(staff.overtimeRatePerHour) || shift.overtimeRatePerHour || 250;
    const overtimePay = overtimeHours * otRate;
    const bonus = Number(staff.bonus) || 0;

    // 1. Calculate Base Wage
    let baseEarnings = 0;
    if (wageType === 'Daily Basis') {
      baseEarnings = presentDays * dailyWage;
    } else if (wageType === 'Monthly Basis') {
      const perDayRate = workingDays > 0 ? (monthlySalary / workingDays) : 0;
      baseEarnings = Math.round(presentDays * perDayRate);
    } else {
      // Piece-rate (Sumit)
      baseEarnings = 0;
    }

    // 2. Loan EMI Deduction
    const staffActiveLoan = loans.find(l => l.staffId === staff.staffId && l.status === 'Active');
    const loanEmi = staffActiveLoan ? Math.min(Number(staffActiveLoan.monthlyEmi) || 0, Number(staffActiveLoan.remainingBalance) || 0) : 0;

    // 3. Gross & Net Calculation
    const grossEarnings = baseEarnings + overtimePay + bonus;
    const otherDeductions = Number(staff.deductions) || 0;
    const netPayable = Math.max(0, grossEarnings - loanEmi - otherDeductions);

    return {
      ...staff,
      wageType,
      dailyWage,
      baseEarnings,
      overtimePay,
      loanEmi,
      netPayable: staff.status === 'Paid' ? (staff.netPayable || netPayable) : netPayable,
      activeLoanId: staffActiveLoan ? staffActiveLoan.loanId : null,
      loanBalance: staffActiveLoan ? staffActiveLoan.remainingBalance : 0
    };
  });

  const totalCalculatedPayroll = calculatedStaffList.reduce((sum, s) => sum + (Number(s.netPayable) || 0), 0);
  const pendingStaffList = calculatedStaffList.filter(s => s.status !== 'Paid');
  const pendingPayrollAmount = pendingStaffList.reduce((sum, s) => sum + (Number(s.netPayable) || 0), 0);
  const disbursedPayrollAmount = calculatedStaffList.filter(s => s.status === 'Paid').reduce((sum, s) => sum + (Number(s.netPayable) || 0), 0);

  // --- HANDLERS ---

  // 1. Instant Inline Edit Check In / Check Out Handler
  const handleQuickEditPunch = (staffId, field, newTime) => {
    const matchedAtt = dailyAttendance.find(a => a.staffId === staffId && (a.date === selectedDate || !a.date));
    const shift = shifts.find(s => s.shiftId === (matchedAtt?.shiftId || 'SHIFT-GEN')) || shifts[0];

    let checkIn = field === 'checkIn' ? newTime : matchedAtt?.checkIn || '--:--';
    let checkOut = field === 'checkOut' ? newTime : matchedAtt?.checkOut || '--:--';
    
    let hoursWorked = matchedAtt?.hoursWorked || 0;
    let overtime = matchedAtt?.overtime || '0.0 hrs';
    let status = matchedAtt?.status || 'Present';

    const inMin = parseTimeToMinutes(checkIn);
    const outMin = parseTimeToMinutes(checkOut);
    const shiftStartMin = parseTimeToMinutes(shift.startTime) || 540;

    // Check Late Status
    if (inMin !== null) {
      const graceThreshold = shiftStartMin + (shift.gracePeriodMinutes || 15);
      if (inMin > graceThreshold) {
        status = 'Late';
      } else {
        status = 'Present';
      }
    }

    // Check Hours & Overtime if both times set
    if (inMin !== null && outMin !== null && outMin > inMin) {
      let netWorkingMinutes = outMin - inMin;
      if (netWorkingMinutes >= 240) {
        netWorkingMinutes -= (shift.breakMinutes || 60);
      }
      hoursWorked = Math.max(0, Number((netWorkingMinutes / 60).toFixed(2)));
      const std = shift.standardHours || 8;
      if (hoursWorked > std) {
        const otHours = Number((hoursWorked - std).toFixed(2));
        overtime = `${otHours} hrs`;
      } else {
        overtime = '0.0 hrs';
      }
      if (hoursWorked < (shift.halfDayMinHours || 4.5)) {
        status = 'Half-Day';
      }
    }

    const updatedDaily = dailyAttendance.map(att => {
      if (att.staffId === staffId && (att.date === selectedDate || !att.date)) {
        return {
          ...att,
          [field]: newTime,
          hoursWorked,
          overtime,
          status
        };
      }
      return att;
    });

    onUpdatePayroll({
      ...payroll,
      dailyAttendance: updatedDaily,
      loans
    });

    setEditingPunch(null);
    showLocalToast(`Updated ${field === 'checkIn' ? 'Check-In' : 'Check-Out'} to ${newTime} (${hoursWorked}h worked, ${overtime} OT)`);
  };

  // 2. Attendance Status Toggle
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
      dailyAttendance: updatedDaily,
      loans
    });
    showLocalToast(`Attendance status updated to "${newStatus}"`);
  };

  // 3. Disburse Salary (Auto-deducts loan EMI if active loan exists)
  const handleDisburseStaffSalary = (staffId) => {
    const staff = calculatedStaffList.find(s => s.staffId === staffId);
    if (!staff) return;

    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Deduct EMI if staff has an active loan
    let updatedLoans = [...loans];
    if (staff.loanEmi > 0 && staff.activeLoanId) {
      updatedLoans = updatedLoans.map(l => {
        if (l.loanId === staff.activeLoanId) {
          const emiPaid = staff.loanEmi;
          const newRepaid = (Number(l.totalRepaid) || 0) + emiPaid;
          const newBal = Math.max(0, (Number(l.remainingBalance) || 0) - emiPaid);
          const historyEntry = {
            emiNo: (l.repaymentHistory || []).length + 1,
            date: now.toISOString().split('T')[0],
            amount: emiPaid,
            method: 'Salary Auto-Deduction',
            note: `${now.toLocaleString('default', { month: 'long' })} Salary Disbursement Recovery`
          };
          return {
            ...l,
            totalRepaid: newRepaid,
            remainingBalance: newBal,
            status: newBal <= 0 ? 'Closed' : 'Active',
            repaymentHistory: [...(l.repaymentHistory || []), historyEntry]
          };
        }
        return l;
      });
    }

    const updatedSummary = calculatedStaffList.map(s => {
      if (s.staffId === staffId) {
        return {
          ...s,
          status: 'Paid',
          netPayable: staff.netPayable,
          disbursedAt: timestamp
        };
      }
      return s;
    });

    onUpdatePayroll({
      ...payroll,
      staffSummary: updatedSummary,
      loans: updatedLoans
    });

    showLocalToast(`Disbursed ${formatCurrency(staff.netPayable)} to ${staff.name} ${staff.loanEmi > 0 ? `(Recovered ${formatCurrency(staff.loanEmi)} EMI)` : ''}`);
  };

  // 4. Bulk Disburse All
  const handleBulkDisburseAll = () => {
    if (pendingStaffList.length === 0) {
      showLocalToast('No pending salaries to disburse.');
      return;
    }

    const now = new Date();
    const timestamp = now.toLocaleDateString('en-GB') + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Deduct active loan EMIs
    let updatedLoans = [...loans];
    pendingStaffList.forEach(pStaff => {
      if (pStaff.loanEmi > 0 && pStaff.activeLoanId) {
        updatedLoans = updatedLoans.map(l => {
          if (l.loanId === pStaff.activeLoanId) {
            const emiPaid = pStaff.loanEmi;
            const newRepaid = (Number(l.totalRepaid) || 0) + emiPaid;
            const newBal = Math.max(0, (Number(l.remainingBalance) || 0) - emiPaid);
            const historyEntry = {
              emiNo: (l.repaymentHistory || []).length + 1,
              date: now.toISOString().split('T')[0],
              amount: emiPaid,
              method: 'Salary Auto-Deduction',
              note: `${now.toLocaleString('default', { month: 'long' })} Salary Recovery`
            };
            return {
              ...l,
              totalRepaid: newRepaid,
              remainingBalance: newBal,
              status: newBal <= 0 ? 'Closed' : 'Active',
              repaymentHistory: [...(l.repaymentHistory || []), historyEntry]
            };
          }
          return l;
        });
      }
    });

    const updatedSummary = calculatedStaffList.map(s => ({
      ...s,
      status: 'Paid',
      netPayable: s.netPayable,
      disbursedAt: s.disbursedAt || timestamp
    }));

    onUpdatePayroll({
      ...payroll,
      staffSummary: updatedSummary,
      loans: updatedLoans
    });
    showLocalToast(`Bulk disbursed ${formatCurrency(pendingPayrollAmount)} across ${pendingStaffList.length} staff members!`);
  };

  // 5. Add / Enroll New Staff Member
  const handleAddEmployeeSubmit = (employeeData) => {
    const prefix = employeeData.employeeType === 'Office Staff' ? 'USR-ADM' : employeeData.employeeType === 'Machine Operator' ? 'USR-OPR' : 'USR-LAB';
    const newStaffId = `${prefix}-${Date.now().toString().slice(-4)}`;
    const matchedShift = shifts.find(sh => sh.shiftId === employeeData.shiftId) || shifts[0];

    // Create Team Member for users.json
    const newTeamMember = {
      id: newStaffId,
      name: employeeData.name,
      email: employeeData.email || `${employeeData.name.toLowerCase().replace(/\s+/g, '.')}@ubms.internal`,
      phone: employeeData.phone || '+91 98000 00000',
      role: employeeData.role,
      roleLabel: employeeData.role,
      department: employeeData.department,
      status: 'Active',
      avatar: employeeData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      permissions: ['staff']
    };

    // Create Staff Summary for payroll.json
    const newSummaryItem = {
      staffId: newStaffId,
      name: employeeData.name,
      role: employeeData.role,
      employeeType: employeeData.employeeType,
      department: employeeData.department,
      shiftId: employeeData.shiftId,
      shiftName: matchedShift.name,
      wageType: employeeData.wageType, // 'Monthly Basis' | 'Daily Basis' | 'Piece-Rate Basis'
      monthlySalary: Number(employeeData.monthlySalary) || 0,
      dailyWage: Number(employeeData.dailyWage) || 0,
      ratePerTag: Number(employeeData.ratePerTag) || 0,
      workingDays: Number(employeeData.workingDays) || 26,
      presentDays: 0,
      leavesTaken: 0,
      overtimeHours: 0,
      overtimeRatePerHour: Number(employeeData.overtimeRatePerHour) || matchedShift.overtimeRatePerHour || 250,
      bonus: 0,
      deductions: 0,
      loanEmi: 0,
      loanBalance: 0,
      netPayable: 0,
      status: 'Pending',
      disbursedAt: null
    };

    // Initial daily attendance entry
    const newDailyAtt = {
      date: selectedDate,
      staffId: newStaffId,
      name: employeeData.name,
      role: employeeData.role,
      employeeType: employeeData.employeeType,
      shiftId: employeeData.shiftId,
      shiftName: matchedShift.name,
      status: 'Present',
      checkIn: '--:--',
      checkOut: '--:--',
      hoursWorked: 0,
      overtime: '0.0 hrs',
      punchMethod: 'Registered',
      device: 'System Portal',
      location: 'Factory Floor',
      locationVerified: false
    };

    // Update Users if handler available
    if (onUpdateUsers && users) {
      const updatedTeam = [...(users.team || []), newTeamMember];
      onUpdateUsers({
        ...users,
        team: updatedTeam
      });
    }

    // Update Payroll
    onUpdatePayroll({
      ...payroll,
      staffSummary: [...staffSummary, newSummaryItem],
      dailyAttendance: [newDailyAtt, ...dailyAttendance],
      loans
    });

    setShowAddEmployeeModal(false);
    showLocalToast(`Enrolled "${employeeData.name}" as ${employeeData.role} (${employeeData.wageType})!`);
  };

  // 6. Grant New Loan / Advance Handler
  const handleGrantNewLoan = (loanData) => {
    const staff = staffSummary.find(s => s.staffId === loanData.staffId);
    if (!staff) return;

    const principal = Number(loanData.principalAmount) || 10000;
    const monthlyEmi = Number(loanData.monthlyEmi) || 2000;
    const tenure = Math.ceil(principal / monthlyEmi);
    const newLoanId = `LOAN-${Date.now().toString().slice(-4)}`;

    const newLoan = {
      loanId: newLoanId,
      staffId: staff.staffId,
      staffName: staff.name,
      role: staff.role,
      department: staff.department,
      principalAmount: principal,
      disbursedDate: loanData.disbursedDate || new Date().toISOString().split('T')[0],
      reason: loanData.reason || 'Personal Advance',
      monthlyEmi: monthlyEmi,
      totalTenureMonths: tenure,
      totalRepaid: 0,
      remainingBalance: principal,
      status: 'Active',
      repaymentHistory: []
    };

    onUpdatePayroll({
      ...payroll,
      loans: [newLoan, ...loans]
    });

    setShowGrantLoanModal(false);
    showLocalToast(`Granted ${formatCurrency(principal)} loan to ${staff.name} (EMI: ${formatCurrency(monthlyEmi)}/mo)!`);
  };

  // 7. Manual Loan Repayment Handler
  const handleRecordManualEmi = (loanId, amount, note = 'Cash Repayment') => {
    const now = new Date();
    const updatedLoans = loans.map(l => {
      if (l.loanId === loanId) {
        const repayAmt = Number(amount) || l.monthlyEmi;
        const newRepaid = (Number(l.totalRepaid) || 0) + repayAmt;
        const newBal = Math.max(0, (Number(l.remainingBalance) || 0) - repayAmt);
        const historyEntry = {
          emiNo: (l.repaymentHistory || []).length + 1,
          date: now.toISOString().split('T')[0],
          amount: repayAmt,
          method: 'Manual Payment',
          note: note
        };
        return {
          ...l,
          totalRepaid: newRepaid,
          remainingBalance: newBal,
          status: newBal <= 0 ? 'Closed' : 'Active',
          repaymentHistory: [...(l.repaymentHistory || []), historyEntry]
        };
      }
      return l;
    });

    onUpdatePayroll({
      ...payroll,
      loans: updatedLoans
    });

    setCollectingLoanEmi(null);
    showLocalToast(`Recorded manual repayment of ${formatCurrency(amount)} for ${loanId}!`);
  };

  // 8. Reassign Shift Handler
  const handleAssignShift = (staffId, newShiftId) => {
    const matchedShift = shifts.find(sh => sh.shiftId === newShiftId);
    if (!matchedShift) return;

    const updatedSummary = staffSummary.map(s => {
      if (s.staffId === staffId) {
        return {
          ...s,
          shiftId: newShiftId,
          shiftName: matchedShift.name,
          wageType: s.wageType || (matchedShift.shiftType === 'Daily Basis' ? 'Daily Basis' : 'Monthly Basis'),
          dailyWage: matchedShift.dailyWage || s.dailyWage || 0
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
      dailyAttendance: updatedDaily,
      loans
    });
    showLocalToast(`Shift reassigned to "${matchedShift.name}" (${matchedShift.shiftType})`);
  };

  // 9. Mobile Punch Simulator
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
      dailyAttendance: updatedDaily,
      loans
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

  // Month-wise analytics data generator
  const monthlyReportData = staffSummary.map(staff => {
    const shift = shifts.find(s => s.shiftId === staff.shiftId) || shifts[0];
    const workingDays = staff.workingDays || 26;
    const presentDays = staff.presentDays || (staff.staffId === 'USR-ADM-03' ? 25 : 26);
    const leavesTaken = staff.leavesTaken || (staff.staffId === 'USR-ADM-03' || staff.staffId === 'USR-PNC-01' ? 1 : 0);
    const lateDays = staff.staffId === 'USR-ADM-03' ? 3 : (staff.staffId === 'USR-PNC-01' ? 2 : (staff.staffId === 'USR-ADM-02' ? 2 : 0));
    const onTimeDays = Math.max(0, presentDays - lateDays);
    const overtimeHours = staff.overtimeHours || (staff.staffId === 'USR-PRN-01' ? 16 : (staff.staffId === 'USR-PNC-01' ? 12 : (staff.staffId === 'USR-ADM-02' ? 10 : (staff.staffId === 'USR-ADM-03' ? 8 : 0))));
    const otRate = staff.overtimeRatePerHour || shift.overtimeRatePerHour || 250;
    const otEarnings = overtimeHours * otRate;
    const punctualityScore = presentDays > 0 ? Math.round((onTimeDays / presentDays) * 100) : 100;
    const totalHoursWorked = (presentDays * 8) + overtimeHours;

    return {
      ...staff,
      shift,
      workingDays,
      presentDays,
      onTimeDays,
      lateDays,
      leavesTaken,
      overtimeHours,
      otRate,
      otEarnings,
      punctualityScore,
      totalHoursWorked
    };
  }).filter(item => {
    if (reportEmployeeId !== 'all' && item.staffId !== reportEmployeeId) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce border border-slate-700">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SUB-HEADER / TAB NAVIGATION BAR WITH PROMINENT '+ ADD EMPLOYEE' BUTTON */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            HR
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">Workforce Attendance &amp; Payroll Suite</h2>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                PagarBook Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Shifts (Daily &amp; Monthly basis), staff advances / loans with EMI auto-deductions &amp; punch time editor.</p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAddEmployeeModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <span>+</span>
            <span>Add New Employee</span>
          </button>
          <button
            type="button"
            onClick={() => setShowGrantLoanModal(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <span>💸</span>
            <span>Grant Loan / Advance</span>
          </button>
        </div>
      </div>

      {/* LEVEL-2 SUB-TAB BAR */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('attendance_dashboard')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'attendance_dashboard' || activeTab === 'payroll'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          ◈ Attendance Dashboard
        </button>
        <button
          onClick={() => setActiveTab('daily_attendance')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'daily_attendance'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          ◈ Daily Punch Register <span className="text-[10px] bg-slate-100 text-slate-700 px-1 rounded ml-1">Editable</span>
        </button>
        <button
          onClick={() => setActiveTab('shift_management')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'shift_management'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          ◈ Shift Roster (Daily &amp; Monthly)
        </button>
        <button
          onClick={() => setActiveTab('payroll_register')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'payroll_register'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          ◈ Payroll &amp; Compensation
        </button>
        <button
          onClick={() => setActiveTab('staff_loans')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'staff_loans'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          💸 Staff Loans &amp; EMI {activeLoans.length > 0 && <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full ml-1 font-mono">{activeLoans.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('attendance_reports')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'attendance_reports'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          📊 Monthly Reports (Late &amp; OT)
        </button>
        <button
          onClick={() => setActiveTab('mobile_punch_terminal')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'mobile_punch_terminal'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          📱 Android App &amp; Terminal
        </button>
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

            {/* 4. Active Staff Loans & Advances */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Loans &amp; Advances</span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-2xl font-bold text-indigo-700 font-mono">{activeLoans.length}</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                  {formatCurrency(totalLoanBalance)} Bal
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">EMI Due: {formatCurrency(monthlyEmiDue)}/mo</p>
            </div>

            {/* 5. PAYROLL PENDING TO GIVE */}
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
                  className="text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 rounded shadow-2xs transition-colors cursor-pointer"
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
                <p className="text-xs text-slate-500 mt-0.5">Real-time presence mapped against assigned production shifts (Daily Basis &amp; Monthly Basis)</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('shift_management')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
              >
                <span>Manage Shift Roster</span>
                <span>&rarr;</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {shifts.map(shift => {
                const assigned = calculatedStaffList.filter(s => s.shiftId === shift.shiftId);
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
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        shift.shiftType === 'Daily Basis' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {shift.shiftType || 'Monthly Basis'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-600 font-mono mt-2 bg-white px-2 py-1 rounded-lg border border-slate-200/60">
                      <span>🕒 {shift.startTime} &ndash; {shift.endTime}</span>
                      <span className="text-slate-300">|</span>
                      <span>OT: ₹{shift.overtimeRatePerHour}/h</span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-500">Manned:</span>
                      <span className="font-bold text-slate-900 font-mono">{presentInShift} / {assigned.length} Members ({coveragePercent}%)</span>
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
                    onClick={() => setActiveTab('daily_attendance')}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Edit Punches &rarr;
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
                      <th className="py-2.5 px-3 text-right font-semibold">Quick Mark</th>
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
                            {att.punchMethod || 'Face Scan'}
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
                            className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold cursor-pointer"
                            title="Mark Present"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleToggleAttendanceStatus(att.staffId, 'Late')}
                            className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-semibold cursor-pointer"
                            title="Mark Late"
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleToggleAttendanceStatus(att.staffId, 'Leave')}
                            className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-semibold cursor-pointer"
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
                    <p className="text-[11px] text-amber-800 mt-0.5">Shift salaries &amp; daily wages ready for payment (Loan EMIs auto-deducted)</p>
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
                            <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">{staff.wageType}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {staff.role} &bull; <span className="font-mono">{staff.presentDays}/{staff.workingDays} days</span>
                            {staff.loanEmi > 0 && <span className="text-amber-800 font-semibold ml-1.5 font-mono">(-{formatCurrency(staff.loanEmi)} EMI)</span>}
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
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
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
      {/* 2. DAILY PUNCH REGISTER TAB (WITH INSTANT INLINE CLICK-TO-EDIT TIMES) */}
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
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${typeFilter === 'all' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'}`}
                >
                  All Staff
                </button>
                <button
                  onClick={() => setTypeFilter('office')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${typeFilter === 'office' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'}`}
                >
                  Office
                </button>
                <button
                  onClick={() => setTypeFilter('operator')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${typeFilter === 'operator' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'}`}
                >
                  Operators
                </button>
                <button
                  onClick={() => setTypeFilter('karigar')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${typeFilter === 'karigar' ? 'bg-white shadow-2xs font-bold text-slate-900' : 'text-slate-600'}`}
                >
                  Karigars
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
                  <option key={sh.shiftId} value={sh.shiftId}>{sh.name} ({sh.shiftType || 'Shift'})</option>
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
                <option value="Half-Day">Half-Day</option>
                <option value="Leave">Leave / Absent</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowAddEmployeeModal(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                + Add Employee
              </button>
              <button
                type="button"
                onClick={() => setShowManualPunchModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                + Add Custom Punch
              </button>
            </div>
          </div>

          {/* ATTENDANCE TABLE WITH INSTANT CLICK-TO-EDIT TIMES */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Daily Shift Attendance Register &mdash; {selectedDate}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  💡 <strong>Instant Edit</strong>: Click directly on any <strong>Check-In</strong> or <strong>Check-Out</strong> time to modify it inline. System auto-recalculates hours worked, overtime, and late status.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {filteredDailyAttendance.length} records shown
              </span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Staff Member</th>
                    <th className="py-3 px-4 font-semibold">Shift &amp; Wage Model</th>
                    <th className="py-3 px-4 font-semibold">Check-In (Click to Edit)</th>
                    <th className="py-3 px-4 font-semibold">Check-Out (Click to Edit)</th>
                    <th className="py-3 px-4 font-semibold">Hours Worked</th>
                    <th className="py-3 px-4 font-semibold">Overtime</th>
                    <th className="py-3 px-4 font-semibold">Punch Verification</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDailyAttendance.map(att => {
                    const isEditingIn = editingPunch?.staffId === att.staffId && editingPunch?.field === 'checkIn';
                    const isEditingOut = editingPunch?.staffId === att.staffId && editingPunch?.field === 'checkOut';

                    return (
                      <tr key={att.staffId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{att.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{att.staffId} &bull; {att.role}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900">{att.shiftName}</div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            (att.employeeType || '').includes('Operator') ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {att.employeeType || 'Office Staff'}
                          </span>
                        </td>

                        {/* INSTANT EDIT CHECK-IN */}
                        <td className="py-3.5 px-4">
                          {isEditingIn ? (
                            <div className="flex items-center space-x-1.5 animate-fade-in">
                              <input
                                type="text"
                                defaultValue={att.checkIn === '--:--' ? '09:00 AM' : att.checkIn}
                                id={`editIn_${att.staffId}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleQuickEditPunch(att.staffId, 'checkIn', e.target.value);
                                  } else if (e.key === 'Escape') {
                                    setEditingPunch(null);
                                  }
                                }}
                                className="w-24 bg-white border-2 border-indigo-600 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none shadow-xs"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const val = document.getElementById(`editIn_${att.staffId}`).value;
                                  handleQuickEditPunch(att.staffId, 'checkIn', val);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2 py-1 rounded-lg cursor-pointer"
                                title="Save"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPunch(null)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-1.5 py-1 rounded-lg cursor-pointer"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => setEditingPunch({ staffId: att.staffId, field: 'checkIn', value: att.checkIn })}
                              className="group inline-flex items-center space-x-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all"
                              title="Click to edit Check-In time"
                            >
                              <span className="font-mono font-bold text-slate-800">{att.checkIn || '--:--'}</span>
                              <span className="opacity-0 group-hover:opacity-100 text-indigo-600 text-[10px] font-bold">✎ Edit</span>
                            </div>
                          )}
                        </td>

                        {/* INSTANT EDIT CHECK-OUT */}
                        <td className="py-3.5 px-4">
                          {isEditingOut ? (
                            <div className="flex items-center space-x-1.5 animate-fade-in">
                              <input
                                type="text"
                                defaultValue={att.checkOut === '--:--' ? '06:00 PM' : att.checkOut}
                                id={`editOut_${att.staffId}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleQuickEditPunch(att.staffId, 'checkOut', e.target.value);
                                  } else if (e.key === 'Escape') {
                                    setEditingPunch(null);
                                  }
                                }}
                                className="w-24 bg-white border-2 border-indigo-600 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none shadow-xs"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const val = document.getElementById(`editOut_${att.staffId}`).value;
                                  handleQuickEditPunch(att.staffId, 'checkOut', val);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2 py-1 rounded-lg cursor-pointer"
                                title="Save"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPunch(null)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-1.5 py-1 rounded-lg cursor-pointer"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => setEditingPunch({ staffId: att.staffId, field: 'checkOut', value: att.checkOut })}
                              className="group inline-flex items-center space-x-1.5 cursor-pointer py-1 px-2 rounded-lg hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all"
                              title="Click to edit Check-Out time"
                            >
                              <span className="font-mono font-bold text-slate-800">{att.checkOut || '--:--'}</span>
                              <span className="opacity-0 group-hover:opacity-100 text-indigo-600 text-[10px] font-bold">✎ Edit</span>
                            </div>
                          )}
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
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                            att.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            att.status === 'Late' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            att.status === 'Half-Day' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {att.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleAttendanceStatus(att.staffId, 'Present')}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleToggleAttendanceStatus(att.staffId, 'Late')}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            Late
                          </button>
                          <button
                            onClick={() => handleToggleAttendanceStatus(att.staffId, 'Leave')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                          >
                            Leave
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MANUAL OVERRIDE MODAL */}
          {showManualPunchModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Record Custom Punch</h3>
                  <button onClick={() => setShowManualPunchModal(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Check-In</label>
                      <input
                        type="text"
                        defaultValue="08:30 AM"
                        id="manualPunchIn"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Check-Out</label>
                      <input
                        type="text"
                        defaultValue="05:30 PM"
                        id="manualPunchOut"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowManualPunchModal(false)}
                      className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const selStaffId = document.getElementById('manualStaffSelect').value;
                        const inVal = document.getElementById('manualPunchIn').value;
                        const outVal = document.getElementById('manualPunchOut').value;
                        handleQuickEditPunch(selStaffId, 'checkIn', inVal);
                        handleQuickEditPunch(selStaffId, 'checkOut', outVal);
                        setShowManualPunchModal(false);
                      }}
                      className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl shadow-xs cursor-pointer"
                    >
                      Save Punch
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SHIFT ROSTER & RULES (DAILY BASIS VS MONTHLY BASIS) */}
      {/* ========================================================================= */}
      {activeTab === 'shift_management' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* MASTER SHIFTS LIST */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 text-base">Factory Shift Master &amp; Wage Calculation Rules</h3>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Daily &amp; Monthly Types
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Shifts can operate on either <strong>Daily Basis</strong> (calculated per day present) or <strong>Monthly Basis</strong> (fixed salary pro-rated across working days).</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2 px-3.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  + Add Employee
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewShiftModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-3.5 rounded-xl transition-colors cursor-pointer"
                >
                  + Define New Shift
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {shifts.map(shift => {
                const assigned = calculatedStaffList.filter(s => s.shiftId === shift.shiftId);

                return (
                  <div key={shift.shiftId} className="border border-slate-200 rounded-2xl p-5 bg-gradient-to-br from-white to-slate-50/40 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                            {shift.category}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            shift.shiftType === 'Daily Basis'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {shift.shiftType || 'Monthly Basis'}
                          </span>
                        </div>
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
                        <span className="text-[10px] text-slate-400 block">Wage Model</span>
                        <span className="text-xs font-bold text-indigo-700 font-mono">
                          {shift.shiftType === 'Daily Basis' ? `₹${shift.dailyWage}/day` : 'Pro-rated / Mo'}
                        </span>
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
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Employee &amp; Karigar Shift Assignment Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assign each member of the factory to their designated shift and wage model (Daily vs Monthly)</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEmployeeModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
              >
                + Add Employee
              </button>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Staff Member</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">Classification</th>
                    <th className="py-3 px-4 font-semibold">Assigned Shift</th>
                    <th className="py-3 px-4 font-semibold">Wage Model</th>
                    <th className="py-3 px-4 text-right font-semibold">Reassign Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculatedStaffList.map(staff => (
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
                        <span className="font-semibold text-slate-800">
                          {staff.wageType === 'Daily Basis' 
                            ? `₹${staff.dailyWage}/day (Daily Wage)`
                            : staff.wageType === 'Piece-Rate Basis'
                            ? `₹${staff.ratePerTag || 0.30}/tag (Piece-Rate)`
                            : `${formatCurrency(staff.monthlySalary)} / mo (Monthly)`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={staff.shiftId}
                          onChange={(e) => handleAssignShift(staff.staffId, e.target.value)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1 text-slate-800 cursor-pointer"
                        >
                          {shifts.map(sh => (
                            <option key={sh.shiftId} value={sh.shiftId}>{sh.name} ({sh.shiftType || 'Shift'})</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* NEW SHIFT MODAL (WITH DAILY VS MONTHLY BASIS SELECTOR) */}
          {showNewShiftModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Define New Factory Shift</h3>
                  <button onClick={() => setShowNewShiftModal(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
                </div>
                <div className="space-y-4 mt-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Shift Name</label>
                    <input type="text" id="newShiftName" placeholder="e.g. Night Offset Press Shift" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Calculation Basis (PagarBook Rule)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                        <input type="radio" name="newShiftType" value="Daily Basis" defaultChecked />
                        <span className="font-medium text-slate-900">☀️ Daily Basis (Per-Day Wage)</span>
                      </label>
                      <label className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                        <input type="radio" name="newShiftType" value="Monthly Basis" />
                        <span className="font-medium text-slate-900">📅 Monthly Basis (Salaried)</span>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Start Time</label>
                      <input type="text" id="newShiftStart" defaultValue="08:00 AM" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">End Time</label>
                      <input type="text" id="newShiftEnd" defaultValue="05:00 PM" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Daily Wage Rate (₹/day, if daily basis)</label>
                      <input type="number" id="newShiftDailyWage" defaultValue="1000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Overtime Rate (₹/hr)</label>
                      <input type="number" id="newShiftOT" defaultValue="250" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button onClick={() => setShowNewShiftModal(false)} className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Cancel</button>
                    <button
                      type="button"
                      onClick={() => {
                        const name = document.getElementById('newShiftName').value || 'Custom Shift';
                        const shiftTypeRadio = document.querySelector('input[name="newShiftType"]:checked')?.value || 'Daily Basis';
                        const newSh = {
                          shiftId: `SHIFT-${Date.now().toString().slice(-4)}`,
                          name: name,
                          shiftType: shiftTypeRadio,
                          category: 'Custom Production Line',
                          startTime: document.getElementById('newShiftStart').value || '08:00 AM',
                          endTime: document.getElementById('newShiftEnd').value || '05:00 PM',
                          standardHours: 8,
                          breakMinutes: 60,
                          gracePeriodMinutes: 15,
                          halfDayMinHours: 4.5,
                          dailyWage: Number(document.getElementById('newShiftDailyWage').value) || 1000,
                          overtimeRatePerHour: Number(document.getElementById('newShiftOT').value) || 250,
                          description: `${shiftTypeRadio} production shift`
                        };
                        onUpdatePayroll({
                          ...payroll,
                          shifts: [...shifts, newSh],
                          loans
                        });
                        setShowNewShiftModal(false);
                        showLocalToast(`Created shift "${name}" (${shiftTypeRadio})`);
                      }}
                      className="px-4 py-2 font-bold bg-slate-900 text-white rounded-xl shadow-xs cursor-pointer"
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
      {/* 4. PAYROLL & COMPENSATION REGISTER (WITH LOAN EMI DEDUCTION) */}
      {/* ========================================================================= */}
      {activeTab === 'payroll_register' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* HEADER SUMMARY CARD */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Monthly Staff &amp; Karigar Payroll Computation</h3>
                <p className="text-xs text-slate-500 mt-0.5">Calculated based on Daily Wage / Monthly Salary basis + Overtime Pay - Active Loan EMIs</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block uppercase font-medium">Pending To Give:</span>
                  <span className="font-bold text-amber-700 font-mono text-base">{formatCurrency(pendingPayrollAmount)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleBulkDisburseAll}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-colors cursor-pointer"
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
                    <th className="py-3 px-4 font-semibold">Calculation Basis</th>
                    <th className="py-3 px-4 font-semibold">Days (Present/Work)</th>
                    <th className="py-3 px-4 font-semibold">Base Earnings</th>
                    <th className="py-3 px-4 font-semibold">Overtime Pay</th>
                    <th className="py-3 px-4 font-semibold">Piece-Rate Bonus</th>
                    <th className="py-3 px-4 font-semibold text-rose-700">Loan EMI Deduction</th>
                    <th className="py-3 px-4 font-semibold">Net Payable</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {calculatedStaffList.map(staff => (
                    <tr key={staff.staffId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{staff.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{staff.role} &bull; {staff.shiftName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          staff.wageType === 'Daily Basis' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {staff.wageType}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          {staff.wageType === 'Daily Basis' ? `₹${staff.dailyWage}/day` : formatCurrency(staff.monthlySalary)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-mono font-medium">
                        {staff.presentDays} / {staff.workingDays}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {formatCurrency(staff.baseEarnings)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">
                        {staff.overtimePay > 0 ? `+${formatCurrency(staff.overtimePay)}` : '₹0'}
                        {staff.overtimeHours > 0 && <span className="block text-[9px] text-slate-400 font-mono">({staff.overtimeHours}h OT)</span>}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700">
                        {staff.bonus > 0 ? `+${formatCurrency(staff.bonus)}` : '₹0'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-rose-700 font-bold">
                        {staff.loanEmi > 0 ? (
                          <div>
                            <span>-{formatCurrency(staff.loanEmi)}</span>
                            <span className="block text-[9px] text-slate-400 font-mono">Bal: {formatCurrency(staff.loanBalance)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">&mdash;</span>
                        )}
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1 rounded-lg shadow-2xs transition-all cursor-pointer"
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
      {/* 5. STAFF LOANS & ADVANCES EMI LEDGER (PAGARBOOK MODEL) */}
      {/* ========================================================================= */}
      {activeTab === 'staff_loans' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* LOAN METRICS STRIP */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Disbursed</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{formatCurrency(totalLoanPrincipal)}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">{loans.length} staff loans recorded</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs bg-amber-50/20">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">Balance Outstanding</span>
              <span className="text-2xl font-black text-amber-900 font-mono mt-1 block">{formatCurrency(totalLoanBalance)}</span>
              <span className="text-[10px] text-amber-700 mt-1 block">To be recovered from salaries</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">Recovered to Date</span>
              <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">{formatCurrency(totalLoanRepaid)}</span>
              <span className="text-[10px] text-emerald-600 mt-1 block">Via salary EMIs &amp; cash</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">This Month&apos;s EMI</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{formatCurrency(monthlyEmiDue)}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGrantLoanModal(true)}
                className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                + Grant New Loan / Advance
              </button>
            </div>
          </div>

          {/* ACTIVE LOANS REGISTER TABLE */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Employee Loans &amp; Advance Salary Ledger</h3>
                <p className="text-xs text-slate-500 mt-0.5">Monthly EMIs are automatically deducted from the employee&apos;s payroll slip during salary disbursement.</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">{loans.length} Loans active</span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Loan ID &amp; Date</th>
                    <th className="py-3 px-4 font-semibold">Employee</th>
                    <th className="py-3 px-4 font-semibold">Reason</th>
                    <th className="py-3 px-4 font-semibold">Principal</th>
                    <th className="py-3 px-4 font-semibold">Monthly EMI</th>
                    <th className="py-3 px-4 font-semibold">Repaid</th>
                    <th className="py-3 px-4 font-semibold">Remaining Balance</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.map(loan => {
                    const percentRepaid = loan.principalAmount > 0 ? Math.round((loan.totalRepaid / loan.principalAmount) * 100) : 100;

                    return (
                      <tr key={loan.loanId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{loan.loanId}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{loan.disbursedDate}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{loan.staffName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{loan.role} &bull; {loan.staffId}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {loan.reason}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                          {formatCurrency(loan.principalAmount)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                          {formatCurrency(loan.monthlyEmi)}/mo
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-700">
                          {formatCurrency(loan.totalRepaid)}
                          <span className="block text-[9px] text-slate-400 font-mono">({percentRepaid}%)</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {formatCurrency(loan.remainingBalance)}
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentRepaid}%` }}></div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            loan.status === 'Active' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {loan.status === 'Active' && (
                            <button
                              type="button"
                              onClick={() => setCollectingLoanEmi(loan)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              💸 Record Repayment
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setViewingLoanLedger(loan)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-medium cursor-pointer"
                          >
                            📜 History
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* GRANT NEW LOAN MODAL */}
          {showGrantLoanModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Grant Loan or Salary Advance</h3>
                  <button onClick={() => setShowGrantLoanModal(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
                </div>
                <div className="space-y-4 mt-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Select Employee</label>
                    <select id="newLoanStaffId" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800">
                      {staffSummary.map(s => (
                        <option key={s.staffId} value={s.staffId}>{s.name} ({s.role} &bull; {s.department})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Loan / Advance Amount (₹)</label>
                      <input type="number" id="newLoanPrincipal" defaultValue="15000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold" />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Monthly EMI Recovery (₹/mo)</label>
                      <input type="number" id="newLoanEmi" defaultValue="2000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold" />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Reason / Purpose</label>
                    <input type="text" id="newLoanReason" defaultValue="Festival / Medical Advance" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Disbursal Date</label>
                    <input type="date" id="newLoanDate" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button onClick={() => setShowGrantLoanModal(false)} className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Cancel</button>
                    <button
                      type="button"
                      onClick={() => {
                        const sId = document.getElementById('newLoanStaffId').value;
                        const princ = document.getElementById('newLoanPrincipal').value;
                        const emi = document.getElementById('newLoanEmi').value;
                        const reas = document.getElementById('newLoanReason').value;
                        const dt = document.getElementById('newLoanDate').value;
                        handleGrantNewLoan({
                          staffId: sId,
                          principalAmount: princ,
                          monthlyEmi: emi,
                          reason: reas,
                          disbursedDate: dt
                        });
                      }}
                      className="px-4 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs cursor-pointer"
                    >
                      Grant Loan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* COLLECT MANUAL EMI MODAL */}
          {collectingLoanEmi && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">Record Repayment</h3>
                  <button onClick={() => setCollectingLoanEmi(null)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
                </div>
                <div className="space-y-4 mt-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Employee:</span>
                    <strong className="text-slate-900 text-sm">{collectingLoanEmi.staffName}</strong>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">Remaining Balance: {formatCurrency(collectingLoanEmi.remainingBalance)}</div>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Repayment Amount (₹)</label>
                    <input
                      type="number"
                      id="manualRepayAmt"
                      defaultValue={Math.min(collectingLoanEmi.monthlyEmi, collectingLoanEmi.remainingBalance)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Payment Method / Note</label>
                    <input type="text" id="manualRepayNote" defaultValue="Direct Cash / UPI Repayment" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2" />
                  </div>
                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button onClick={() => setCollectingLoanEmi(null)} className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Cancel</button>
                    <button
                      type="button"
                      onClick={() => {
                        const amt = document.getElementById('manualRepayAmt').value;
                        const note = document.getElementById('manualRepayNote').value;
                        handleRecordManualEmi(collectingLoanEmi.loanId, amt, note);
                      }}
                      className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-xl shadow-xs cursor-pointer"
                    >
                      Confirm Repayment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW LOAN HISTORY LEDGER MODAL */}
          {viewingLoanLedger && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Loan Repayment Ledger</h3>
                    <span className="text-[11px] text-slate-500">{viewingLoanLedger.loanId} &bull; {viewingLoanLedger.staffName}</span>
                  </div>
                  <button onClick={() => setViewingLoanLedger(null)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Principal</span>
                      <strong className="text-slate-900">{formatCurrency(viewingLoanLedger.principalAmount)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Repaid</span>
                      <strong className="text-emerald-700">{formatCurrency(viewingLoanLedger.totalRepaid)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">Balance</span>
                      <strong className="text-amber-800">{formatCurrency(viewingLoanLedger.remainingBalance)}</strong>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-slate-50">
                        <tr>
                          <th className="py-2 px-3">#</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(viewingLoanLedger.repaymentHistory || []).map((rep, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-mono text-slate-400">{rep.emiNo || idx + 1}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{rep.date}</td>
                            <td className="py-2 px-3 text-slate-800">{rep.method || 'Salary Auto-Deduction'}</td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-700 text-right">+{formatCurrency(rep.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setViewingLoanLedger(null)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer">Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MONTH-WISE ATTENDANCE, LATE & OVERTIME REPORTS */}
      {/* ========================================================================= */}
      {activeTab === 'attendance_reports' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* FILTER CONTROLS */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-500">Report Month:</label>
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none"
                >
                  <option value="2026-11">November 2026 (Active Cycle)</option>
                  <option value="2026-10">October 2026 (Completed)</option>
                  <option value="2026-09">September 2026 (Completed)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-xs font-semibold text-slate-500">Employee:</label>
                <select
                  value={reportEmployeeId}
                  onChange={(e) => setReportEmployeeId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none"
                >
                  <option value="all">All Employees &amp; Karigars</option>
                  {staffSummary.map(s => (
                    <option key={s.staffId} value={s.staffId}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                🖨️ Print Monthly Report
              </button>
            </div>
          </div>

          {/* MONTHLY SUMMARY METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Working Days</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">26 Days</span>
              <span className="text-[10px] text-slate-400 mt-1 block">{reportMonth}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">On-Time Days</span>
              <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
                {monthlyReportData.reduce((s, r) => s + r.onTimeDays, 0)} Days
              </span>
              <span className="text-[10px] text-emerald-600 mt-1 block">Punctual arrival</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Late Arrival Marks</span>
              <span className="text-2xl font-black text-amber-800 font-mono mt-1 block">
                {monthlyReportData.reduce((s, r) => s + r.lateDays, 0)} Marks
              </span>
              <span className="text-[10px] text-amber-700 mt-1 block">&gt; 15m grace</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs bg-indigo-50/20">
              <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">Total Overtime Hours</span>
              <span className="text-2xl font-black text-indigo-700 font-mono mt-1 block">
                {monthlyReportData.reduce((s, r) => s + r.overtimeHours, 0)} hrs
              </span>
              <span className="text-[10px] text-indigo-600 mt-1 block">Across machines</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total OT Pay Earned</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                {formatCurrency(monthlyReportData.reduce((s, r) => s + r.otEarnings, 0))}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Machine rate basis</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Leaves Taken</span>
              <span className="text-2xl font-black text-rose-700 font-mono mt-1 block">
                {monthlyReportData.reduce((s, r) => s + r.leavesTaken, 0)} Days
              </span>
              <span className="text-[10px] text-rose-600 mt-1 block">Approved leaves</span>
            </div>
          </div>

          {/* MONTHLY BREAKDOWN TABLE */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Employee-Wise Monthly Attendance &amp; Overtime Log</h3>
                <p className="text-xs text-slate-500 mt-0.5">Summary of attendance punctuality, shift hours worked, late marks and overtime earnings.</p>
              </div>
              <span className="text-xs text-slate-500 font-mono">{monthlyReportData.length} Staff members</span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 rounded-xl">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Staff Member</th>
                    <th className="py-3 px-4 font-semibold">Shift Name</th>
                    <th className="py-3 px-4 font-semibold">Working Days</th>
                    <th className="py-3 px-4 font-semibold text-emerald-800">Present</th>
                    <th className="py-3 px-4 font-semibold text-emerald-700">On-Time</th>
                    <th className="py-3 px-4 font-semibold text-amber-800">Late Marks</th>
                    <th className="py-3 px-4 font-semibold text-rose-700">Leaves</th>
                    <th className="py-3 px-4 font-semibold text-indigo-700">OT Hours</th>
                    <th className="py-3 px-4 font-semibold">Total OT Pay</th>
                    <th className="py-3 px-4 font-semibold">Punctuality</th>
                    <th className="py-3 px-4 text-right font-semibold">Calendar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyReportData.map(rep => (
                    <tr key={rep.staffId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{rep.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{rep.role} &bull; {rep.staffId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {rep.shiftName}
                        <span className="block text-[9px] text-slate-400 font-mono">{rep.shift?.shiftType || 'Shift'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">{rep.workingDays}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{rep.presentDays}</td>
                      <td className="py-3.5 px-4 font-mono text-emerald-800 font-semibold">{rep.onTimeDays}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                        {rep.lateDays > 0 ? (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{rep.lateDays} Late</span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-rose-700">
                        {rep.leavesTaken > 0 ? `${rep.leavesTaken} day` : '0'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {rep.overtimeHours > 0 ? `${rep.overtimeHours} hrs` : '--'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {rep.otEarnings > 0 ? formatCurrency(rep.otEarnings) : '₹0'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          rep.punctualityScore >= 95 ? 'bg-emerald-100 text-emerald-800' : rep.punctualityScore >= 85 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rep.punctualityScore}% On-Time
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingStaffCalendar(rep)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          📅 View 31-Day Sheet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGARBOOK-STYLE 31-DAY ROSTER SHEET MODAL */}
          {viewingStaffCalendar && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{viewingStaffCalendar.name} &mdash; 31-Day Attendance Sheet</h3>
                    <p className="text-xs text-slate-500 font-mono">{reportMonth} &bull; {viewingStaffCalendar.role} &bull; {viewingStaffCalendar.shiftName}</p>
                  </div>
                  <button onClick={() => setViewingStaffCalendar(null)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
                </div>

                <div className="mt-4 space-y-4">
                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">P: Present &amp; On-Time</span>
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">L: Late Arrival</span>
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">OT: Overtime Day</span>
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded">A: Leave / Absent</span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">WO: Weekly Off (Sun)</span>
                  </div>

                  {/* 31-Day Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 30 }, (_, i) => {
                      const dayNum = i + 1;
                      const isSunday = dayNum % 7 === 1; // Simulated Sunday
                      const isLate = (dayNum === 3 && viewingStaffCalendar.lateDays > 0) || (dayNum === 14 && viewingStaffCalendar.lateDays > 1);
                      const isOT = (dayNum === 5 || dayNum === 12 || dayNum === 19) && viewingStaffCalendar.overtimeHours > 0;
                      const isAbsent = dayNum === 24 && viewingStaffCalendar.leavesTaken > 0;

                      return (
                        <div
                          key={dayNum}
                          className={`p-2 rounded-xl border text-center text-xs ${
                            isSunday ? 'bg-slate-50 border-slate-200/60 text-slate-400' :
                            isAbsent ? 'bg-rose-50 border-rose-200 text-rose-800' :
                            isLate ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' :
                            isOT ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold' :
                            'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold'
                          }`}
                        >
                          <span className="text-[10px] block opacity-60">Nov {dayNum}</span>
                          <span className="text-sm font-bold block mt-0.5">
                            {isSunday ? 'WO' : isAbsent ? 'A' : isLate ? 'L' : isOT ? 'OT' : 'P'}
                          </span>
                          <span className="text-[9px] block font-mono opacity-80">
                            {isSunday ? 'Off' : isAbsent ? 'Leave' : isLate ? '09:25' : isOT ? '+1.5h' : '08:45'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-600">Total Hours: {viewingStaffCalendar.totalHoursWorked} hrs | OT Pay: {formatCurrency(viewingStaffCalendar.otEarnings)}</span>
                    <button onClick={() => setViewingStaffCalendar(null)} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold cursor-pointer">Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. ANDROID APP & TERMINAL SIMULATOR */}
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
                        v1.3 Live
                      </span>
                    </div>

                    {/* Mode Switcher Tabs Inside Android App */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl mt-3 text-[11px] font-medium text-center">
                      <button
                        onClick={() => { setTerminalTab('facescan'); setScanState('idle'); }}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${terminalTab === 'facescan' ? 'bg-slate-800 text-emerald-400 font-bold shadow-xs' : 'text-slate-400'}`}
                      >
                        📷 Face Scan
                      </button>
                      <button
                        onClick={() => { setTerminalTab('geofence'); setScanState('idle'); }}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${terminalTab === 'geofence' ? 'bg-slate-800 text-emerald-400 font-bold shadow-xs' : 'text-slate-400'}`}
                      >
                        📍 Geofence
                      </button>
                      <button
                        onClick={() => { setTerminalTab('jobmove'); setScanState('idle'); }}
                        className={`py-1.5 rounded-lg transition-all cursor-pointer ${terminalTab === 'jobmove' ? 'bg-slate-800 text-emerald-400 font-bold shadow-xs' : 'text-slate-400'}`}
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
                      <div className="w-52 h-52 rounded-3xl border-2 border-dashed border-emerald-500/80 bg-slate-900/60 relative flex flex-col items-center justify-center overflow-hidden shadow-inner">
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2"></div>
                        <svg className="w-24 h-24 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                          <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
                          <path d="M19 14v1a7 7 0 0 1-14 0v-1" />
                          <line x1="12" y1="19" x2="12" y2="22" />
                        </svg>
                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
                        <div className="absolute bottom-2 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded-full">
                          99.4% Match Verified
                        </div>
                      </div>

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
                        className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>📷</span>
                        <span>{scanState === 'punched' ? '✓ Punch Recorded Live!' : 'Confirm & Auto-Punch In/Out'}</span>
                      </button>
                    </div>
                  )}

                  {/* ACTIVE TAB 2: GEOFENCE / LOCATION TERMINAL */}
                  {terminalTab === 'geofence' && (
                    <div className="my-auto py-2 flex flex-col items-center text-center">
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
                        className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
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
                            pieceRateLedger: [newLedgerItem, ...pieceRateLedger],
                            loans
                          });

                          showLocalToast(`Job JO_01_P1 moved! Credited ${formatCurrency(earned)} to ${activeUser.name}'s payroll!`);
                        }}
                        className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
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

      {/* ========================================================================= */}
      {/* 8. GLOBAL 'ENROLL NEW STAFF MEMBER' MODAL */}
      {/* ========================================================================= */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Enroll New Staff Member / Karigar</h3>
                <p className="text-xs text-slate-500">Adds employee to company directory, shift roster &amp; attendance payroll system</p>
              </div>
              <button onClick={() => setShowAddEmployeeModal(false)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                  <input type="text" id="newEmpName" placeholder="e.g. Ramesh Patel" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Role / Designation *</label>
                  <input type="text" id="newEmpRole" placeholder="e.g. Cutting Master" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Employee Classification *</label>
                  <select id="newEmpType" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800">
                    <option value="Machine Operator">Machine Operator</option>
                    <option value="Office Staff">Office Staff (Salaried)</option>
                    <option value="Karigar (Production)">Karigar (Handwork / Piece-Rate)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Department *</label>
                  <select id="newEmpDept" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800">
                    <option value="Paper Cutting Unit">Paper Cutting Unit</option>
                    <option value="Printing Unit">Printing Unit</option>
                    <option value="Punching &amp; Packing Unit">Punching &amp; Packing Unit</option>
                    <option value="Handwork &amp; Assembly Unit">Handwork &amp; Assembly Unit</option>
                    <option value="Operations &amp; Management">Operations &amp; Management</option>
                  </select>
                </div>
              </div>

              {/* Wage Calculation Model (PagarBook Rule: Daily vs Monthly vs Piece-Rate) */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 block text-xs">Salary Calculation Type (PagarBook Rules)</span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center space-x-1.5 bg-white p-2 rounded-xl border border-slate-200 cursor-pointer text-[11px]">
                    <input type="radio" name="empWageType" value="Daily Basis" defaultChecked />
                    <span className="font-semibold text-slate-800">☀️ Daily Basis</span>
                  </label>
                  <label className="flex items-center space-x-1.5 bg-white p-2 rounded-xl border border-slate-200 cursor-pointer text-[11px]">
                    <input type="radio" name="empWageType" value="Monthly Basis" />
                    <span className="font-semibold text-slate-800">📅 Monthly Basis</span>
                  </label>
                  <label className="flex items-center space-x-1.5 bg-white p-2 rounded-xl border border-slate-200 cursor-pointer text-[11px]">
                    <input type="radio" name="empWageType" value="Piece-Rate Basis" />
                    <span className="font-semibold text-slate-800">🏷️ Piece-Rate</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Base Wage / Salary (₹) *</label>
                    <input type="number" id="newEmpBaseRate" defaultValue="1000" placeholder="Daily rate or Monthly salary" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold" />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Daily rate (₹/day) or Monthly salary (₹/mo)</span>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Assigned Shift *</label>
                    <select id="newEmpShiftId" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium">
                      {shifts.map(sh => (
                        <option key={sh.shiftId} value={sh.shiftId}>{sh.name} ({sh.shiftType || 'Shift'})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Overtime Rate (₹/hr)</label>
                  <input type="number" id="newEmpOTRate" defaultValue="250" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Monthly Working Days</label>
                  <input type="number" id="newEmpWorkDays" defaultValue="26" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono" />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button onClick={() => setShowAddEmployeeModal(false)} className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    const name = document.getElementById('newEmpName').value.trim();
                    const role = document.getElementById('newEmpRole').value.trim();
                    if (!name || !role) {
                      alert('Please enter employee name and role.');
                      return;
                    }
                    const empType = document.getElementById('newEmpType').value;
                    const dept = document.getElementById('newEmpDept').value;
                    const wageType = document.querySelector('input[name="empWageType"]:checked')?.value || 'Daily Basis';
                    const baseRate = Number(document.getElementById('newEmpBaseRate').value) || 0;
                    const shiftId = document.getElementById('newEmpShiftId').value;
                    const otRate = Number(document.getElementById('newEmpOTRate').value) || 250;
                    const workDays = Number(document.getElementById('newEmpWorkDays').value) || 26;

                    handleAddEmployeeSubmit({
                      name,
                      role,
                      employeeType: empType,
                      department: dept,
                      wageType,
                      monthlySalary: wageType === 'Monthly Basis' ? baseRate : 0,
                      dailyWage: wageType === 'Daily Basis' ? baseRate : 0,
                      ratePerTag: wageType === 'Piece-Rate Basis' ? 0.30 : 0,
                      shiftId,
                      overtimeRatePerHour: otRate,
                      workingDays: workDays
                    });
                  }}
                  className="px-4 py-2 font-bold bg-slate-900 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Enroll Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

window.uBMS.AttendancePayrollSection = AttendancePayrollSection;
