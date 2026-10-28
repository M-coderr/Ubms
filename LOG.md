# Changelog & Development Log — uBMS

All notable changes, architectural revisions, feature rollouts, and bug fixes for **uBMS** (Unified Business & Order Management System) are documented in this file, organized in reverse chronological order date-wise.

---

## [2026-10-28] — Version 3.0

### 🖼️ Production Job Card Artwork Preview, Compact Identifiers & Automated Wastage Flow
- **Artwork Preview Thumbnail with Integrated Cropper**:
  - Embedded high-fidelity visual artwork thumbnail preview on every job card in the Production Flow pipeline.
  - Interactive hover/click "✂️ Crop" action opening `window.uBMS.ImageCropModal` with aspect ratio framing, zoom, pan, and rotation directly for job cards.
  - Upload fallback (`+ Artwork`) allowing instant image selection and update if no artwork was previously attached.
  - Component artwork preview also rendered in the "Start Production & Job Card Creation" modal next to each paper component.
- **Compact Job Card Number & Prominent Customer Order ID**:
  - Re-formatted job card numbers to the compact standard: `JO_01_P1`, `JO_01_P2`, `JO_02_P1`, etc. (representing sequence and part component for multi-card sets).
  - Prominently positioned the Customer Order Number directly below the Job Card Number (e.g., `Order: MGC01`).
- **Dynamic Operator Assignment in Cutting, Printing & Punching**:
  - Added dedicated operator assignment selectors in **Paper Cutting** (`Ramesh`, `Dilip`, etc.), **Printing Press** (`Kanu`, `Manoj Kumar`, etc.), and **Punching & Die Press** (`Shivakant`, `Dilip Yadav`, etc.).
  - Operators can be assigned or adjusted dynamically, persisting immediately to state and server records.
- **Handwork Process: Finished Tag Quantity Input (Tags/Pcs, Not Sheets)**:
  - Updated the Handwork Assembly stage to record output directly in **Final Completed Tags Produced (Pcs / Tags)** rather than sheets.
  - Converted punching sheet input to tags received using `punchedSheets * ups`.
- **System-Automated Wastage Calculation**:
  - Operators now only enter the good quantity produced at each station:
    - Cutting: `Good Sized Sheets Cut`
    - Printing: `Good Sheets Printed`
    - Punching: `Good Punched Sheets`
    - Handwork: `Final Completed Tags Produced (Pcs)`
  - Replaced manual wastage typing fields with a real-time 3-box summary (`Input Received`, `Good Quantity`, `System Calc Waste`) across all 4 production stations, dynamically calculating scrap and yield on the fly.
- **Data Synchronization & Cache Busting**:
  - Updated all 9 sample jobs in `data/production.json` with the new compact `JO_{seq}_P{part}` identifiers, populated `customerOrderId`, and base64 artwork images.
  - Bumped `AdminPortal.js?v=3.8` in `index.html`.

---

## [2026-10-28] — Version 2.9

### 🏭 Production Flow Pipeline & Dynamic Manufacturing Cycles
- **Order Arrival in Production Flow**:
  - Implemented automatic job card generation upon clicking "Start Production" for orders.
  - Multi-card support: Tags containing multiple paper components (e.g. 2-piece or 3-piece tag sets) automatically generate separate job cards for each individual paper component.
  - Standard 5-Step Production Cycle implemented with step progression:
    1. **Paper Cutting**: Guillotine sizing & trim recording.
    2. **Printing**: Offset/digital press ink application with operator tracking.
    3. **Punching & Packing**: Die-cutting, creasing & stripping.
    4. **Handwork Process**: Piece-rate Dori attachment & plastic seal lock.
    5. **Dispatch**: Final verification & shipping godown packing.
  - Extensible cycle manager backed by `data/production_cycles.json` and `/api/production_cycles`, giving Admins the ability to create and select alternative production cycles.
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
  - Completely eliminated arbitrary post-sheet buffers (`+40 sheets` buffer rule removed, `bufferSheets = 0; issuedSheets = targetSheets`).
  - Added live 4-column summary metric boxes (`Net Order`, `Wastage (200/5k)`, `Total Tags`, `Issued Sheets`) in both the Job Card Creation modal and active Production Flow view.
  - Set minimum allowed floor threshold to `Math.ceil(orderQty / ups)` to guarantee order fulfillment before proceeding.
- **Paper Catalog Refinements & 30 Real Papers Preserved**:
  - Increased typography size and readability in the Catalog Grid.
  - Standardized paper naming convention to `Paper #01`, `Paper #02`, etc., replacing `Cat#103`.
  - Removed redundant `Recommended Application` field from paper forms and cards.
  - Preserved all 30 actual papers in catalog.

