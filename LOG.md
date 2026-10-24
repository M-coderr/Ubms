# Changelog & Development Log — uBMS

All notable changes, architectural revisions, feature rollouts, and bug fixes for **uBMS** (Unified Business & Order Management System) are documented in this file, organized in reverse chronological order date-wise.

---

## [2026-10-24] — Version 2.6

### 🛠️ Complete Elimination of Mojibake & Encoding Artifacts
- **Repository Encoding Audit**:
  - Scanned the entire workspace codebase using targeted byte-inspection scripts.
  - Isolated character corruption in `CustomerPortal.js`, where multi-byte UTF-8 character sequences (`₹`, `✨`, `🔍`, `—`, `×`, `✓`, `•`) had been corrupted by Windows-1252 code-page interpretations (`â‚¹`, `âœ¨`, `ðŸ” `, `â€”`, `Ã—`, `âœ“`, `â€¢`).
- **Standardized Pure ASCII & HTML Entity Architecture**:
  - Replaced all corrupted sequences with standard HTML entities and JavaScript Unicode escapes:
    - **Currency**: `&#8377;` for JSX markup and `\u20B9` inside JS template literals and regex patterns (`₹0.20`, `₹0.10`, `₹/pc`).
    - **Navigation & Arrows**: `&rarr;` / `\u2192` (`→`).
    - **Actions & Modes**: `&#8635;` (`↻`) and `+ New Design Order`.
    - **Status & Badges**: `&#10003;` / `\u2713` (`✓ Loaded`, `✓ Print File Ready`).
    - **Clear / Dismiss Controls**: `&times;` (`×`).
    - **Dimensions & Separators**: Standard ASCII `x` (`Size L x Size B`) and `&bull;` (`•`).
    - **Form Validation Warnings**: `&#9888;` (`⚠`).
  - Saved `CustomerPortal.js` in pure 7-bit ASCII format (`[System.Text.Encoding]::ASCII`), rendering it 100% resilient against any future server, OS, or browser encoding mismatches.
- **Verification & Testing**:
  - Validated that `Babel.transform` compiles `CustomerPortal.js` in-browser with zero syntax errors.
  - Verified 0 non-ASCII characters remain across the entire codebase.
  - Captured full headless Edge CDP screenshots confirming pristine UI rendering on the live local server.

---

## [2026-10-24] — Version 2.5

### 🎨 Bespoke "Production Order Studio" (Eliminated TagX Clone Layout)
- **Elimination of Copycat SaaS Elements**:
  - Replaced generic SaaS / TagX clone elements (`New Sales Order`, `SO — place a customer order`, `Draft saved just now • discard`, `General Information`, and `Default Artwork: Used for any item that doesn't have its own image...`).
  - Transitioned the entire experience to a clean, proprietary garment accessories manufacturing studio tailored specifically for tags, woven labels, and leather patches.
- **Header & Workspace Structure**:
  - Header: **Production Order Studio** with dynamic sequential customer reference badge (`currentCustomerItemCode`, e.g., `MGC01`), subtitle *"Configure garment tag specifications, inspect artwork proof, and book manufacturing orders"*, and primary `Confirm & Book Order →` button.
  - Balanced 2-Column Split: ~58% Left Column (Production Specification Sheet) and ~42% Right Column (Visual Proof Canvas & Production Job Ticket).
- **Left Column: Production Specification Sheet**:
  - **Production Run Type**: Segmented pill switcher between `✨ New Design Order` and `🔄 Repeat Past Item`.
  - **Repeat Past Item Autocomplete**: Floating cards showing past manufactured artwork thumbnails, code badges, brands, product type, board stock, unit price, and instant spec loading.
  - **New Design Brand Input**: Clean brand field with quick-select customer brand chips (`+ MG Creation`, etc.) and real-time auto-assigned manufacturing reference (`MGC_Tag_Zara_1`).
  - **Product Category & Structure**: Segmented categories (`Hangtag`, `Tag Kit (Multi-Piece)`, `PU Leather Label`). Multi-card sets (1 PC, 2 PC, 3 PC) with independent catalog boards.
  - **Material Board**: Master paper catalog boards with GSM and finish options; dynamic origin switcher for PU labels (Indian PU 1.2/1.8/2.2mm vs Imported Synthetic Grain).
  - **Handwork Fasteners**: Dori (None / Reg. ₹0.20 / Custom) & Barcode Plastic Seal (None / Reg. ₹0.10 / Custom), hidden for Tag Kit.
  - **Production Volume & Commercials**: Volume input with presets (`1k`, `2.5k`, `5k`, `10k`), agreed rate, subtotal, and special packaging notes.
  - **Multi-Article Batching**: `+ Add Another Article to this Order Batch` staged items table.
