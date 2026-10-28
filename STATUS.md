# Project Status — uBMS

**Current Status**: 🟢 Active Development / Production-Ready Beta  
**Branch**: `beta`  
**Repository**: [https://github.com/M-coderr/Ubms.git](https://github.com/M-coderr/Ubms.git)  
**Version**: 3.0  
**Last Updated**: October 28, 2026  
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
| | Invoice Generator | ✅ Complete | Tax-exempt & commercial invoice generation with custom terms |
| | Payment Receipts | ✅ Complete | Record client payments, balance reconciliation |
| | Customer Ledgers | ✅ Complete | Individual customer debit/credit journals and transaction logs |
| | Payroll & Attendance | ✅ Complete | Piece-rate calculation for handwork laborers + operator attendance |

---

## Recent Milestones & Changelog

*(For the complete date-wise changelog since project inception, see [LOG.md](LOG.md))*

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