---

## [2026-10-28] — Version 2.8

### 🔒 Locked Table Column Layout (Frozen Width Invariance on Search & Filter)
- **Root Cause Resolution**:
  - Identified that standard HTML tables default to `table-layout: auto`, which dynamically recalculates all column widths based on the visible cell contents of the currently filtered rows. When filtering down to orders with shorter status badges, the browser collapsed the Status column from ~222px to 145px and dumped 77px of excess width into the `Brand & Item Specs` column.
- **Fixed Table Layout & Colgroup Implementation**:
  - Implemented `table-fixed` (`table-layout: fixed`) and explicit `<colgroup>` definitions on both Admin Portal and Customer Portal order registers.
  - Frozen widths: Checkbox (`44px`), Order ID (`130px`), Artwork (`84px`), Customer Name (`150px`), Dori & Plastic (`150px`), Qty (`95px`), Rate & Total (`135px`), Status (`230px`), and `Brand & Item Specs` (`auto`).
  - Guaranteed by CSS specification that `table-layout: fixed` determines column geometry exclusively from the first row / colgroup and never alters column widths when row counts or cell contents change during search and filtering.
- **Automated Verification**:
  - Verified across multiple live scenarios (all 24 orders, 1 order filtered by rate, filtered by brand specs, 0 matching orders) via headless browser automation, confirming exact pixel-for-pixel invariant column widths.

### 📊 Admin Order Register Layout Optimization (Separate Qty, Rate & Merged Total)
- **Dedicated Quantity Column (`QTY`)**:
  - Extracted order item quantities from the congested "Brand & Item Specs" column into a dedicated right-aligned table column.
  - Displays primary item piece count in bold monospace typography (`10,000 pcs`) along with batch aggregate totals for multi-item orders.
  - Added dedicated individual column search input (`Filter qty...`) with real-time numeric and string matching.
- **Merged Rate & Total Column (`RATE & TOTAL`)**:
  - Merged unit price and grand total into a unified right-aligned column:
    - Primary line: Formatted unit price (`₹1.45 /pc`).
    - Secondary line: Formatted order total (`₹17,110.00`) in bold monospace.
  - Eliminated the standalone "TOTAL AMT" column, streamlining horizontal table footprint from clutter.
  - Added dedicated individual column search input (`Filter rate...`) supporting both unit price and grand total querying.
- **Compacted Order ID Column (`ORDER ID`)**:
  - Compacted column width (`w-32`) with tight monospace styling and word break wrapping.
  - Prominently showcases the customer reference badge (`MGC01`) alongside full tracking ID (`TGRS01-ORD-2026-MGC01`) and formatted creation date.
- **Cleaned Brand & Item Specs Column**:
  - Removed redundant `Qty: ... pcs • Rate: ...` text, allowing item codes, brand badges, product types, and material boards to breathe cleanly without vertical stacking conflicts.
- **Server Socket Resilience (`server.ps1`)**:
  - Configured socket `ReceiveTimeout` and `SendTimeout` (4000ms) on `HandleClient` in `server.ps1` to prevent TCP stalls from idle speculative browser connections.

---

## [2026-10-26] — Version 2.7

### 🧭 Two-Tier Navigation Architecture (Groups on Left, Sub-Tabs on Top)
- **High-Level Module Groups on Left Sidebar (`LeftSidebarStrip.js`)**:
  - Transformed the left floating white navigation strip into high-level functional groups, eliminating cluttered icon stacks:
    - **Customer Portal**: `Dashboard`, `Orders`, `Billing`, `Support` + User Profile Avatar.
    - **Admin Portal**: `Dashboard`, `Orders`, `Operations`, `Billing & Finance` + User Profile Avatar.
  - Active group indicator highlighted in solid black with subtle scale transitions and instant tooltip popovers.
- **Dynamic Group-Based Sub-Navigation on Top Bar (`CustomerPortal.js`, `AdminPortal.js`)**:
  - Eliminated the crowded 11-pill single-row top tab bar.
  - Top bar dynamically filters and displays only the sub-tabs belonging to the active group:
    - **Orders Group**: `Place Order`, `Order Register` + category breadcrumb badge (`Orders /`).
    - **Operations Group (Admin)**: `Production Flow`, `Raw Materials & Stock`, `Attendance & Payroll`, `Paper Catalogs & Types`.
    - **Billing & Finance Group (Admin)**: `All Invoices`, `Create Invoice`, `Payment Entries`, `Ledgers Hub`.
    - **Billing Group (Customer)**: `Invoice Register`, `Outstanding Ledger`, `General Ledger`.
    - **Support Group (Customer)**: `Chat with Acc Manager`.
