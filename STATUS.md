# Project Status — uBMS

**Current Status**: 🟢 Active Development / Production-Ready Beta  
**Branch**: `beta`  
**Repository**: [https://github.com/M-coderr/Ubms.git](https://github.com/M-coderr/Ubms.git)  
**Version**: 3.4  
**Last Updated**: November 3, 2026  
**Local Server**: `http://localhost:8080/` (PowerShell HTTP Daemon)

---

## Standing Maintenance Policy

> [!IMPORTANT]
> **Commit & Push Requirement**: Every push to the Git repository **must** include an update to both `README.md` and `STATUS.md`, and synchronize with `LOG.md`. Any new features, component adjustments, bug fixes, or schema alterations must be documented here in the changelog and reflected in the feature matrix.

---

## Feature Completion Matrix

| Module | Sub-feature | Status | Description |
|---|---|---|---|
| **Design & UI System** | Minimalist Light Theme | ✅ Complete | Warm Ivory Paper Linen (`#F9F8F5`), crisp white cards, slate-900 typography |
| | Bespoke uBMS Visual Language | ✅ Complete | Unique manufacturing-oriented terminology, zero SaaS clone copycat elements |
| | Responsive Layout | ✅ Complete | Fluid 2-column studio grid and mobile-friendly viewports |
| | Two-Tier Navigation System | ✅ Complete | Level 1 Module Groups on Left Sidebar + Level 2 Dynamic Sub-Tabs on Top Bar |
| **Persona & Auth** | Real Internal Personas | ✅ Complete | Meet (Super Admin), Parth (Admin), Niraj (Admin), Kanu (Printing), Shivakant (Punching), Sumit (Dori Plastic) |
| | Real Customer Accounts | ✅ Complete | MG Creation (`MGC`), Aariya Creation (`ARC`), TagX (`TGX`), D Tag (`DTAG`) |
| | Switcher Header | ✅ Complete | One-click role/customer profile switching without re-login |
| **Customer Portal** | Production Order Studio | ✅ Complete | Bespoke garment accessory order workshop: Specification Sheet + Visual Proof Canvas & Job Ticket |
| | Visual Artwork Framing & Proof | ✅ Complete | Hangtag blueprint silhouette, 3mm hole-punch guide, prepress alignment canvas |
| | In-Browser Artwork Cropper | ✅ Complete | Interactive 8-handle image framing with aspect ratio presets (`2:3`, `1:1`, `1:2`, `3:4`), zoom, rotation |
| | Artwork Lightbox | ✅ Complete | High-resolution popover preview for all uploaded artworks |
| | Order Register & Filter | ✅ Complete | Per-column search row, status pills filter, real-time counters, priority badges |
| | Invoicing & PDF Print | ✅ Complete | View invoices and trigger print/PDF export |
| | Outstanding Aging Ledger | ✅ Complete | 0-30, 31-60, and 60+ days aging overdue tracking |
| | General Ledger Journal | ✅ Complete | Full debit/credit/balance statement of accounts |
| | Account Manager Chat | ✅ Complete | Real-time direct chat interface with assigned account manager |
| **Admin Portal** | Executive Dashboard | ✅ Complete | Revenue, active jobs, pipeline summary, overdue alerts |
| | All Orders & Kanban | ✅ Complete | Per-column search row matching customer side, view mode toggle (Table/Kanban) |
| | Multi-User Concurrency Engine | ✅ Complete | Thread-monitor mutex locked `/api/create-order` endpoint guaranteeing unique dual IDs |
| | Party & Brand Search Studio | ✅ Complete | Quick-clickable party chips and floating autocomplete dropdown matching brand UX |
| | Production Flow Pipeline | ✅ Complete | Dynamic 5-step cycle, multi-card split job tickets, 9 mandatory fields, exact sheet issuance |
| | Artwork Preview & Crop | ✅ Complete | Visual image preview thumbnail on each job card with integrated hover crop editor and upload action |
| | Compact Job Card Identification | ✅ Complete | Formatted as `JO_01_P1`, `JO_01_P2` with Customer Order ID (`Order: MGC01`) right below |
| | Dynamic Operator Assignment | ✅ Complete | Configurable operator dropdowns in Cutting (`Ramesh`), Printing (`Kanu`), and Punching (`Shivakant`) |
| | Automated Wastage Tracking | ✅ Complete | Operators enter good sheets/tags; system auto-calculates live wastage without manual waste typing |
| | Handwork Tag Piece-Rate Count | ✅ Complete | Handwork output recorded strictly in finished completed tags (pcs/tags, not sheets) |
| | Wastage Rule Engine | ✅ Complete | 200 extra tags per 5,000 tags (5k→5.2k, 10k→10.4k) with exact sheets issued without post-buffers |
| | Paper Catalog Management | ✅ Complete | Master paper sizes, GSM, finishes, vendor rates, Paper# numbering, 30 preserved actual papers |
| | Inventory & Raw Materials | ✅ Complete | Real-time stock counts for boards, dori spools, plastic locks, and ink |
| **Billing & Finance Suite** | Create Invoice Studio | ✅ Complete | Dual-mode billing (Bill from Order vs Direct Custom Invoice) with dynamic line items, GST rate selector, and instant Print preview |
| | Commercial Invoice List | ✅ Complete | Invoice-level registry with KPI financial metrics, global search, status tabs (Paid/Unpaid/Partial/Overdue), and 1-click Pay In |
| | Commercial Invoice Register | ✅ Complete | Item-level sales registry with per-column real-time search row, artwork lightbox, item specifications, trims, and GST tax computation |
| | Payment In (Receipts Hub) | ✅ Complete | Client collections recording, invoice knock-off selector with 1-click full due fill, and collections ledger |
| | General Ledger Journal | ✅ Complete | Party-wise double-entry statement of account with debits, credits, running balance, and quick party selection chips |
| | Outstanding & Aging Ledger | ✅ Complete | Receivables aging analysis (0-30d, 31-60d, 60+d overdue) with party-wise breakdown cards and direct collection shortcuts |
| **Attendance & Payroll** | Dedicated Left Nav Module | ✅ Complete | Completely decoupled from Production Flow with bespoke Biometric Left Nav icon |
| | Executive Attendance Dashboard | ✅ Complete | Live presence rates, late/leave metrics, floor shift coverage, and prominent Pending Payroll queue |
| | Shift Roster & Rules Engine | ✅ Complete | 4 production shifts (General, Press, Punching, Artisan Flex) with grace times and overtime rates |
| | Shift Assignment Matrix | ✅ Complete | Shift allocation for office staff, machine operators, and piece-rate karigars |
| | Shift-Based Payroll Computation | ✅ Complete | Working days pro-ration, overtime pay, piece-rate earnings, and instant 'Disburse Salary' actions |
| | Unified Android App Simulator | ✅ Complete | Interactive mobile terminal preview with Face Scan auto-id, GPS/WiFi geofencing, and Karigar Job Moving |

---

## Recent Milestones & Changelog

*(For the complete date-wise changelog since project inception, see [LOG.md](LOG.md))*

### Version 3.4 — November 3, 2026
- **Comprehensive Billing & Finance Suite Overhaul**:
  - Re-architected the Billing module into 6 dedicated, production-ready modules matching the depth of the Order Creation and Order Register studios:
    1. **Create Invoice Studio (`create_invoice`)**:
       - Dual billing workflows: Mode A (Bill from Manufacturing Order) with pre-filled line items, customer details, and terms vs. Mode B (Direct Custom Invoice) with dynamic line items editor (`+ Add Item`).
       - Auto-generated sequential Invoice IDs (`INV-2026-001`, `INV-2026-002`, etc.) with collision-free numbering.
       - Configurable GST Tax Rates (0%, 5%, 12%, 18%, 28%), shipping charges, due date pickers, and payment terms notes.
       - Live calculation sidebar with real-time Subtotal, CGST, SGST, Shipping, Grand Total, and instant Print Preview.
    2. **Commercial Invoice List (`invoice_list`)**:
       - Invoice-level master overview featuring 5 top KPI summary cards (Total Invoiced, Total Collected, Net Balance Due, Settlement Status breakdown, and Overdue count).
       - Status filter tabs (`All`, `Paid`, `Unpaid`, `Partial`, `Overdue`), global search by Invoice No, Customer Party, or Order Reference.
       - Quick-action shortcuts: instant "Print / PDF" and 1-click "Pay In" navigating to payment posting with pre-filled balance.
    3. **Commercial Invoice Register (`invoice_register`)**:
       - Full item-level sales register with per-column real-time search inputs row (`Invoice & Order ID`, `Artwork`, `Customer Party`, `Brand & Specs`, `Dori & Plastic`, `Qty`, `Rate & Total`, `Status`).
       - High-resolution artwork preview thumbnail with hover zoom lightbox modal.
       - Contextual empty states for no invoices in system vs. no search filter matches.
    4. **Payment In Hub (`payment_in`)**:
       - Dedicated client collections console with customer party selector, invoice knock-off dropdown with "Fill Full Due" shortcut, payment mode selection (NEFT/RTGS, UPI, Cheque, Cash, NetBanking), and reference UTR logging.
       - Master collections ledger tracking all incoming payments with live search.
    5. **Customer General Ledger (`general_ledger`)**:
       - Party-wise double-entry statement of account with debits, credits, running balance, and quick clickable party selection chips.
    6. **Outstanding & Aging Ledger (`outstanding_ledger`)**:
       - Real-time receivables aging analysis across 0-30 days (Current), 31-60 days (Attention), and 60+ days (Critical) buckets.
       - Party-wise receivables breakdown cards and unpaid/overdue bills breakdown with days overdue badges and direct "Record Payment" shortcuts.
  - Added parallel support in Customer Portal for `Invoice List` and `Invoice Register` alongside existing `Outstanding Ledger` and `General Ledger`.
  - Maintained full backwards compatibility with legacy tab aliases (`all_invoices`, `payments`, `ledgers`).

### Version 3.3 — November 3, 2026
- **Decoupled Attendance & Payroll from Production**:
  - Removed attendance from under `Operations` (Production Flow) in `ADMIN_NAV_GROUPS`.
  - Added dedicated Level-1 Module Group `attendance_payroll` ("Attendance & Payroll") on the Left Sidebar Strip (`LeftSidebarStrip.js`) with custom user-check biometric icon.
  - Created modular component `AttendancePayrollSection.js` with 5 dedicated sub-views.
- **Attendance & Workforce Payroll Dashboard (`attendance_dashboard`)**:
  - Top 6 KPI summary cards: Total Staff, Present Today (with % attendance), Absent/Leave, Active Shifts Running, **Payroll Pending to Give (Disburse)**, and Paid/Disbursed Total.
  - Prominent **Pending Payroll Queue** with individual "Disburse" buttons and bulk "Disburse All Pending" action.
  - Shift coverage progress bars across all 4 factory machine lines.
  - Real-time shop-floor punch feed with one-click quick mark actions (Present, Late, Leave).
- **Shift Roster & Rules Engine (`shift_management`)**:
  - Master Shift Definitions: General Day Shift (09:00-18:00), Printing Press Early Shift (08:00-17:00), Punching & Die Press Shift (08:30-17:30), and Artisan Flexible Piece Shift (09:00-19:00).
  - Shift parameters: standard working hours (8h), grace periods (15m-30m), half-day thresholds (4.0h-4.5h), and overtime multipliers (₹200-₹350/hr).
  - Interactive Shift Assignment Matrix allowing administrators to map any staff member to their designated shift and classification (`Office Staff`, `Machine Operator`, `Karigar`).
- **Shift-Driven Payroll Register (`payroll_register`)**:
  - Dynamic payroll computation factoring shift days worked, overtime hours, and piece-rate completed tags.
  - Preserved and enhanced Handwork Piece-Rate Production Ledger for Karigars (Sumit).
- **Unified Android App & Terminal Simulator (`mobile_punch_terminal`)**:
  - Smartphone frame preview showcasing the single unified Android app for both normal employees and karigars:
    1. **Face Scan Biometric Punch**: Camera reticle, 99.4% confidence score, passive liveness blink check, auto-identification against roster.
    2. **Geofence Punch**: 50m factory radius validation, factory Wi-Fi BSSID matching, and mock-location anti-cheat verification.
    3. **Karigar Job Moving Studio**: Barcode/QR scan simulation for job cards (`JO_01_P1`), stage advancement, and completed tags piece-rate crediting.
  - Comprehensive engineering analysis on Face Scan vs Location punch.

### Version 3.1 — October 30, 2026
- **System-Wide Reset of Transactional Data (Orders, Job Orders, Bills & Ledgers)**:
  - Created safety backup in `data_backup_before_reset/`.
  - Emptied all customer and admin orders from `data/orders.json` (`[]`).
  - Emptied all shop-floor job orders / job cards from `data/production.json` (`[]`).
  - Emptied all commercial invoices and bills from `data/invoices.json` (`[]`).
  - Emptied all payment receipts and settlement transactions from `data/payments.json` (`[]`).
  - Emptied old order quotations from `data/estimates.json` (`[]`) and inquiry logs from `data/messages.json` (`[]`).
  - Reset piece-rate job entries in `data/payroll.json` and reset laborer piece-rate bonuses to 0.
  - Reset client metrics (`totalOrders: 0`, `spentTotal: 0`) in `data/users.json` while maintaining client profiles and saved brand names.
  - Cleaned job deduction references (`lastDeductedJob`, `lastDeductedDate`) in `data/inventory.json`.
  - **Preserved Sheet Catalog**: Retained all 30 sheet catalog swatches, GSMs, finishes, and sheet rates in `data/catalogs.json` completely untouched.
  - Verified clean, error-free empty states across both Customer and Admin portals.

### Version 3.0 — October 28, 2026
- **Artwork Preview & In-Card Cropping**:
  - Rendered artwork thumbnail on every job card with hover "✂️ Crop" action opening `ImageCropModal`.
  - Fallback upload button allowing artwork to be attached or replaced on the fly.
  - Component image preview rendered inside the Job Card Creation modal.
- **Compact Job Number & Customer Order Reference**:
  - Replaced long job card numbers with compact `JO_01_P1`, `JO_01_P2`, `JO_02_P1`, etc.
  - Displayed Customer Order Number (e.g. `Order: MGC01`) prominently right below the Job Number.
- **Operator Assignment in Printing & Punching**:
  - Added dynamic operator assignment dropdowns to Paper Cutting, Printing Press, and Punching & Die Press.
- **Handwork Process: Tags/Pcs Input**:
  - Handwork operator enters final tags produced (pcs/tags, NOT sheets).
- **Automated Wastage Calculation**:
  - Live 3-box summary of Input, Good Output, and System Calculated Wastage across all 4 production stations without manual waste typing.
    4. **Handwork Process**: Piece-rate Dori attachment & plastic seal lock.
    5. **Dispatch**: Final verification & shipping godown packing.
  - Production Cycle Manager: Dynamically loads cycles from `/api/production_cycles` (`data/production_cycles.json`) with ability for admins to create and select alternative cycles.
- **Mandatory 9 Job Card Fields**:
  - Standardized all job cards in the Production Flow and Job Card Creation modal to display and edit the 9 required fields:
    1. Date
    2. Job Number
    3. Order Number
    4. Party Name
    5. Paper Name
    6. Order Quantity
    7. Number of Printing Colors
    8. Name of Printing Colors
    9. Priority
- **Wastage Rule & Exact Sheet Issuance (Zero Post-Sheet Buffers)**:
  - Formulated tag-level wastage rule: **200 extra tags per 5,000 tags** (`Math.round((orderQty / 5000) * 200)`):
    - `5,000 tags` &rarr; `5,200 tags to produce` &rarr; `520 sheets issued (@ 10 ups)`
    - `10,000 tags` &rarr; `10,400 tags to produce` &rarr; `1,040 sheets issued (@ 10 ups)`
    - `15,000 tags` &rarr; `15,600 tags to produce` &rarr; `1,560 sheets issued (@ 10 ups)`
  - Completely eliminated the legacy `+40 sheets` buffer rule (`bufferSheets = 0; issuedSheets = targetSheets`).
  - Added live 4-column summary metric boxes (`Net Order`, `Wastage (200/5k)`, `Total Tags`, `Issued Sheets`) in both the Job Card Creation modal and the active Production Flow view.
- **Paper Catalog Refinements & 30 Real Papers Preserved**:
  - Increased typography size and readability in the Catalog Grid.
  - Standardized paper naming convention to `Paper #01`, `Paper #02`, etc., replacing `Cat#103`.
  - Removed redundant `Recommended Application` field from paper forms and cards.
  - Preserved all 30 actual papers in catalog.

### Version 2.8 — October 28, 2026
- **Locked Table Column Layout (`table-layout: fixed` & Explicit Colgroup)**:
  - Addressed and resolved the issue where entering search terms or filtering orders caused the `Brand & Item Specs` column to expand horizontally and `Status` to shrink.
  - Implemented `table-fixed` and `<colgroup>` width locking across both Admin Portal and Customer Portal order registers.
  - Explicit column widths: Checkbox (`44px`), Order ID (`130px`), Artwork (`84px`), Customer Name (`150px`), Dori & Plastic (`150px`), Qty (`95px`), Rate & Total (`135px`), Status (`230px`), with remaining width cleanly assigned to Brand & Item Specs.
  - Verified with automated CDP browser tests that column widths remain 100% frozen and invariant regardless of how many rows are displayed (24 orders, 1 order, or 0 matching orders).
- **Admin Order Register Layout Optimization (Dedicated Qty & Rate Columns)**:
  - **Separate QTY Column**: Introduced a dedicated right-aligned Quantity column showing formatted volume (`10,000 pcs`, batch totals) with its own real-time search input (`Filter qty...`).
  - **Merged RATE & TOTAL Column**: Consolidated unit price (`₹1.45 /pc`) and bold grand total (`₹17,110.00`) into a single unified column, eliminating the redundant standalone "TOTAL AMT" column. Added dual search filter (`Filter rate...`).
  - **Compacted ORDER ID Column**: Narrowed column width (`w-32`) with bold monospace ID, customer reference pill (`MGC01`), and compact date to eliminate horizontal table congestion.
  - **Cleaned Brand & Item Specs**: Removed redundant `Qty • Rate` subtext from the specifications column, providing clean breathing room for item codes, brand badges, and material pills.
  - **Server Socket Resilience**: Added socket timeout controls (`ReceiveTimeout` / `SendTimeout`) in `server.ps1` to prevent TCP hangs on idle browser connections.

### Version 2.7 — October 26, 2026
- **Two-Tier Navigation Architecture (Groups on Left, Sub-Tabs on Top)**:
  - Re-architected application navigation into a clean two-tier hierarchy across both Customer and Admin portals.
  - **Level 1 (Left Floating Strip)**: Displays high-level Module Groups with active tooltips and state synchronization:
    - *Customer*: `Dashboard`, `Orders`, `Billing`, `Support` + Profile.
    - *Admin*: `Dashboard`, `Orders`, `Operations`, `Billing & Finance` + Profile.
  - **Level 2 (Top Navigation Bar)**: Dynamically renders only the relevant sub-tabs for the active group:
    - *Orders*: `Place Order`, `Order Register` + group breadcrumb indicator.
    - *Operations*: `Production Flow`, `Raw Materials & Stock`, `Attendance & Payroll`, `Paper Catalogs & Types`.
    - *Billing & Finance*: `All Invoices`, `Create Invoice`, `Payment Entries`, `Ledgers Hub`.
  - Automatic bi-directional routing: Navigating between tabs automatically switches the active group highlight on the left sidebar.
- **Admin Order Register Per-Column Search & Filtering**:
  - Brought complete feature parity with the Customer Order Register.
  - Added dedicated real-time search inputs directly beneath column headers: `Order ID`, `Customer Name`, `Brand & Item Specs`, `Dori & Plastic`, and `Total Amt / Qty`.
  - Added Top Filter bar with status dropdown filter displaying live count metrics per stage, order counter badge, and one-click "Clear Filters" button.
  - Preserved both Table View and Kanban View, with search filters functioning in real-time across both view modes.
- **Multi-User Concurrency & Guaranteed Unique Dual Order IDs**:
  - Implemented thread-monitor locked server endpoint `POST /api/create-order` in `server.ps1` with atomic disk read-increment-save.
  - Implemented dual ID formatting:
    - Admin View: `TGRS{GlobalSeq}-ORD-{Year}-{CustSeq}` (*e.g., `TGRS25-ORD-2026-MGC07`*).
    - Customer View: `{CustSeq}` (*e.g., `MGC07`*).
  - Built-in collision loop guarantees unique sequential IDs even when multiple customers or admins submit orders simultaneously.
- **Admin Place Order Party Entry UX**:
  - Replaced legacy `<select>` dropdown with quick-clickable party chips (`[MG Creation]`, `[Aariya Creation]`, `[TagX]`, `[D Tag]`) and real-time text input with floating autocomplete suggestions matching the brand entry UX.
- **Cleaned Stray Reference Badges & Migrated Historical Data**:
  - Removed stray `MGC01` badge references from studio headers, preview lines, and job tickets.
  - Standardized customer abbreviations (`MGC`, `ARC`, `TGX`, `DTAG`) in `users.json` and migrated all orders across `invoices.json`, `production.json`, `payments.json`, `estimates.json`, and `payroll.json`.

---

## Active Roadmap & Upcoming Enhancements

- [ ] **Production Stage Tracking**: Operator step-by-step sheet progression from sheet loading to offset printing, die-cutting, dori threading, and packing.
- [ ] **Automated PDF Export**: Client-side direct PDF generation via html2canvas / jspdf fallback.
- [ ] **SMS / WhatsApp Status Alerts**: Webhook notification triggers on production stage transitions.
- [ ] **Barcode / QR Code Generation**: Printable job-card tracking slips for machine operators.
- [ ] **Export to Excel / CSV**: One-click download for Outstanding Ledgers and Daily Production Sheets.
