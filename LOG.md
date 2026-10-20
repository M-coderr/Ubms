# Changelog & Development Log — uBMS

All notable changes, architectural revisions, feature rollouts, and bug fixes for **uBMS** (Unified Business & Order Management System) are documented in this file, organized in reverse chronological order date-wise.

---

## [2026-10-20] — Version 2.3

### 🎨 Modern Sales Order UI Redesign (Inspired by TagX Reference)
- **Unified Single-Screen Order Creation**:
  - Re-architected the customer order creation interface from the multi-step form into a clean, calm, single-screen layout directly modeled after modern SaaS benchmarks (TagX reference design).
  - Eliminated mental overload and cognitive friction from arbitrary step barriers while maintaining 100% of underlying business rules, pricing, validation, and flat-file persistence.
- **Top Header & Document Status Bar**:
  - Added clean page heading: `New Sales Order` with subtitle `SO — place a customer order`.
  - Added minimalist document status bar: `📄 New Sales Order` with live indicator `✓ Draft saved just now` and a lightweight `discard` action to reset the draft.
  - Added solid primary `Place Order` button in the top-right corner with loading state (`Placing Order...`) and duplicate submission protection.
- **Left Column (Main Section)**:
  - **Card 1: General Information**:
    - Clean section header with icon: `🗂 General Information`.
    - Soft-filled input styling (`bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs`).
    - 3-column responsive grid:
      - `Transaction Type`: Select dropdown (`Sales Order`, `Sample / Job Work`, `Direct Export`).
      - `Order Type`: Select dropdown (`New Order`, `Repeat Order`).
      - `Order No`: Auto-assigned sequential item code badge (`currentCustomerItemCode`).
      - `Date`: Auto-populated date input with calendar icon (`📅`).
      - `Agent Name`: Read-only customer company/name input.
      - `Brand Name`: Text input with dedicated `+ Add Brand` quick-action button and inline error validation (`⚠ Please enter a brand name`).
      - `GST No (optional)`: Text input for customer tax identification.
  - **Card 2: Items**:
    - Clean section header with icon: `🏷 Items` and item counter.
    - `ITEM 1` container with clean badge and reference code.
    - Full-width article picker: `Type or pick item...` showing `{brandName} — {itemCode} ({selectedType})`.
    - Horizontal control bar:
      - Compact thumbnail button: shows miniature artwork thumbnail with crop and remove shortcuts if uploaded, or `+ Add item image` if empty.
      - `Category`: Select dropdown from `availableTypes` (`Tag`, `Label`, `Box`, `Ribbon`, etc.).
      - `Pieces / Format`: Select dropdown (`1 PC (Single Card Tag)`, `2 PC (Multi-Card Tag Set)`, `3 PC (3-Card Tag Set)`).
    - Detailed tag specifications:
      - Single Card: Paper Catalog Stock dropdown (GSM, finish, code) + Finished Size input (`50 x 90 mm`).
      - Multi-Card: Nested cards for `Tag 1 (Base Tag)`, `Tag 2 (Upper Tag)`, and optional `Tag 3 (Overlay Tag)` with individual paper stocks and finished dimensions.
    - Handwork Attachments:
      - Dori (String): Toggle pills for `Regular (₹0.20)` vs `Custom` (with custom text specification).
      - Plastic Lock: Toggle pills for `Regular (₹0.10)` vs `Custom` (with custom seal text specification).
    - Commercials row:
      - Quantity (Pcs) input with one-click quick presets (`1k`, `2.5k`, `5k`, `10k`).
      - Applicable Rate (₹/pc) input.
      - Auto-calculated subtotal (`qty × rate`).
    - Special Order Remarks / Packaging Instructions textarea.
    - Staged additional items list with delete actions.
    - `+ Add Another Item to this Order` action button.
