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

## Implemented (2026-08-21, round 2)
- WhatsApp ordering: wa.me deep links to +91 9121744996 with pre-filled per-product messages on every product card (Products page), contact page CTA, and footer chat link. Helper: src/lib/wa.js.
- Order email alerts: Emergent-managed Resend proxy (EMERGENT_EMAIL_KEY, EMAIL_FROM_NAME=KARUMBU, NOTIFY_EMAIL=karumbu09@gmail.com); fire-and-forget asyncio task on POST /api/enquiries with guardrail gate (_assert_safe_email) and server-side branded HTML template. Verified: 202 Accepted, email id returned.
- Pour-on-scroll hero: copper jug hovers over the glass, tilts and pours a panakam stream as the visitor scrolls the first viewport; liquid level rises 25%→100%, ice cubes surface near full, condensation appears at full, jug fades out, camera dollies in. Driven by scrollRef progress from window scroll.
- Contact details updated to real ones: karumbu09@gmail.com, +91 91217 44996.

## Implemented (2026-08-21, round 3)
- File & media storage: Emergent object storage via integration proxy (init at startup, EMERGENT_LLM_KEY auth, app prefix "karumbu/").
- Admin product photo uploads: "Product Photos" section on /admin — per-product preview (custom vs stock), upload (JPEG/PNG/WebP/GIF, max 8 MB), remove/revert to stock.
- Backend: POST/DELETE /api/products/{slug}/image (admin-only), GET /api/files/{path} public serving with soft-delete checks, GET /api/products merges uploaded images over stock URLs (custom_image flag). product_images MongoDB collection with is_deleted soft-delete.
- Uploaded photos power Products page cards and Home spotlight thumbnails automatically (mediaUrl helper prefixes backend URL).

## Implemented (2026-08-21, round 4)
- Claude AI integration (anthropic/claude-sonnet-4-6 via emergentintegrations LlmChat + EMERGENT_LLM_KEY): admin reply drafter.
- POST /api/enquiries/{id}/draft-reply (admin-only) streams a warm South Indian host-voiced WhatsApp reply draft over SSE (X-Accel-Buffering: no), with enquiry context + computed price total; WhatsApp-native *bold* formatting.
- Admin UI: "Draft Reply" button per enquiry, live streaming draft box with cursor, Copy button, "Send on WhatsApp" deep link pre-addressed to the customer's phone with the drafted text (waLinkTo helper).

## Implemented (2026-08-21, round 5)
- Admin analytics section on /admin (recharts): "What sells — by brew" bar chart (enquiries + bottles per brew, brand colors, dark tooltips) and "Enquiries by week" area chart (weeks starting Monday). Computed client-side from the enquiries list — no new endpoints.

## Verified
- curl: all 4 endpoints OK; enquiry round-trip persisted (2 test enquiries in DB).
- e2e screenshots: hero 3D render, products grid (3 cards), story chapters, contact form submit → toast "Enquiry received", DB confirmed.

## Backlog
- P0: none.
- P1: Real product photography; customer-facing order confirmation email.
- P2: GLTF bottle model for the hero; multi-language (Tamil) toggle; payment/checkout; admin analytics.

## Next Tasks
1. Replace primitive glass with a modeled GLTF bottle.
2. Customer order-confirmation email on enquiry.
3. Admin analytics (enquiries per product/week).
