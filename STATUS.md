# Project Status — uBMS

**Current Status**: 🟢 Active Development / Production-Ready Beta  
**Branch**: `beta`  
**Repository**: [https://github.com/M-coderr/Ubms.git](https://github.com/M-coderr/Ubms.git)  
**Last Updated**: October 20, 2026  
**Local Server**: `http://localhost:8080/` (PowerShell HTTP Daemon)

---

## Standing Maintenance Policy

> [!IMPORTANT]
> **Commit & Push Requirement**: Every push to the Git repository **must** include an update to both `README.md` and `STATUS.md`. Any new features, component adjustments, bug fixes, or schema alterations must be documented here in the changelog and reflected in the feature matrix.

---

## Feature Completion Matrix

| Module | Sub-feature | Status | Description |
|---|---|---|---|
| **Design & UI System** | Minimalist Light Theme | ✅ Complete | Warm Ivory Paper Linen (`#F9F8F5`), crisp white cards, slate-900 typography |
| | Emoji Elimination | ✅ Complete | Professional, distraction-free interface across all components |
| | Responsive Layout | ✅ Complete | Fluid grid and mobile-friendly viewports |
| **Persona & Auth** | Real Internal Personas | ✅ Complete | Meet (Super Admin), Parth (Admin), Niraj (Admin), Kanu (Printing), Shivakant (Punching), Sumit (Dori Plastic) |
| | Real Customer Accounts | ✅ Complete | MG Creation (Mohit), Aariya Creation (Umesh), TagX (Parth), D Tag (Niraj) |
| | Switcher Header | ✅ Complete | One-click role/customer profile switching without re-login |
| **Customer Portal** | 4-Step Order Placement | ✅ Complete | Guided wizard: tag selection, dori/plastic options, artwork upload, quantity & rates |
| | In-Browser Artwork Cropper | ✅ Complete | Interactive image framing with aspect ratio presets (`2:3`, `1:1`, `1:2`, `3:4`), zoom, and rotation |
| | Artwork Lightbox | ✅ Complete | High-resolution popover preview for all uploaded artworks |
| | Order Register & Filter | ✅ Complete | Order status tracking, editing pending orders, priority badges |
| | Invoicing & PDF Print | ✅ Complete | View invoices and trigger print/PDF export |
| | Outstanding Aging Ledger | ✅ Complete | 0-30, 31-60, and 60+ days aging overdue tracking |
| | General Ledger Journal | ✅ Complete | Full debit/credit/balance statement of accounts |
| | Account Manager Chat | ✅ Complete | Real-time direct chat interface with assigned account manager |
| **Admin Portal** | Executive Dashboard | ✅ Complete | Revenue, active jobs, pipeline summary, overdue alerts |
| | All Orders & Kanban | ✅ Complete | List view & Kanban drag-and-drop workflow stages |
| | Production Floor Pipeline | ✅ Complete | Pieces-to-sheets conversion, multi-card handling, bulk promotion to printing |
| | Paper Catalog Management | ✅ Complete | Master paper sizes, GSM, finishes, vendor rates, and reorder levels |
| | Inventory & Raw Materials | ✅ Complete | Real-time stock counts for boards, dori spools, plastic locks, and ink |
| | Invoice Generator | ✅ Complete | Tax-exempt & commercial invoice generation with custom terms |
| | Payment Receipts | ✅ Complete | Record client payments, balance reconciliation |
| | Customer Ledgers | ✅ Complete | Individual customer debit/credit journals and transaction logs |
| | Payroll & Attendance | ✅ Complete | Piece-rate calculation for handwork laborers + operator attendance |

---

## Recent Milestones & Changelog

### Version 2.1 — October 20, 2026
- **Documentation & Tracking**: Initialized `README.md` and `STATUS.md` with full architectural guides and standing push policies.
- **Server Monitoring**: Restarted and verified PowerShell local server daemon (`server.ps1`) on port 8080 responding HTTP 200 OK.

### Version 2.0 — October 17, 2026
- **Comprehensive UI/UX Redesign**:
  - Migrated entire application away from jarring dark cards and heavy saturated blues/purples to a clean Warm Ivory (`#F9F8F5`) aesthetic with Slate-900 controls.
  - Eliminated cartoon emojis from all headers, badges, tabs, and action buttons.
  - Refactored `CustomerPortal.js`, `AdminPortal.js`, `Header.js`, `ImageCropModal.js`, and `InvoiceModal.js`.
  - Audited delimiter and bracket balance across all components (`Diff: 0`).
- **Production Pipeline Enhancements**:
  - Added required sheet quantity calculation input alongside piece counts.
  - Integrated bulk move-to-production capability.
  - Added Paper Catalog editor and management view.
- **Identity & Persona Migration**:
  - Replaced dummy placeholder names with real internal team members (Meet, Parth, Niraj, Kanu, Shivakant, Sumit) and customers (MG Creation, Aariya Creation, TagX, D Tag).

---

## Active Roadmap & Upcoming Enhancements

- [ ] **Automated PDF Export**: Client-side direct PDF generation via html2canvas / jspdf fallback.
- [ ] **SMS / WhatsApp Status Alerts**: Webhook notification triggers on production stage transitions.
- [ ] **Barcode / QR Code Generation**: Printable job-card tracking slips for machine operators.
- [ ] **Export to Excel / CSV**: One-click download for Outstanding Ledgers and Daily Production Sheets.
