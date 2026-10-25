# Project Status — uBMS

**Current Status**: 🟢 Active Development / Production-Ready Beta  
**Branch**: `beta`  
**Repository**: [https://github.com/M-coderr/Ubms.git](https://github.com/M-coderr/Ubms.git)  
**Version**: 2.7  
**Last Updated**: October 26, 2026  
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
| | Production Floor Pipeline | ✅ Complete | Pieces-to-sheets conversion, multi-card handling, bulk promotion to printing |
| | Paper Catalog Management | ✅ Complete | Master paper sizes, GSM, finishes, vendor rates, and reorder levels |
| | Inventory & Raw Materials | ✅ Complete | Real-time stock counts for boards, dori spools, plastic locks, and ink |
| | Invoice Generator | ✅ Complete | Tax-exempt & commercial invoice generation with custom terms |
| | Payment Receipts | ✅ Complete | Record client payments, balance reconciliation |
| | Customer Ledgers | ✅ Complete | Individual customer debit/credit journals and transaction logs |
| | Payroll & Attendance | ✅ Complete | Piece-rate calculation for handwork laborers + operator attendance |

---

## Recent Milestones & Changelog

*(For the complete date-wise changelog since project inception, see [LOG.md](LOG.md))*

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

### Version 2.6 — October 24, 2026
- **Complete Elimination of Mojibake & Encoding Artifacts**:
  - Scanned repository and isolated character corruption in `CustomerPortal.js` caused by multi-byte UTF-8 bytes previously read in Windows-1252 code pages.
  - Converted the codebase to 100% pure 7-bit ASCII, completely immune to cross-platform encoding anomalies across web servers, browsers, and operating systems.
  - Cleaned all 38 corrupted symbols and replaced them with standard HTML entities and JavaScript Unicode escapes (`&#8377;`, `&rarr;`, `&times;`, `&bull;`).
  - Validated 0 Babel transpilation errors via in-browser headless Edge test runner.

---

### Version 2.5 — October 24, 2026
- **Bespoke "Production Order Studio" (Eliminated TagX Clone Layout)**:
  - Completely replaced generic SaaS/TagX copycat strings with proprietary garment accessory manufacturing studio branding.
  - Balanced 2-column studio grid (~58% Specification Sheet, ~42% Visual Proof Canvas & Job Ticket).
  - Interactive Blueprint Artwork Proof with 3mm drill hole punch guide and prepress toolstrip.
  - Multi-card composition for Tag Kits and PU leather options.

---

## Active Roadmap & Upcoming Enhancements

- [ ] **Production Stage Tracking**: Operator step-by-step sheet progression from sheet loading to offset printing, die-cutting, dori threading, and packing.
- [ ] **Automated PDF Export**: Client-side direct PDF generation via html2canvas / jspdf fallback.
- [ ] **SMS / WhatsApp Status Alerts**: Webhook notification triggers on production stage transitions.
- [ ] **Barcode / QR Code Generation**: Printable job-card tracking slips for machine operators.
- [ ] **Export to Excel / CSV**: One-click download for Outstanding Ledgers and Daily Production Sheets.
