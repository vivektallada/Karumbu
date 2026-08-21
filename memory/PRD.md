# KARUMBU — Sugarcane Panakam Website

## Original Problem Statement
"hey can you create me a website for sugarcane panakam product can you create me a website i 3d"

User choices: full multi-page website (home, story, products, contact); 3D sugarcane field/farm scene with the product in front; order/enquiry form that saves messages (name, phone, quantity); brand name and look delegated to us.

## Brand & Art Direction
- Brand: KARUMBU (Tamil for sugarcane) — premium artisanal South Indian sugarcane panakam.
- Dark organic theme: deep green-black #0A100C, jaggery amber #C86A23, cream #F4EBE1.
- Fonts: Cormorant Garamond (headings) + Outfit (body). Design system: /app/design_guidelines.json.

## Architecture
- Frontend: React (CRA + craco), react-router-dom v7, Tailwind, framer-motion (masked line reveals, scroll reveals), lenis (smooth scroll), three + @react-three/fiber + @react-three/drei (3D hero), sonner toasts.
- Backend: FastAPI + Motor (MongoDB), routes under /api.
- Pages: / (Home), /story, /products, /contact.

## User Personas
- Retail customer discovering the brand and placing a bottle order enquiry.
- Bulk/festival buyer (cases of 12+) enquiring via the form.

## Core Requirements (static)
1. Multi-page marketing site with award-level editorial design.
2. Interactive 3D hero: sugarcane field scene with floating glass of panakam (mouse parallax, swaying stalks).
3. Products served from backend API.
4. Order/enquiry form (name, phone, product, quantity, message) persisted to MongoDB.
5. Product pre-selection via query param (/contact?product=slug).

## Implemented (2026-08-20)
- 3D hero: R3F scene — 60 swaying stylized cane stalks, floating glass with amber liquid + cane stirrer, warm sunset lighting, fog, contact shadows, mouse-parallax camera rig.
- Home: kinetic masked-line headline, editorial marquee, story-preview bento, product spotlight (API-driven), CTA band.
- Story: typographic hero, manifesto statement, numbered chapters 01/02/03 with ghost outline numerals and alternating imagery.
- Products: 3 variants (Classic Karumbu ₹99, Sukku Malli ₹129, Elakkai Rose ₹149) from GET /api/products, 1px-border grid, Add to Order deep-links.
- Contact: 2-col layout, form posts to POST /api/enquiries (validated, saved to db.enquiries), success/error toasts, query-param product preselect.
- Backend endpoints: GET /api/, GET /api/products, POST /api/enquiries, GET /api/enquiries.
- Glassmorphism fixed navbar (desktop + animated mobile menu), footer, grain overlay, lenis momentum scrolling, custom scrollbar/selection.

## Implemented (2026-08-21)
- Admin auth: JWT email/password login (POST /api/auth/login, GET /api/auth/me), bcrypt hashing, admin seeded idempotently on startup from ADMIN_EMAIL/ADMIN_PASSWORD env.
- Private Enquiries Dashboard at /admin (login at /admin/login): stats (total, awaiting reply, bottles requested), enquiry cards with status badges, mark contacted/done, delete, refresh, logout. GET/PATCH/DELETE /api/enquiries protected by Bearer token; POST /api/enquiries stays public for customers.
- 3D glass realism upgrade: transmissive liquid with depth, 3 floating ice cubes, 46 condensation droplets tracking the glass taper, clearcoat glass walls, meniscus surface disc, capped cane stirrer.

## Verified
- curl: all 4 endpoints OK; enquiry round-trip persisted (2 test enquiries in DB).
- e2e screenshots: hero 3D render, products grid (3 cards), story chapters, contact form submit → toast "Enquiry received", DB confirmed.

## Backlog
- P0: none.
- P1: WhatsApp order button; real product photography; enquiry email notifications (Resend).
- P2: GLTF bottle model for the hero; scroll-scrubbed 3D (bottle pours as you scroll); multi-language (Tamil) toggle; payment/checkout; admin analytics.

## Next Tasks
1. WhatsApp deep-link ordering.
2. Replace primitive glass with a modeled GLTF bottle.
3. Email notification to admin on new enquiry.