- **Right Column (Companion Section)**:
  - **Card 1: Default Artwork**:
    - Clean header with icon: `🖼 Default Artwork` with descriptive subtext.
    - Spacious, minimalist dropzone matching the reference design:
      - Centered floating white rounded square with `+` icon.
      - Label: `Upload or drag & drop`.
      - Subtext: `Supports JPG, PNG, WEBP (Max 25MB)`.
      - Uploaded state: crisp image preview, `✓ Uploaded & Ready` status badge, and shortcuts for `Crop / Frame` (opens interactive crop modal), `View Full` (lightbox modal), `Replace`, and `Remove`.
  - **Card 2: Commercial Summary & Submit**:
    - Detailed breakdown: Brand, Item Code, Product, Format, Quantity, Rate, Subtotal, Handwork, and Taxes (`₹0.00`).
    - Prominent bold **Grand Total** in font-mono.
    - Full-width secondary `Place Order` button.
- **Navigation Cleanup**:
  - Hid the redundant `+ Place Order` button in the minimized top sub-header when the customer is already on the order creation tab.
- **Code & Syntax Verification**:
  - Audited bracket balance across `CustomerPortal.js` (`Parens diff: 0`, `Braces diff: 0`, `Brackets diff: 0`).

---

## [2026-10-20] — Version 2.2

### 🔄 Customer Order Flow Re-architecture (Sequential Refinement)
- Relocated paper catalog selection from Step 1 to Step 2.
- Added direct artwork upload to Step 1 with thumbnail previews and crop modal integration.
- Integrated visible artwork preview in Step 2 displaying the image uploaded in Step 1.
- Updated multi-tag configuration nomenclature to **Tag 1 (Base Tag)**, **Tag 2 (Upper Tag)**, and **Tag 3 (Overlay Tag)**.
- Established dedicated Quantity & Rate commercial step distinguishing editable inputs from auto-calculated totals.
- Implemented comprehensive complete order specifications review table before final submission.
- Preserved Back/Continue data persistence and duplicate submission prevention (`isSubmitting` flag).

---

## [2026-10-20] — Version 2.1

### 📚 Documentation & Local Infrastructure
- Initialized comprehensive repository `README.md` and `STATUS.md` with complete architectural guides and standing push policies.
- Verified local PowerShell HTTP daemon (`server.ps1`) on port 8080 responding HTTP 200 OK.

---

## [2026-10-17] — Version 2.0

### 🎨 Enterprise Light Theme & Emoji Elimination
- Refactored entire UI across Customer and Admin portals to a minimalist light theme using Warm Ivory Paper Linen (`#F9F8F5`), crisp white cards, and Slate-900 controls.
- Eliminated cartoon emojis from all headers, badges, tabs, and action buttons.
- Standardized font hierarchies, border radii, and monospaced financial figures.
- Refactored `CustomerPortal.js`, `AdminPortal.js`, `Header.js`, `ImageCropModal.js`, and `InvoiceModal.js`.

---

## [2026-10-16] — Version 1.5

### ✂️ In-Browser Artwork Cropper & Lightbox
- Integrated interactive artwork cropping tool (`ImageCropModal.js`) with hangtag aspect ratio presets (`2:3`, `1:1`, `1:2`, `3:4`), zoom slider, rotation controls, and real-time preview canvas.
- Added full-size artwork lightbox modal (`showFullImageModal`) for high-resolution inspection.
- Applied Warm Ivory Linen background styling to the application root.

---

## [2026-10-15] — Version 1.2

### 🏭 Production Pipeline & Master Data
- Built end-to-end manufacturing pipeline bridging pieces (pcs) to production sheets.
- Created raw material paper catalog management (master sheet dimensions, GSM, finishes, vendor rates).
- Implemented auto-generated sequential item codes based on customer abbreviations.
- Configured real operational personas: Meet (Super Admin), Parth (Admin), Niraj (Admin), Kanu (Printing), Shivakant (Punching), Sumit (Dori/Plastic).
- Configured real customer accounts: MG Creation (Mohit), Aariya Creation (Umesh), TagX (Parth), D Tag (Niraj).

---

## [2026-10-13] — Version 1.0

### 🚀 Initial Beta Release
- Initial release of the uBMS beta order entry page.
- Basic Customer Portal with order register and account manager chat.
- Flat-file JSON persistence layer powered by PowerShell HTTP server (`server.ps1`).