- **Bi-Directional State Synchronization (`data.js`)**:
  - Universal mapping helper functions `getCustomerGroupForTab` and `getAdminGroupForTab` ensure seamless switching.
  - Action-driven cross-module navigation (e.g., clicking "Production Flow →" inside the Order Register or "Create Invoice") automatically updates both the Left Sidebar group highlight and the Top Bar sub-navigation tabs.

### 🔍 Admin Order Register Per-Column Search & Filtering
- **Per-Column Real-Time Search Row**:
  - Added dedicated search input fields directly beneath the table header row, establishing full feature parity with the Customer Order Register:
    - **Order ID**: Real-time filtering matching Admin ID (`TGRS25-ORD-2026-MGC07`), Customer ID (`MGC07`), or order date with inline clear `×` button.
    - **Customer Name**: Filters company name, contact person, phone, or email.
    - **Brand & Item Specs**: Matches brand name, item code, tag category, or board material.
    - **Dori & Plastic**: Filters cord fasteners and plastic bullet lock seal specifications.
    - **Total Amt / Qty**: Filters by order grand total, item quantity, or unit rate.
- **Top Filter & Status Control Bar**:
  - Added interactive Status dropdown filter with live order count metrics for every workflow stage (*All Statuses, Pending Approval, Approved, In Production, Ready / QC, Dispatched, Delivered, Rejected*).
  - Dynamic order counter badge: `{filteredAdminOrders.length} of {orders.length} Order(s)`.
  - One-click "Clear Filters" button resetting all search inputs and stage dropdown filters simultaneously.
- **Dual View Support (Table & Kanban)**:
  - Preserved both Table View and Kanban View.
  - Search queries and status filters apply in real-time across both views, ensuring Kanban boards dynamically filter their cards.
  - "Select All" bulk checkbox automatically syncs with the currently filtered order subset.

### 🔒 Multi-User Concurrency & Guaranteed Unique Dual Order IDs
- **Thread-Monitor Locked Server Endpoint (`/api/create-order`)**:
  - Implemented an atomic order creation endpoint in `server.ps1` guarded by `[System.Threading.Monitor]::Enter($ordersLock)`.
  - Solved potential race conditions and ID collisions when multiple LAN or remote users place orders simultaneously.
  - Fixed Windows PowerShell Culture-sensitive `.StartsWith([char]0xFEFF)` collation bug to ensure robust JSON parsing.
- **Atomic Dual Order ID Scheme**:
  - **Admin Format**: `TGRS{GlobalSeq}-ORD-{Year}-{CustSeq}` (*e.g., `TGRS25-ORD-2026-MGC07`*).
  - **Customer Format**: `{CustSeq}` (*e.g., `MGC07`*).
  - Built-in collision guard loops guarantee strict uniqueness across global and customer-specific sequences.
- **Client Service Layer (`DataService.createOrder`)**:
  - Submits order payloads directly to `/api/create-order`, updating client state and transitioning smoothly to the Order Register upon confirmation.

### 🏢 Admin Place Order Party Entry UX Enhancement
- **Searchable Autocomplete Party Input**:
  - Replaced legacy `<select>` dropdown in the Admin Studio with quick-clickable party chips (`[MG Creation]`, `[Aariya Creation]`, `[TagX]`, `[D Tag]`) and real-time text input matching the exact UX of the Brand Name field.
  - Floating autocomplete suggestion card shows company name, contact person, phone number, and abbreviation badge (`[MGC]`, `[ARC]`, `[TGX]`, `[DTAG]`).
  - Selecting any customer party automatically pre-fills default brand, loads historical items, saved brands, and generates the sequential order reference.

### 🧹 Stray Reference Badge Cleanup & Database Migration
- **Cleaned Leftover MGC01 References**:
  - Removed stray `MGC01` badges from the studio header bar, item code preview lines, and job tickets across both Customer and Admin portals.
- **Standardized Customer Abbreviations & Historical Migration**:
  - Standardized customer abbreviations (`MGC`, `ARC`, `TGX`, `DTAG`) in `users.json`.
  - Migrated all historical dummy orders in `orders.json` to the dual ID format and synchronized all cross-references across `invoices.json`, `production.json`, `payments.json`, `estimates.json`, `messages.json`, and `payroll.json`.

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
