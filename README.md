<div align="center">

# 🛒 Product Catalog REST API

### A production-grade, multi-role backend built with Node.js, Express 5 & MySQL

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-v5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![Sequelize](https://img.shields.io/badge/Sequelize-v6-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)](https://sequelize.org)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

<br/>

> A fully-featured **RESTful API** with three independent authentication contexts, bulk Excel import, image management, a real-time enquiry system, and security best practices baked in from day one.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Authentication Flow](#-authentication-flow)
- [Bulk Import Guide](#-bulk-import-guide)
- [Database Schema](#-database-schema)
- [Running in Production](#-running-in-production)
- [Contributing](#-contributing)

---

## 🔍 Overview

This project is a **scalable backend API** for a product catalog platform - vehicle parts, SKUs, and inventory - designed to serve three distinct user roles: **Admins**, **End Users**, and **Internal Staff**.

Key design principles followed throughout:

- ✅ **Separation of concerns** - Controllers → Services → Models (no business logic in routes)
- ✅ **Role-isolated authentication** - Three separate JWT secrets and middleware stacks
- ✅ **Fail-safe data ingestion** - Excel files are validated before import, not after
- ✅ **Production-ready logging** - Winston for structured logs, Morgan for HTTP request trails
- ✅ **Defensive security** - Helmet headers, CORS, rate limiting, bcrypt, Joi validation on every endpoint

---

## ✨ Features

<table>
<tr>
<td>

**🔐 Authentication & Security**
- Multi-role JWT (Admin / User / Internal)
- Refresh token rotation with cookie storage
- OTP-based password reset via email
- bcrypt password hashing
- Helmet HTTP security headers
- Rate limiting & CORS protection

</td>
<td>

**📦 Product Catalog**
- Full CRUD for Products, Makes & Categories
- FULLTEXT search on keywords & reference codes
- Bulk status updates across multiple records
- Slug generation for SEO-friendly URLs
- Product reference code linking

</td>
</tr>
<tr>
<td>

**📥 Bulk Data Operations**
- Download Excel template for import
- Pre-import validation (returns row-level errors)
- Bulk product import via `.xlsx` / `.xls`
- Bulk keyword import
- Bulk image upload with missing image reports
- Excel reports for product image coverage

</td>
<td>

**👥 User-Facing Features**
- User registration, login & profile management
- Favorites system (add, remove, bulk remove, count)
- Product enquiry submission & tracking
- Admin enquiry management with stats
- File upload (single & multi, up to 10 files)
- Admin dashboard statistics endpoint

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js 18+ | JavaScript server runtime |
| **Framework** | Express.js v5 | HTTP server & routing |
| **Database** | MySQL 8 | Relational data storage |
| **ORM** | Sequelize v6 | Database modelling & queries |
| **Auth** | jsonwebtoken | Access & refresh token signing |
| **Security** | bcryptjs | Password hashing |
| **Validation** | Joi | Request body & param schemas |
| **File Uploads** | Multer v2 | Multipart form handling |
| **Excel** | ExcelJS | Bulk import / export |
| **Email** | Nodemailer | OTP & transactional email |
| **Logging** | Winston + Morgan | Structured logs + HTTP access logs |
| **Security Headers** | Helmet | HTTP response header hardening |
| **Rate Limiting** | rate-limit-express | Brute-force protection |
| **Dev Server** | Nodemon | Hot reload during development |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Client (HTTP Request)                    │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                     Express.js App                            │
│   ┌──────────────────────────────────────────────────────┐   │
│   │  Global Middleware Stack                              │   │
│   │  cookie-parser → helmet → morgan → cors →            │   │
│   │  body-parser → rate-limiter                          │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                               │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │  /admin  │  │  /user   │  │/internal │  │  /file   │   │
│   │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │   │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│        │              │              │              │          │
│   ┌────▼──────────────▼──────────────▼──────────────▼─────┐  │
│   │          Auth / Role Middleware (JWT Verify)           │  │
│   └────────────────────────┬───────────────────────────────┘  │
│                            │                                   │
│   ┌────────────────────────▼───────────────────────────────┐  │
│   │              Controllers (Request → Response)           │  │
│   └────────────────────────┬───────────────────────────────┘  │
│                            │                                   │
│   ┌────────────────────────▼───────────────────────────────┐  │
│   │          Services (Business Logic Layer)                │  │
│   └────────────────────────┬───────────────────────────────┘  │
│                            │                                   │
│   ┌────────────────────────▼───────────────────────────────┐  │
│   │          Sequelize Models (ORM Layer)                   │  │
│   └────────────────────────┬───────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                      MySQL Database                           │
│              (Connection Pool: max 5 connections)             │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
src/
├── app.js                          # Express setup, middleware stack, route mounting
├── server.js                       # Entry point - DB sync + server start
│
├── config/
│   ├── db.js                       # Sequelize + MySQL connection pool + SSL support
│   ├── jwt.js                      # JWT config constants
│   ├── logger.js                   # Winston logger (file + console transports)
│   └── multer.js                   # Multer disk storage configuration
│
├── models/                         # Sequelize model definitions
│   ├── index.js                    # Associations (hasMany, belongsTo, etc.)
│   ├── userModel.js
│   ├── adminModel.js
│   ├── productModel.js             # FULLTEXT indexed on keyword + ref_code
│   ├── categoryModel.js
│   ├── makeModel.js
│   ├── enquiryModel.js
│   ├── favoriteProductModel.js
│   ├── fileModel.js
│   ├── refreshToken.js
│   └── otpModel.js
│
├── controllers/                    # Thin layer - validates input, calls service, returns response
│   ├── admin/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── userController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── makeController.js
│   │   ├── bulkImportController.js
│   │   ├── imageImportController.js
│   │   └── adminEnquiryController.js
│   ├── userController.js
│   ├── internalUserController.js
│   ├── favoriteProductController.js
│   ├── userEnquiryController.js
│   └── fileController.js
│
├── services/                       # All business logic lives here
│   ├── adminService.js
│   ├── userService.js
│   ├── productService.js
│   ├── categoryService.js
│   ├── makeService.js
│   ├── enquiryService.js
│   ├── favoriteProductService.js
│   ├── bulkImportService.js        # Excel parsing, row validation, DB insertion
│   ├── imageImportService.js       # Image matching, bulk upload, report generation
│   ├── dashboardService.js
│   ├── emailService.js             # Nodemailer OTP dispatch
│   └── fileService.js
│
├── routes/
│   ├── admin/
│   │   ├── index.js                # Mounts auth, dashboard, users, catalog, enquiry
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── user.js
│   │   ├── product.js              # Makes, Categories, Products, Bulk Import, Images
│   │   └── adminEnquiryRoutes.js
│   ├── userRoutes.js
│   ├── internalUserRoutes.js
│   ├── favoriteRoutes.js
│   ├── userEnquiryRoutes.js
│   └── fileRoutes.js
│
├── middlewares/
│   ├── authMiddleware.js           # Verifies user JWT (cookie + Bearer header fallback)
│   ├── adminMiddleware.js          # Verifies admin JWT
│   ├── internalAuthMiddleware.js   # Verifies internal user JWT
│   ├── roleMiddleware.js           # Role-based access control
│   ├── isAdminOrUser.js            # Shared admin+user route guard
│   ├── validateMiddleware.js       # Joi schema runner
│   └── errorMiddleware.js          # Global error handler (4xx / 5xx)
│
├── validators/                     # Joi schemas - one file per domain
│   ├── productSchemas.js
│   ├── userProperty.js
│   ├── admin.js
│   ├── favoriteSchemas.js
│   └── enquirySchemas.js
│
└── utils/
    ├── apiResponse.js              # successResponse() / errorResponse() helpers
    ├── slug.js                     # slugify wrapper
    └── validation.js              # Shared validation helpers
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MySQL** v8+
- **npm** v9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/product-catalog-api.git
cd product-catalog-api

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Open .env and fill in your values (see section below)

# 4. Start the development server
npm run dev
```

The server starts on `http://localhost:5000` by default.

---

## 🔧 Environment Variables

Create a `.env` file at the root of the project:

```env
# ── Server ────────────────────────────────
PORT=5000
NODE_ENV=development          # development | production

# ── Database ──────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_NAME=product_catalog_db
DB_USER=root
DB_PASSWORD=your_password
DB_SSL=false                  # Set to true for cloud databases

# ── JWT Secrets (keep these long & random) ──
JWT_USER_SECRET=your_user_jwt_secret_key
JWT_ADMIN_SECRET=your_admin_jwt_secret_key
JWT_INTERNAL_SECRET=your_internal_jwt_secret_key

# ── Token Expiry ──────────────────────────
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Email (Nodemailer) ────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# ── Sync DB (development only) ────────────
SHOULD_SYNC=false             # Set to true to run sequelize.sync({ alter: true })
```

> ⚠️ Never commit your `.env` file. Add it to `.gitignore`.

---

## 📡 API Reference

Base URL: `http://localhost:5000/api`

### 🧑‍💼 Admin - Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `POST` | `/admin/auth/login` | Admin login → returns access + refresh token | - |
| `POST` | `/admin/auth/logout` | Invalidate refresh token | 🔒 |
| `GET` | `/admin/auth/me` | Get current admin profile | 🔒 |
| `POST` | `/admin/auth/change-password` | Update admin password | 🔒 |
| `POST` | `/admin/auth/refresh-token` | Rotate access token | - |
| `POST` | `/admin/auth/create` | Create new admin account | - |

### 📊 Admin - Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/admin/dashboard` | Aggregated platform statistics | 🔒 |

### 👥 Admin - User Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/admin/users` | List all users (paginated) | 🔒 |
| `GET` | `/admin/users/:id` | Get single user | 🔒 |
| `POST` | `/admin/users` | Create user | 🔒 |
| `PUT` | `/admin/users/:id` | Update user | 🔒 |
| `DELETE` | `/admin/users/:id` | Delete user | 🔒 |
| `DELETE` | `/admin/users/bulk` | Bulk delete users | 🔒 |
| `PATCH` | `/admin/users` | Bulk update users | 🔒 |

### 🏷️ Admin - Makes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/admin/catalog/makes` | Paginated list with search | 🔒 |
| `GET` | `/admin/catalog/makes/active` | Active makes (for dropdowns) | 🔒 |
| `GET` | `/admin/catalog/makes/:id` | Get by ID | 🔒 |
| `POST` | `/admin/catalog/makes` | Create | 🔒 |
| `PUT` | `/admin/catalog/makes/:id` | Update | 🔒 |
| `DELETE` | `/admin/catalog/makes/:id` | Delete | 🔒 |
| `POST` | `/admin/catalog/makes/bulk-delete` | Bulk delete | 🔒 |
| `POST` | `/admin/catalog/makes/bulk-update-status` | Bulk toggle status | 🔒 |

### 📂 Admin - Categories
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/admin/catalog/categories` | Paginated list with search | 🔒 |
| `GET` | `/admin/catalog/categories/active` | Active categories (for dropdowns) | 🔒 |
| `GET` | `/admin/catalog/categories/:id` | Get by ID | 🔒 |
| `POST` | `/admin/catalog/categories` | Create | 🔒 |
| `PUT` | `/admin/catalog/categories/:id` | Update | 🔒 |
| `DELETE` | `/admin/catalog/categories/:id` | Delete | 🔒 |
| `POST` | `/admin/catalog/categories/bulk-delete` | Bulk delete | 🔒 |
| `POST` | `/admin/catalog/categories/bulk-update-status` | Bulk toggle status | 🔒 |

### 📦 Admin - Products
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/admin/catalog/products` | Paginated list + filters + FULLTEXT search | 🔒 |
| `GET` | `/admin/catalog/products/:id` | Full product detail with images | 🔒 |
| `GET` | `/admin/catalog/products/ref/:refCode` | Products by reference code | 🔒 |
| `POST` | `/admin/catalog/products` | Create product | 🔒 |
| `PUT` | `/admin/catalog/products/:id` | Update product | 🔒 |
| `DELETE` | `/admin/catalog/products/:id` | Delete product | 🔒 |
| `POST` | `/admin/catalog/products/bulk-delete` | Bulk delete | 🔒 |
| `POST` | `/admin/catalog/products/bulk-update-status` | Bulk toggle status | 🔒 |

### 📥 Admin - Bulk Import & Images
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/admin/catalog/import/template` | Download Excel template | - |
| `POST` | `/admin/catalog/import/validate` | Validate file (no DB write) | 🔒 |
| `POST` | `/admin/catalog/import/products` | Bulk import products from Excel | 🔒 |
| `POST` | `/admin/catalog/import/keywords` | Bulk import keywords | 🔒 |
| `POST` | `/admin/catalog/images/check-missing` | Report missing product images | 🔒 |
| `POST` | `/admin/catalog/images/bulk-upload` | Bulk upload images for all products | 🔒 |
| `POST` | `/admin/catalog/images/upload-specific` | Upload images for specific codes | 🔒 |
| `GET` | `/admin/catalog/images/missing-report` | Download missing images report (Excel) | - |
| `GET` | `/admin/catalog/images/product-image-report` | Full product image coverage report | - |

### 📩 Admin - Enquiries
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/admin/enquiry/stats` | Enquiry statistics summary | 🔒 |
| `GET` | `/admin/enquiry` | All enquiries with filters | 🔒 |
| `GET` | `/admin/enquiry/:enquiryId` | Single enquiry detail | 🔒 |
| `PUT` | `/admin/enquiry/:enquiryId` | Update status / priority / remarks | 🔒 |
| `DELETE` | `/admin/enquiry/:enquiryId` | Delete enquiry | 🔒 |
| `DELETE` | `/admin/enquiry/bulk` | Bulk delete enquiries | 🔒 |

---

### 👤 User - Auth & Profile
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `POST` | `/user/register` | Register new account | - |
| `POST` | `/user/login` | Login → tokens | - |
| `POST` | `/user/logout` | Logout | - |
| `POST` | `/user/refresh-token` | Rotate access token | - |
| `POST` | `/user/forgot-password` | Request OTP via email | - |
| `POST` | `/user/verify-otp` | Verify OTP code | - |
| `POST` | `/user/reset-password` | Set new password | - |
| `GET` | `/user/profile` | Get my profile | 🔒 |
| `PUT` | `/user/profile` | Update my profile | 🔒 |
| `GET` | `/user/property` | Get user properties | 🔒 |

### ❤️ User - Favorites
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `POST` | `/user/favoriteproduct` | Add product to favorites | 🔒 |
| `GET` | `/user/favoriteproduct` | List favorites (paginated) | 🔒 |
| `GET` | `/user/favoriteproduct/count` | Get favorites count | 🔒 |
| `GET` | `/user/favoriteproduct/check/:productId` | Check if favorited | 🔒 |
| `DELETE` | `/user/favoriteproduct/:productId` | Remove from favorites | 🔒 |
| `POST` | `/user/favoriteproduct/bulk-remove` | Bulk remove favorites | 🔒 |

### 📩 User - Enquiries
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `POST` | `/user/enquiry` | Submit a new enquiry | 🔒 |
| `GET` | `/user/enquiry` | My enquiry history | 🔒 |
| `GET` | `/user/enquiry/:enquiryId` | Single enquiry detail | 🔒 |

---

### 🔧 Internal User
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `POST` | `/internal/login` | Internal staff login | - |
| `POST` | `/internal/logout` | Logout | - |
| `POST` | `/internal/refresh-token` | Rotate access token | - |
| `POST` | `/internal/forgot-password` | Request OTP | - |
| `POST` | `/internal/verify-otp` | Verify OTP | - |
| `POST` | `/internal/reset-password` | Reset password | - |
| `GET` | `/internal/profile` | Get profile | 🔒 |
| `PUT` | `/internal/profile` | Update profile | 🔒 |

### 📁 File Upload
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `POST` | `/file/upload/single/:ownerType` | Single file upload | 🔒 |
| `POST` | `/file/upload/multiple/:ownerType` | Up to 10 files | 🔒 |

> 🔒 = Requires `Authorization: Bearer <token>` header or `*_token` cookie

---

## 🔐 Authentication Flow

Three **fully isolated** auth contexts - each has its own JWT secret, middleware, and token model:

```
                        ┌─────────────────────────────┐
                        │          Login              │
                        │  POST /[role]/auth/login    │
                        └──────────┬──────────────────┘
                                   │
               ┌───────────────────▼───────────────────┐
               │  Response:                             │
               │  • accessToken  (15 min, in body)      │
               │  • refreshToken (7 days, HttpOnly 🍪)  │
               └───────────────────┬───────────────────┘
                                   │
          ┌────────────────────────▼─────────────────────────┐
          │           Protected Request                        │
          │  Authorization: Bearer <accessToken>              │
          │  - or - Cookie: user_token=<accessToken>          │
          └────────────────────────┬─────────────────────────┘
                                   │
                      ┌────────────▼────────────┐
                      │  Token Expired?          │
                      └────────────┬────────────┘
                           Yes     │     No
                      ┌────────────▼──────┐    ┌───────────────┐
                      │ POST /refresh-token│    │ Request passes │
                      │ → New access token │    └───────────────┘
                      └────────────────────┘

                  ┌──────────────────────────────────────┐
                  │         Forgot Password Flow          │
                  │  1. POST /forgot-password → OTP email │
                  │  2. POST /verify-otp → validated      │
                  │  3. POST /reset-password → new pass   │
                  └──────────────────────────────────────┘
```

---

## 📥 Bulk Import Guide

1. **Download** the Excel template: `GET /api/admin/catalog/import/template`
2. **Fill** it in following this column spec:

| Column | Required | Type | Notes |
|--------|:--------:|------|-------|
| `product_code` | ✅ | String | Unique part number (primary key) |
| `name` | ✅ | String | Product display name |
| `make_id` | ✅ | Integer | Must match existing Make ID |
| `category_id` | ✅ | Integer | Must match existing Category ID |
| `mrp` | ❌ | Decimal | Maximum retail price |
| `color` | ❌ | String | Colour description |
| `keyword` | ❌ | String | Comma-separated search keywords |
| `ref_code` | ❌ | String | Comma-separated reference codes |
| `status` | ❌ | Enum | `active` / `inactive` / `out_of_stock` |

3. **Validate first** (no DB writes): `POST /api/admin/catalog/import/validate`
   - Returns row-level error messages if validation fails
4. **Import**: `POST /api/admin/catalog/import/products`
   - Max file size: **10MB**
   - Accepted formats: `.xlsx`, `.xls`

---

## 🗄️ Database Schema

```
sk_admin ──────────────────────────────────────────┐
sk_user ──────┬──────────────────────────────────┐  │
              │                                  │  │
              ▼                                  ▼  ▼
         sk_favorite_product           sk_product ◄── sk_make
         sk_enquiry                       │          sk_category
         sk_refresh_token              sk_file
         sk_otp
```

| Table | Description |
|-------|-------------|
| `sk_user` | End user accounts |
| `sk_admin` | Admin accounts |
| `sk_product` | Products (FULLTEXT indexed on `keyword`, `ref_code`) |
| `sk_category` | Product categories |
| `sk_make` | Vehicle/brand makes |
| `sk_enquiry` | Customer enquiries |
| `sk_favorite_product` | User ↔ Product favorites junction |
| `sk_file` | Uploaded file metadata (path, type, owner) |
| `sk_refresh_token` | Per-role refresh token storage |
| `sk_otp` | Time-limited OTPs for password reset |

---

## 🚢 Running in Production

```bash
# Set environment
NODE_ENV=production npm start
```

**Recommended: Use PM2 for process management**

```bash
npm install -g pm2

# Start
pm2 start src/server.js --name "catalog-api"

# Auto-restart on crash & server reboot
pm2 save
pm2 startup

# Monitor
pm2 monit
```

**Checklist before going live:**
- [ ] Set all `.env` secrets to strong random values
- [ ] Set `DB_SSL=true` if using a cloud database
- [ ] Set `SHOULD_SYNC=false` in production
- [ ] Configure allowed origins in `corsOptions`
- [ ] Set up a reverse proxy (Nginx / Caddy) in front of Express
- [ ] Enable HTTPS (Let's Encrypt / Cloudflare)

---

## 🤝 Contributing

Contributions are welcome!

```bash
# 1. Fork the repo & create your branch
git checkout -b feature/your-feature-name

# 2. Commit with conventional commits
git commit -m "feat: add your feature"

# 3. Push and open a PR
git push origin feature/your-feature-name
```

---

## 📄 License

Distributed under the **ISC License**. See `LICENSE` for more information.

---

<div align="center">

Made with ❤️ and Node.js

**[⬆ Back to top](#-product-catalog-rest-api)**

</div>