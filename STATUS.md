# Project Status — uBMS

**Current Status**: 🟢 Active Development / Production-Ready Beta  
**Branch**: `beta`  
**Repository**: [https://github.com/M-coderr/Ubms.git](https://github.com/M-coderr/Ubms.git)  
**Version**: 2.4  
**Last Updated**: October 21, 2026  
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
| | Emoji Elimination | ✅ Complete | Professional, distraction-free interface across all components |
| | Responsive Layout | ✅ Complete | Fluid grid and mobile-friendly viewports |
| **Persona & Auth** | Real Internal Personas | ✅ Complete | Meet (Super Admin), Parth (Admin), Niraj (Admin), Kanu (Printing), Shivakant (Punching), Sumit (Dori Plastic) |
| | Real Customer Accounts | ✅ Complete | MG Creation (Mohit), Aariya Creation (Umesh), TagX (Parth), D Tag (Niraj) |
| | Switcher Header | ✅ Complete | One-click role/customer profile switching without re-login |
| **Customer Portal** | Modern Sales Order UI (TagX Style) | ✅ Complete | Unified single-screen layout: General Info, Items, Default Artwork, live commercials |
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

*(For the complete date-wise changelog since project inception, see [LOG.md](LOG.md))*

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
  - **Top Header & Document Status Bar**: Added `New Sales Order` heading with subtitle `SO — place a customer order`, document status badge `📄 New Sales Order` • `✓ Draft saved just now` • `discard`, and top-right `Place Order` button.
  - **Left Section (Main Form)**:
    - `🗂 General Information`: Soft-filled inputs for Transaction Type, Order Type, Order No, Date, Agent Name, Brand Name with `+ Add Brand`, and GST No.
    - `🏷 Items`: `ITEM 1` container, Article Picker (`Type or pick item...`), compact thumbnail / upload button (`+ Add item image` / preview with crop), Category, Pieces/Format (1 PC / 2 PC / 3 PC), Paper Catalog Stock & Dimensions, Handwork attachments (Dori & Plastic lock), Commercials (Quantity with `1k`, `2.5k`, `5k`, `10k` presets, Rate, Subtotal), and Special Remarks.
  - **Right Section (Companion Cards)**:
    - `🖼 Default Artwork`: Clean dropzone with centered floating white `+` square, helper text (`Used for any item that doesn't have its own image...`), artwork preview, and `Crop / Frame`, `View Full`, `Replace`, `Remove` actions.
    - `Commercial Summary`: Live item breakdown, handwork charges, Grand Total in prominent bold font-mono, and secondary `Place Order` button.
  - **Header Cleanup**: Removed redundant `+ Place Order` button in minimized header bar when on the order placement tab.
  - **Validation & Persistence**: Full inline validation, instant subtotal calculation, duplicate submission prevention (`isSubmitting` flag), and automatic redirect to Order Register.

### Version 2.2 — October 20, 2026
- **Customer Order Creation Flow Redesign (Revised 4-Step Wizard)**:
  - Re-architected customer order creation into the updated four sequential steps:
    - **Step 1 — Product Details & Artwork**: Brand Name (with inline validation), auto-assigned Item Code, Manufacturing Type selector, and primary artwork/image upload dropzone with thumbnail preview, crop lightbox, replace, and remove capabilities. Paper catalog selection removed from Step 1.
    - **Step 2 — Specifications & Accessories**: Relocated paper catalog selection here. Includes visible artwork preview displaying the uploaded artwork from Step 1 with quick crop/framing shortcuts. Single-card and multi-card selection with updated nomenclature: **Tag 1 (Base Tag)**, **Tag 2 (Upper Tag)**, and optional **Tag 3 (Overlay Tag)**. Standard and custom Dori (string) and Plastic Lock options.
    - **Step 3 — Quantity & Rate**: Replaced old standalone artwork step. Focused purely on commercial metrics: order quantity in pieces (pcs) with quick presets (`1k`, `2.5k`, `5k`, `10k`), agreed rate per unit (₹), and clearly distinguished auto-calculated subtotal (`qty × rate`).
    - **Step 4 — Review & Place Order**: Complete order specifications review table displaying brand, item code, manufacturing category, uploaded artwork thumbnail, each tag's paper and dimensions, accessory specifications, volume, rates, subtotals, and packaging remarks. Single primary **Confirm & Place Order** action with duplicate submission prevention.
  - Interactive stepper with compact summaries for completed steps, including one-click `[Edit]` shortcuts and Back/Continue navigation preserving all entered data and uploaded files.
  - Responsive live order summary sidebar on desktop and bottom sticky drawer on mobile viewports.

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
