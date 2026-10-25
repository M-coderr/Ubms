# uBMS — Unified Business & Order Management System

**uBMS** is a specialized, lightweight enterprise Order Management System (OMS) built for hangtag, price tag, woven label, and garment accessories manufacturing units. It coordinates the complete manufacturing lifecycle—from customer artwork submission and interactive cropping to paper catalog management, sheet-allocation production planning, operator piece-rate tracking, invoicing, and dual ledgers.

---

## Key Highlights

- **Two-Tier Navigation Hierarchy**: Structured two-level navigation across Customer and Admin portals—Level 1 Module Groups on the slim Left Sidebar Strip (`LeftSidebarStrip.js`) and Level 2 Dynamic Sub-Navigation on the Top Bar.
- **Dual-Portal Architecture**: Tailored interfaces for both **Customers** (placing orders, tracking stages, viewing ledgers) and the **Internal Team** (executives, printing/punching operators, handwork laborers).
- **Multi-User Concurrency & Guaranteed Unique Dual IDs**: Thread-monitor locked atomic endpoint (`/api/create-order`) prevents race conditions, issuing dual sequential IDs: Admin format `TGRS25-ORD-2026-MGC07` and Customer format `MGC07`.
- **Per-Column Search & Register Filtering**: Full feature parity across Customer and Admin Order Registers, with dedicated per-column search inputs (`Order ID`, `Customer`, `Specs`, `Dori/Plastic`, `Amt/Qty`) and interactive status counters.
- **Manufacturing-First Production Pipeline**: Bridges order quantities in **pieces (pcs)** with manufacturing execution in **sheets**, supporting multi-card layouts, sheet calculation, and bulk promotion across pipeline stages.
- **In-Browser Artwork Studio**: Live artwork cropping with industry-standard hangtag aspect ratios (2:3 standard, 1:1 square, 1:2 slim tag, 3:4 card tag), zoom, rotate, and pan.
- **Zero-Dependency Lightweight Stack**: Runs pure React 18 and Tailwind CSS directly in the browser via a standalone PowerShell HTTP server (`server.ps1`) with flat-file JSON persistence—no heavy Node/npm runtime required.
- **Enterprise Minimalist Aesthetic**: Designed with an off-white Warm Ivory Paper Linen palette (`#F9F8F5`), crisp slate-900 typography, semantic status badges, and an emoji-free professional UI.

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              uBMS Frontend                             │
│                  (React 18 + Babel + Tailwind CSS CDN)                 │
├───────────────────────────────────┬────────────────────────────────────┤
│          Customer Portal          │            Admin Portal            │
│  • Level 1 Groups (Left Strip)    │  • Level 1 Groups (Left Strip)     │
│    - Dashboard                    │    - Dashboard                     │
│    - Orders (Studio & Register)   │    - Orders (Studio & Register)    │
│    - Billing (Invoices & Ledgers) │    - Operations (Production/Stock) │
│    - Support (Account Chat)       │    - Billing & Finance (Invoices)  │
│  • Level 2 Dynamic Top Sub-Nav    │  • Level 2 Dynamic Top Sub-Nav     │
│  • In-Browser Artwork Cropper     │  • Kanban & Order Register Search  │
│  • Order Status & Live Timeline   │  • Production Pipeline (Sheets/Pcs)│
│  • Aging Outstanding Ledger       │  • Paper Catalog & Inventory       │
│  • General Ledger (Debit/Credit)  │  • Piece-Rate Payroll & Attendance │
└───────────────────────────────────┴────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PowerShell REST Server (server.ps1)                  │
│       Listens on: http://localhost:8080/ • Thread-Monitor Concurrency  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       JSON Flat-File Persistence                       │
│    orders.json • users.json • inventory.json • catalogs.json • etc.    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Role-Based Personas

uBMS comes pre-configured with operational team members and customer accounts:

### Internal Team
| Name | Role / Title | Department | Primary Responsibilities |
|---|---|---|---|
| **Meet** | Super Admin | Executive Management | Full platform control, business KPIs, user management |
| **Parth** | Admin | Operations & Management | Order approvals, paper allocation, dispatch scheduling |
| **Niraj** | Admin | Operations & Management | Pricing approvals, invoicing, customer accounts |
| **Kanu** | Printing Operator | Printing Unit | Machine queue, sheet loading, offset/digital press tracking |
| **Shivakant** | Punching Operator | Punching & Packing | Die-punching, card cutting, QC sheet verification |
| **Sumit** | Dori Plastic | Handwork & Assembly | Dori attachment, plastic lock fitting, piece-rate tracking (₹0.30/tag) |

### Customer Accounts
| Contact Person | Firm / Brand | Abbreviation | Typical Products |
|---|---|---|---|
| **Mohit Samnani** | MG Creation | `MGC` | Premium clothing hangtags, luxury card tags |
| **Umesh Sonaiya** | Aariya Creation | `ARC` | Ethnic wear tags, woven labels |
| **Parth Thakkar** | TagX | `TGX` | Fast-fashion labels, price stickers |
| **Niraj Dalwani** | D Tag | `DTAG` | Garment badges, booklet tags |

---

## Core Features & Workflow

