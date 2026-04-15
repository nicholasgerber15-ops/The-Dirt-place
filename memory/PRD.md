# The Dirt Place - Product Requirements Document

## Original Problem Statement
Build a fully functioning, animated, responsive website for "The Dirt Place," a landscape material yard in Boerne, Texas. The design style blends rugged construction-yard texture with clean, modern UI. Include parallax effects, smooth micro-interactions, scroll-triggered animations, and subtle motion throughout the site. The site must feel premium, bold, and professionally crafted.

## Brand Identity
**Colors:**
- Dark Soil: #3B2F2F
- Clay Brown: #6B4F3F
- Sand Beige: #FAF9F6
- Olive Green: #6B7A3A
- Accent Gold: #D9A441

**Typography:**
- Headings: Bebas Neue
- Subheadings: Montserrat SemiBold
- Body: Montserrat Regular

**Business Information:**
- Name: The Dirt Place
- Address: 240 TX-46, Boerne, TX 78006
- Phone: (830) 555-0198
- Email: info@thedirtplace.com
- Hours: Mon-Fri 8 AM - 5 PM, Sat 8 AM - 3 PM, Sun Closed
- Map Coordinates: 29.789870, -98.702540

## Core Features

### 1. Three-Page Website Structure
- **Homepage**: Hero section with parallax, materials preview grid, delivery info, about section, testimonials
- **Materials Page**: Full materials catalog with detailed cards, quality assurance section
- **Contact Page**: Contact form, business info, Google Maps embed

### 2. Design Requirements
- Rugged + modern aesthetic blend
- Parallax scrolling effects
- Scroll-triggered animations (fade-in, slide-in, scale-in)
- Sticky header with shrink-on-scroll animation
- Hover states with gold accent and lift effects
- Micro-interactions on all interactive elements
- Responsive grid layouts
- High contrast, accessible color combinations

### 3. Materials Catalog
Six materials featured:
1. Topsoil - Premium garden soil
2. Gravel - Driveway and pathway material
3. Sand - Construction and landscaping sand
4. Road Base - Crushed limestone
5. Mulch - Natural wood chips
6. Decorative Rock - Landscape stones

## What's Been Implemented (Phase 1 - Frontend Mock)

**Date: December 2025**

### ✅ Completed
1. **Page Structure**
   - HomePage.jsx with hero, materials grid, delivery section, about, testimonials
   - MaterialsPage.jsx with materials catalog and quality assurance
   - ContactPage.jsx with form, business info, and map embed

2. **Components**
   - Header.jsx - Sticky header with shrink animation and mobile menu
   - Footer.jsx - Three-column layout with links, contact info, social icons
   - MaterialCard.jsx - Reusable material card with hover effects

3. **Design Implementation**
   - Google Fonts integration (Bebas Neue, Montserrat)
   - Custom color palette applied throughout
   - Parallax scrolling on hero sections
   - Scroll-triggered animations
   - Smooth transitions and micro-interactions
   - Responsive design for all screen sizes

4. **Animations**
   - Hero section parallax effect
   - Dust particle animation overlay
   - Scroll indicator animation
   - Card hover effects with scale and shadow
   - Button hover effects with lift and color change
   - Fade-in animations for sections
   - Material card staggered entrance animations

5. **Mock Data**
   - Mock.js with all materials, delivery info, business info, testimonials
   - Contact form with mock submission (displays success message)

6. **Navigation**
   - React Router setup with three routes
   - Header navigation with active state
   - Mobile-responsive menu

## Prioritized Backlog

### P0 Features (Next Phase - Backend Integration)
1. **Contact Form Backend**
   - Integrate Resend API for email delivery
   - Create `/api/contact` endpoint
   - Email validation and error handling
   - Success/failure notifications

2. **Backend Setup**
   - FastAPI endpoints for contact form
   - MongoDB storage for contact submissions (optional)
   - Environment variable configuration
   - CORS setup

### P1 Features (Enhancement)
1. **Analytics Integration**
   - Google Analytics or similar
   - Track form submissions and page views

2. **SEO Optimization**
   - Meta tags implementation
   - Sitemap generation
   - Schema markup for local business

3. **Performance Optimization**
   - Image optimization and lazy loading
   - Code splitting
   - CDN integration

### P2 Features (Future Considerations)
1. **Content Management**
   - Admin panel for materials management
   - Dynamic pricing updates

2. **Advanced Features**
   - Material calculator
   - Delivery zone checker
   - Online ordering system

## API Contracts (To Be Implemented)

### Contact Form Submission
**Endpoint:** `POST /api/contact`

**Request Body:**
```json
{
  "name": "string",
  "phone": "string",
  "email": "string",
  "material": "string (optional)",
  "message": "string"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "Thank you - we'll contact you shortly."
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Error message details"
}
```

### Integration Requirements
- **Resend API**: For email delivery
  - API key required from user
  - Email templates to be created
  - From email: configured via Resend dashboard

## Next Tasks
1. Get Resend API key from user
2. Call integration_playbook_expert_v2 for Resend integration
3. Implement backend contact form endpoint
4. Connect frontend form to backend API
5. Test end-to-end contact form flow
6. Update contact form success/error handling

## Current Mock Data in Frontend
- All materials data in `/app/frontend/src/data/mock.js`
- Contact form submission is mocked (setTimeout simulation)
- No backend API calls yet

## Notes
- Frontend is fully functional with animations and interactions
- All design requirements met
- Ready for backend integration
- Google Maps uses iframe embed (no API key needed)