- **Right Column: Visual Proof Canvas & Production Job Ticket**:
  - **Visual Artwork Proof Canvas**: Simulated hangtag blueprint silhouette upload dropzone (`Upload Production Artwork`). When uploaded, frames the artwork inside a realistic hangtag with 3mm drill-hole guide, aspect-ratio dimensions badge, and prepress toolstrip (`✂️ Crop & Frame`, `Inspect Lightbox`, `Replace`, `Remove`).
  - **Production Job Ticket**: Authentic manufacturing job ticket summary with brand, item, composition, material board, volume, unit rate, attachments, estimated total (`formatCurrency(grandTotal)`), and primary `Confirm & Book Order ✓` button.
- **Instantaneous Transition & Alert Elimination**:
  - Removed blocking browser `alert()` modal dialogs in favor of non-blocking success toasts.
  - Configured instantaneous tab transition to `Customer Order Register` upon clicking `Confirm & Book Order`.
  - Background asynchronous persistence of newly used brand names to user storage.
  - Fixed encoding artifacts and mojibake across all JSX elements.

---

## [2026-10-21] — Version 2.4

### 🚀 Customer Portal Order Entry Streamlining & Customization
- **Streamlined Order Type Selection**:
  - Replaced legacy sales order / transaction type dropdowns with mandatory top-level radio buttons (`New Order` / `Repeat Order`) on the General Information card.
  - Streamlined general info card to prioritize mandatory order type, auto-assigned order reference, order date, and customer profile details.
- **Brand Name Integration & Item Creation**:
  - Relocated Brand Name to the Item Specifications section directly preceding Category and Pieces format.
  - Built real-time brand autocomplete with non-intrusive floating suggestion cards.
  - Configured persistent brand saving: any new brand entered by the customer is automatically saved into the customer profile and local storage upon order submission (`handleSubmitFinalOrder`).
  - Eliminated browser autofill collisions by suppressing native autocomplete/datalist popups.
  - Implemented standardized automatic item naming convention: `{Customer Abbreviation}_{item_type}_{Brand Name}_{x}`, with per-customer sequential counters.

### 🔍 Repeat Order Searchable Autocomplete
- **Floating Suggestion Card Format**:
  - Replaced static HTML `<select>` dropdown with custom searchable input matching the Brand Name autocomplete format.
  - Real-time client-side filtering matching item code, name, brand, category/type, or material specifications.
  - Displays thumbnail artwork, item name/code badge, brand, type, material/catalog, unit price, and a quick `Select ↵` / `✓ Loaded` status indicator.
  - Instant loading of complete item specs (brand, category, multi-card format, paper catalog, PU gauge, dori/plastic options, artwork, and unit price).
  - Added inline `✕` clear button for quick selection reset and automatic draft reset on order type toggle.

### 🏷️ Category "Tag Kit" & Material Specialization
- **Tag Kit Category**:
  - Added third major manufacturing category: **Tag Kit** across customer and admin portals and label types metadata.
  - Supports multi-card piece sets (1 PC, 2 PC, 3 PC) with independent paper catalog selection for each card.
  - Configured zero-handwork attachment logic (Dori and Barcode Plastic excluded, handwork labor rate set to ₹0.00).
- **Dynamic Material Options**:
  - Tag & Tag Kit: Paper catalog selection (Art Ivory, Duo Art, White Kraft, Eco Brown Kraft, Black Core Board, etc.).
  - PU Label: Dynamic origin switcher between **Indian PU** (with thickness options: 1.2 mm, 1.8 mm, 2.2 mm) and **Imported PU** (single premium quality).
  - Renamed "Plastic lock / seal" to "Barcode Plastic" with optional toggle.
  - Commercials cleaned up: removed distracting subtotal and quantity pill suggestions, enlarged inputs for better readability.

### 🖼️ In-Browser Artwork Studio Overhaul
- **8-Point Handle Crop Box**:
  - Enhanced `ImageCropModal.js` with 8 interactive resize handles (4 corners + 4 edge midpoints) with responsive touch/mouse dragging.
  - Set **Free Crop** as the default mode with one-click aspect ratio toggles (`Free`, `2:3`, `1:1`, `1:2`, `3:4`).
  - Added mouse wheel zooming, 90° rotation, horizontal flip, and center reset controls.
  - Added tag hole punch simulator toggle (hole visualizer with safe zone guide).
  - High-resolution retina canvas export (2× scale) with smooth bicubic image scaling.

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