### 1. Two-Tier Navigation Hierarchy
- **Level 1 (Left Floating Strip)**: Displays high-level functional groups (`Dashboard`, `Orders`, `Operations`, `Billing`, `Support`) with active state tooltips and profile selector.
- **Level 2 (Top Navigation Bar)**: Dynamically renders only the sub-navigation tabs belonging to the selected group, eliminating clutter and horizontal overflow.

### 2. Customer Ordering & Artwork Processing
- **Production Order Studio (Bespoke Manufacturing UI)**: A focused, distraction-free manufacturing order studio divided into a Production Specification Sheet (~58%) and Visual Proof Canvas & Job Ticket (~42%). Features run type switcher (`+ New Design Order` vs `&#8635; Repeat Past Item`), searchable past item autocomplete with floating cards, customer saved brand chips with auto-assigned references, multi-card piece format, master paper board selector, handwork fastener configuration (Dori & Barcode Plastic Seal), volume presets (`1k/2.5k/5k/10k`), prepress silhouette dropzone with 3mm drill-hole simulator, live job ticket, and instant transition to the Order Register upon booking.
- **In-Browser Image Cropping**: Interactive cropping tool with presets (`2:3`, `1:1`, `1:2`, `3:4`), rotate 90°, zoom, and drag-to-pan.
- **Approval Lifecycle**: Orders submitted by customers enter `pending_approval` status before committing raw materials.

### 3. Manufacturing & Production Floor
- **Pieces to Sheets Conversion**: Orders measured in pieces are automatically scheduled by allocating required sheet quantities (e.g. 500 sheets of 300 GSM Art Card for 12,000 tags).
- **Multi-Card Handling**: Manage multi-card gang runs where multiple tag designs share a common print run.
- **Bulk Production Movement**: Batch move multiple approved orders into printing with one click.
- **Stage Pipeline**: `Queued` -> `Printing` -> `Punching` -> `Dori / Plastic` -> `Ready for Dispatch` -> `Delivered`.

### 4. Inventory & Paper Catalog
- Complete tracking of master sheet stocks (e.g. 18x23, 20x30, 23x36), GSM (250, 300, 350, 400), finishes (Gloss, Matte, Velvet), and reel inventory.
- Real-time stock alerts and reorder thresholds.

### 5. Billing, Ledgers & Payroll
- **Invoicing**: Generate printable A4 commercial invoices with item breakdown, customer details, and delivery terms.
- **Outstanding Aging Ledger**: Categorizes unpaid receivables into `0-30 Days`, `31-60 Days`, and `60+ Days Overdue`.
- **General Ledger**: Complete double-entry style journal (Debit, Credit, Running Balance) for each account.
- **Piece-Rate Payroll**: Automatic calculation of wages for handwork laborers based on units processed.

---

## Project Structure

```
Ubms/
├── index.html                   # Application entry point & React mounting root
├── server.ps1                   # Local PowerShell HTTP & REST API daemon (with mutex lock)
├── README.md                    # Project documentation & reference
├── STATUS.md                    # Living project status, roadmap, & commit logs
├── LOG.md                       # Comprehensive reverse-chronological development log
├── css/
│   └── styles.css               # Theme overrides, custom scrollbars, printing styles
├── js/
│   ├── app.js                   # Root React orchestrator & state manager (v2.7 beta)
│   ├── data.js                  # Navigation groups, mock seed & state persistence helpers
│   └── components/
│       ├── Header.js            # Global navigation & persona switcher
│       ├── LeftSidebarStrip.js  # Level 1 Module Group navigation strip
│       ├── DashboardV18.js       # Video-replica executive metrics dashboard
│       ├── AdminPortal.js       # Full enterprise administrative back-office
│       ├── CustomerPortal.js    # Client-facing ordering, tracking, & ledgers
│       ├── ImageCropModal.js    # In-browser artwork frame & crop tool
│       └── InvoiceModal.js      # Printable commercial invoice component
├── data/                        # JSON flat-file data persistence
│   ├── catalogs.json
│   ├── estimates.json
│   ├── inventory.json
│   ├── invoices.json
│   ├── label_types.json
│   ├── messages.json
│   ├── orders.json
│   ├── payments.json
│   ├── payroll.json
│   ├── production.json
│   ├── products.json
│   └── users.json
└── lib/                         # Bundled offline libraries (no node_modules needed)
    ├── react.min.js             # React 18 core
    ├── react-dom.min.js         # React DOM renderer
    └── babel.min.js             # In-browser JSX transpiler
```

---

## Getting Started

### Prerequisites
- Windows 10/11 with **PowerShell 5.1+** or **PowerShell Core 7+**
- Any modern web browser (Chrome, Edge, Firefox, Brave)

### Running the Local Server
From the project root directory, run:

```powershell
powershell -ExecutionPolicy Bypass -File server.ps1
```

Once running, access the portal at:
- **Local Browser**: [http://localhost:8080/](http://localhost:8080/)
- **LAN Devices**: `http://<YOUR_LAN_IP>:8080/`

---

## Maintenance & Contribution Policy

> [!IMPORTANT]
> **Mandatory Update on Push**: For every future Git push, `README.md`, `STATUS.md`, and `LOG.md` **must be updated** to reflect any newly implemented features, fixed bugs, architectural adjustments, or updated milestone progress.

For the detailed date-wise changelog of all revisions, see [LOG.md](LOG.md).
