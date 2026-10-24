# Project Status — uBMS

**Current Status**: 🟢 Active Development / Production-Ready Beta  
**Branch**: `beta`  
**Repository**: [https://github.com/M-coderr/Ubms.git](https://github.com/M-coderr/Ubms.git)  
**Version**: 2.6  
**Last Updated**: October 24, 2026  
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
| **Persona & Auth** | Real Internal Personas | ✅ Complete | Meet (Super Admin), Parth (Admin), Niraj (Admin), Kanu (Printing), Shivakant (Punching), Sumit (Dori Plastic) |
| | Real Customer Accounts | ✅ Complete | MG Creation (Mohit), Aariya Creation (Umesh), TagX (Parth), D Tag (Niraj) |
| | Switcher Header | ✅ Complete | One-click role/customer profile switching without re-login |
| **Customer Portal** | Production Order Studio | ✅ Complete | Bespoke garment accessory order workshop: Specification Sheet + Visual Proof Canvas & Job Ticket |
| | Visual Artwork Framing & Proof | ✅ Complete | Hangtag blueprint silhouette, 3mm hole-punch guide, prepress alignment canvas |
| | In-Browser Artwork Cropper | ✅ Complete | Interactive 8-handle image framing with aspect ratio presets (`2:3`, `1:1`, `1:2`, `3:4`), zoom, rotation |
| | Artwork Lightbox | ✅ Complete | High-resolution popover preview for all uploaded artworks |
| | Order Register & Filter | ✅ Complete | Instant transition upon booking, order status tracking, priority badges |
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

*(For the complete date-wise changelog since project inception, see [LOG.md](LOG.md))*

### Version 2.6 — October 24, 2026
- **Complete Elimination of Mojibake & Encoding Artifacts**:
  - Scanned repository and isolated character corruption in `CustomerPortal.js` caused by multi-byte UTF-8 bytes previously read in Windows-1252 code pages.
  - Converted the codebase to 100% pure 7-bit ASCII, completely immune to cross-platform encoding anomalies across web servers, browsers, and operating systems.
  - Cleaned all 38 corrupted symbols and replaced them with standard HTML entities and JavaScript Unicode escapes:
    - Rupee currency symbol: `&#8377;` in JSX markup and `\u20B9` inside JavaScript template strings/regex (`₹0.20`, `₹0.10`, `₹/pc`).
    - Directional navigation arrows: `&rarr;` / `\u2192` (`→`).
    - Repeat order action: `&#8635;` (`↻`) and `+ New Design Order`.
    - Checkmark badges: `&#10003;` / `\u2713` (`✓ Loaded`, `✓ Print File Ready`).
    - Dismiss & clear search buttons: `&times;` (`×`).
    - Dimensions & bullets: standard ASCII `x` (`Size L x Size B`) and `&bull;` (`•`).
    - Validation alerts: `&#9888;` (`⚠`).
  - Tested and verified 0 Babel transpilation errors via in-browser headless Edge test runner.
  - Confirmed visual fidelity via headless browser screenshots: `clean_studio_page.png` and `clean_repeat_mode.png`.

### Version 2.5 — October 24, 2026
- **Bespoke "Production Order Studio" (Eliminated TagX Clone Layout)**:
  - Completely replaced generic SaaS/TagX copycat strings (`New Sales Order`, `SO — place a customer order`, `Draft saved just now • discard`, `General Information`, `Default Artwork: Used for any item...`) with proprietary garment accessory manufacturing studio branding.
  - **Left Column: Production Specification Sheet (~58%)**:
    - Segmented toggle between `✨ New Design Order` and `🔄 Repeat Past Item`.
    - Floating autocomplete search cards for past manufactured articles with artwork thumbnails, codes, and historical pricing.
    - Clean brand name input with customer saved brands chips (`+ MG Creation`) and auto-assigned manufacturing reference (`MGC_Tag_Zara_1`).
    - Product Category and Piece Architecture: Hangtag, Tag Kit (Multi-Piece 1/2/3 PC sets), PU Leather Labels.
    - Material Board: Paper master catalogs with GSM/finish specifications; Indian PU (1.2/1.8/2.2mm) vs Imported Synthetic Grain.
    - Handwork Fasteners: Dori (None / Reg. ₹0.20 / Custom) & Barcode Plastic Seal (None / Reg. ₹0.10 / Custom).
    - Production Volume & Commercials: Preset volume pills (`1k`, `2.5k`, `5k`, `10k`), agreed rate, subtotal, and packaging instructions.
    - Multi-Article Batches: Staged item batching via `+ Add Another Article to this Order Batch`.
  - **Right Column: Visual Proof Canvas & Production Job Ticket (~42%)**:
    - Interactive Blueprint Artwork Proof: Simulated hangtag silhouette upload dropzone; switches to realistic hangtag mockup with 3mm drill hole punch guide, finished dimension badge, and prepress toolstrip (`✂️ Crop & Frame`, `Inspect Lightbox`, `Replace`, `Remove`).
    - Authentic Production Job Ticket: Live manufacturing order card with brand, product category, piece composition, material board, volume, unit rate, attachments, and live estimated total.
  - **Instant Transition & Alert Elimination**:
    - Removed blocking browser `alert()` modal dialogs in favor of non-blocking success toasts.
    - Configured instantaneous tab transition to `Customer Order Register` upon clicking `Confirm & Book Order`.

### Version 2.4 — October 21, 2026
- **Customer Portal Order Entry Streamlining**:
  - **Order Type Radio Switcher**: Replaced the transaction type & order dropdowns with mandatory top-level radio buttons (`New Order` / `Repeat Order`). Simplified General Info tab to order number, date, and customer agent details.
  - **Brand Name Integration**: Relocated Brand Name to the Item Section directly beside Category and Pieces format.
  - **Dynamic Customer Brand Persistence**: Automatic saving of newly entered brand names upon final order submission (`handleSubmitFinalOrder`), with instant real-time suggestion dropdown. Solved browser autofill popup collisions via custom floating suggestion cards and autofill suppression attributes.
  - **Standardized Item Naming Formula**: Dynamic automatic item naming adhering to `{Customer Abbreviation}_{item_type}_{Brand Name}_{x}` where `x` represents an incremental integer per customer item.
- **Repeat Order Item Search System**:
  - Replaced native `<select>` dropdown with a custom searchable input and floating suggestions matching the Brand Name autocomplete UX.
  - Real-time search across past items by code, brand name, category, or material.
  - Rich suggestions display artwork thumbnail, item code, brand, category, paper/material gauge, unit price, and one-click selection with instant spec population.
- **New Category: "Tag Kit" & Material Specifications**:
  - Introduced new manufacturing category: **Tag Kit** (supports multi-card pieces, paper catalog selection, zero handwork attachments).
  - Material Selection: Paper catalog for Tag and Tag Kit; Indian PU (1.2, 1.8, 2.2 mm gauges) vs Imported PU (single quality) for PU Labels.
  - Renamed "Plastic lock / seal" to "Barcode Plastic" with optional toggle.
  - Streamlined commercials: eliminated distracting suggestions and redundant subtotal, enhanced quantity and rate input sizing.
- **Enhanced In-Browser Artwork Cropper**:
  - Implemented 8 interactive resizing handles (4 corner handles + 4 edge handles) for precise framing.
  - Set **Free Crop** as the default cropping mode with one-click aspect ratio presets (`Free`, `2:3`, `1:1`, `1:2`, `3:4`).
  - Added mouse wheel zoom, 90° rotation, horizontal flip, and center alignment controls.
  - Added tag hole punch simulator toggle for visual verification of hole placement.
  - Exported high-resolution canvas with 2× retina scale for crisp rendering.

### Version 2.3 — October 20, 2026
- **Customer Order Creation Redesign (TagX Modern Sales Order Layout)**:
  - Transformed order entry into a clean, calm, single-screen layout modeled directly after modern SaaS benchmarks (TagX reference design).
  - Eliminated mental overload and cognitive friction from multi-step wizard barriers.

### Version 2.2 — October 20, 2026
- **Customer Order Creation Flow Redesign (Revised 4-Step Wizard)**:
  - Re-architected customer order creation into four sequential steps with interactive stepper.

### Version 2.1 — October 20, 2026
- **Documentation & Tracking**: Initialized `README.md` and `STATUS.md` with full architectural guides and standing push policies.
- **Server Monitoring**: Restarted and verified PowerShell local server daemon (`server.ps1`) on port 8080 responding HTTP 200 OK.

### Version 2.0 — October 17, 2026
- **Comprehensive UI/UX Redesign**:
  - Migrated entire application away from jarring dark cards to a clean Warm Ivory (`#F9F8F5`) aesthetic with Slate-900 controls.
  - Eliminated cartoon emojis from all headers, badges, tabs, and action buttons.
- **Production Pipeline Enhancements**:
  - Added required sheet quantity calculation input alongside piece counts.
  - Integrated bulk move-to-production capability.
  - Added Paper Catalog editor and management view.

---

## Active Roadmap & Upcoming Enhancements

- [ ] **Automated PDF Export**: Client-side direct PDF generation via html2canvas / jspdf fallback.
- [ ] **SMS / WhatsApp Status Alerts**: Webhook notification triggers on production stage transitions.
- [ ] **Barcode / QR Code Generation**: Printable job-card tracking slips for machine operators.
- [ ] **Export to Excel / CSV**: One-click download for Outstanding Ledgers and Daily Production Sheets.
