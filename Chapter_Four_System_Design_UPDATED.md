# Chapter Four: System Design

## 4.1 Introduction

This chapter details the architectural blueprint and technical specifications for the Dire Dawa Real Estate Management System (DDREMS). It bridges the gap between system requirements and actual implementation, describing how the various components interact to deliver all identified features securely and efficiently.

### 4.1.1 Overview of System Design

The system design transforms functional requirements into a structured technical plan. It defines the architecture, data flows, security protocols, and interface designs necessary to build a cohesive platform that handles property listings, financial transactions, legal documentation, broker management, and AI-driven features within a single ecosystem.

### 4.1.2 Design Goals

The architecture is guided by these core objectives:

1. **Security & Compliance:** Implement robust measures to protect sensitive financial data, legal documents, and user privacy, ensuring the system meets regulatory standards.
2. **Modular Scalability:** Design independent, service-based modules (e.g., Payment, Verification, AI Service) to allow individual components to be updated or maintained without disrupting the entire system.
3. **User-Centric Experience:** Create an intuitive and responsive interface accessible to users with varying digital literacy, from property owners to professional brokers.
4. **Reliability and Performance:** Guarantee high system availability, fast search and transaction processing, and consistent uptime to build user trust.
5. **Interoperability:** Facilitate integration with essential external services such as the M-Pesa payment gateway, email notification service, and mapping services.
6. **Data Intelligence Foundation:** Establish a clean data pipeline and model-serving architecture to effectively support the AI Price Predictor and Suspicious Activity Detection features.

---

## 4.2 System Decomposition with Services

DDREMS is built on a Service-Oriented Architecture (SOA), logically separated into three primary tiers:

**1. Client Tier (Presentation)**
The user-facing layer, accessible via modern web browsers for all user roles. The frontend is a React single-page application (SPA) that communicates with the backend via REST APIs and Socket.io for real-time events.

**2. Application Tier (Business Logic)**
The core engine, decomposed into focused services, each exposed as a set of REST API endpoints:

- **User and Auth Service** — Manages accounts, JWT-based authentication, two-factor authentication (2FA), and role-based permissions.
- **Property and Listing Service** — Handles all operations related to property creation, updates, image management, and map-based viewing.
- **Verification Service** — Orchestrates the workflow for physical site checks and digital property verification, including media uploads and inspection reports.
- **Transaction and Payment Service** — Processes all financial transactions, installment plans, M-Pesa STK Push payments, B2C payouts, and payment confirmations.
- **Broker Management Service** — Tracks broker registration, performance metrics, engagement, and automates commission calculations.
- **AI/ML Service** — Hosts and serves price predictions via a Python (scikit-learn) engine called from the Node.js backend, with a JavaScript CSV-based fallback for resilience.
- **Agreement Management Service** — Manages the full real estate agreement lifecycle: request creation, document generation, digital signing, payment tracking, and workflow history.
- **Notification Service** — Centralizes alerts for payments, verifications, and system events via email (Nodemailer/Gmail) and real-time in-app notifications (Socket.io).
- **Suspicious Activity Service** — Scans property listings against AI price predictions to flag anomalous pricing for administrator review.

**3. Data Tier (Persistence)**
Comprises a PostgreSQL relational database for all structured data, and a local file storage system (Multer) for property images, legal documents, site-check media, and profile photos.

---

## 4.3 Current Software Architecture (Before DDREMS)

The state in Dire Dawa before this system lacked any unified software architecture. Operations depended on a manual, fragmented ecosystem:

- **Disconnected Tools:** Reliance on physical paperwork, standalone spreadsheet files, and communication via messaging apps.
- **Isolated Digital Efforts:** Some brokers used simple online listings or social media, but these were not connected to verification, legal, or payment systems.
- **No Centralized System:** The absence of a central database or defined APIs led to information silos, duplication of effort, and significant risk of error or fraud.

---

## 4.4 Proposed Software Architecture

DDREMS implements a hybrid **Layered (N-Tier) Architecture** with SOA principles at its core. This combines clear separation of concerns with the flexibility of independent services.

1. **Presentation Layer:** Built with React 19, creating a dynamic single-page application with role-based dashboards for all six user types.
2. **Application Layer:** Contains the business logic encapsulated within 46 dedicated API route modules served by Express.js.
3. **Data Access Layer:** A custom PostgreSQL adapter (with MySQL-to-PostgreSQL query translation) provides a consistent and secure interface to the database.
4. **Data Storage Layer:** PostgreSQL as the primary relational store, with local file storage for binary assets (images, documents, videos).
5. **Integration Layer:** Handles all communication with external third-party services — M-Pesa Safaricom Ethiopia for payments and Gmail SMTP for email notifications.

---

## 4.5 Hardware and Software Mapping

This section specifies the technical infrastructure required to run DDREMS.

### 4.5.1 Server Infrastructure

**Table 2: Hardware and Software Requirements of the System**

| Component | Hardware Requirements | Software Requirements |
|---|---|---|
| Application Server | Desktop or Personal Computer | Node.js 18+, Python 3 (for ML engine) |
| Database Server | 100 GB SSD storage | PostgreSQL, pgAdmin management tool |
| File Storage | Local disk (server/uploads/) | Multer file handling, organized by category |
| ML Engine | Shared with Application Server | Python 3, scikit-learn, pandas, numpy, pickle |

### 4.5.2 Client Requirements

- **Web Browsers:** Modern Chrome, Firefox, or Safari with JavaScript enabled.
- **Internet Connection:** Minimum 1 Mbps download speed for browsing; 2 Mbps for property image uploads.
- **Devices:** Desktop, laptop, or tablet with at least 2 GB RAM.

### 4.5.3 Development Environment

- Developer PCs: 8 GB RAM, modern processor
- Tools: VS Code, Git, Postman for API testing
- Local Database: PostgreSQL for development and testing

### 4.5.4 External Services

**Table 3: External Services and Third-Party Integrations**

| Service | Provider Used | Purpose |
|---|---|---|
| Payment Gateway | M-Pesa Safaricom Ethiopia | Secure financial transactions (STK Push, B2C payout, reversal) |
| Email Service | Gmail SMTP via Nodemailer | System notifications, account alerts, payment confirmations |
| Maps / Location | Leaflet + OpenStreetMap | Interactive property maps and location-based browsing |
| Real-time Communication | Socket.io | Live in-app notifications and messaging |

---

## 4.6 Persistent Data Management

Data persistence is strategically organized based on data type:

**Relational Database (PostgreSQL)**
Manages all structured, transactional data.

- **Core Tables:** users, properties, brokers, transactions, payments, commissions
- **Agreement Tables:** agreement_requests, agreement_documents, agreement_payments, agreement_commissions, agreement_signatures, agreement_workflow_history, agreement_templates
- **Communication Tables:** messages, message_recipients, notifications, announcements
- **Operational Tables:** property_views, favorites, broker_temporary_bookings, request_key, site_check, complaints, fraud_alerts, audit_log
- **Configuration Tables:** system_config, user_preferences, user_settings
- **Integrity:** Foreign keys, constraints, and transactions ensure data accuracy and consistency.

**Unstructured File Storage (Local Server)**
Stores binary and large files organized into dedicated directories:

- `server/uploads/profiles/` — User and broker profile photos
- `server/uploads/legal-documents/` — Scanned ownership deeds and contracts
- `server/uploads/site-checks/` — Site inspection photos
- `server/uploads/videos/` — Property video walkthroughs

Files are linked to database records via stored URLs. Access to sensitive documents is controlled through the document-access API.

**Backup Strategy**
- Database backups are performed manually or via scheduled scripts.
- Document versioning is managed through the agreement workflow history table, which records every state change with timestamps and actor IDs.

---

## 4.7 Access Control and Security

**1. Authentication**
- Strong password policies with bcrypt hashing (bcryptjs).
- JWT (JSON Web Token) based session management.
- Two-Factor Authentication (2FA) implemented for enhanced account security, with OTP verification via email.
- Password reset workflow with secure token-based verification.

**2. Authorization (RBAC)**
Permissions are strictly controlled by user role:

| Role | Permissions |
|---|---|
| System Admin | Full system oversight, user management, system settings, audit logs |
| Admin | User management, property approval, broker management, fraud dashboard |
| Property Admin | Manage assigned properties, site checks, key requests |
| Broker (Agent) | Manage own listings, view assigned clients, track personal commissions, broker engagement |
| Property Owner | Manage own property listings, view related offers and payments |
| User (Buyer/Tenant) | Browse listings, make booking requests, view personal payment schedules and documents, submit complaints |

**3. Data Security**
- **Encryption in Transit:** All API communication uses HTTPS.
- **Injection Prevention:** Input validation and parameterized queries prevent SQL injection and XSS attacks.
- **Auditing:** A comprehensive audit_log table records all critical actions (logins, financial updates, document changes) for security monitoring and compliance.
- **Suspicious Activity Detection:** An automated scanning service compares listed property prices against AI predictions and flags anomalous listings for administrator review.

---

## 4.8 Global Control Flow

The global control flow demonstrates how different system modules work together to complete key real estate transactions.

**Key Phases in the Flow:**

**1. Search & Selection Phase**
- Buyer browses or searches properties on the landing page or browse page
- AI Price Predictor provides price recommendations
- System displays property listings with map visualization
- Buyer selects a property and can save it to favorites or make a booking request

**2. Broker Engagement Phase**
- System assigns or connects a broker to the transaction
- Property viewing is arranged via the site check workflow
- Site check report with photos is submitted by the property admin
- Buyer makes a purchase or rental offer through the agreement request system

**3. Legal & Agreement Phase**
- Agreement request is created and moves through a multi-step workflow
- Agreement documents are generated and tracked
- Both parties review and digitally sign the agreement
- Workflow history records every step with timestamps and actor IDs

**4. Payment & Transfer Phase**
- Payment is initiated via M-Pesa STK Push (phone prompt) or recorded manually
- M-Pesa callback confirms payment or admin manually confirms
- Agreement status advances to payment_verified
- Commission is calculated and recorded
- B2C payout is initiated to owner and/or broker via M-Pesa
- Email notifications are sent to all parties at each stage

---

## 4.9 Boundary Conditions

- **Startup:** The system initializes by loading environment configurations, establishing the PostgreSQL connection pool, and starting the Socket.io server. The ML model is loaded on first prediction request and cached in memory (pickle cache) for subsequent calls.
- **Shutdown:** Graceful termination completes ongoing database transactions and closes connections.
- **Failure Handling:**
  - *Database Failure:* Connection pool retry logic is implemented with configurable timeout.
  - *ML Engine Failure:* If the Python prediction process fails, the system automatically falls back to a JavaScript-based CSV lookup engine to ensure price predictions remain available.
  - *M-Pesa Failure:* Payments are marked as `pending_mpesa` or `stk_failed` in the database. Admins can manually confirm payments through the admin dashboard.
  - *Peak Load Management:* Response compression (compression middleware), database query optimization, and a 5-minute request timeout are implemented to handle high traffic.

---

## 4.10 Data Dictionary

The Data Dictionary defines and documents the key data elements used in DDREMS, ensuring consistency and accuracy across the system.

### 4.10.1 Core Data Fields

**Table 4: Core Data Fields Summary**

| Field Name | Table | Type | Description | Rules |
|---|---|---|---|---|
| id | users | INTEGER | Unique ID for each user | Primary key, auto-generated |
| email | users | VARCHAR(255) | User's email address | Must be unique, required |
| role | users | ENUM | User type: admin, system_admin, property_admin, broker, owner, user | Required |
| password | users | VARCHAR(255) | Hashed password (bcrypt) | Required, never stored plain |
| id | properties | INTEGER | Unique ID for each property | Primary key, auto-generated |
| price | properties | DECIMAL(15,2) | Property price in ETB | Must be > 0 |
| type | properties | ENUM | house, apartment, land, commercial, villa, shop, office, warehouse | Required |
| status | properties | ENUM | active, pending, sold, rented, inactive | Default: active |
| id | transactions | INTEGER | Unique transaction ID | Primary key, auto-generated |
| amount | transactions | DECIMAL(15,2) | Transaction amount in ETB | Required |
| payment_method | transactions | ENUM | cash, bank_transfer, mobile_money, installment | Required |
| status | agreement_requests | VARCHAR | pending, under_review, approved, fully_signed, payment_submitted, completed | Tracks workflow step |

### 4.10.2 Data Type Quick Guide

- **INTEGER** — Whole number identifier
- **VARCHAR** — Variable-length text field
- **DECIMAL(15,2)** — Number with decimals (15 digits total, 2 after decimal point)
- **ENUM** — Must be one of the listed options
- **TIMESTAMP** — Date and time
- **BOOLEAN** — True or false flag
- **TEXT** — Long-form text content
- **JSON** — Structured data (e.g., installment plan details)

### 4.10.3 Constraint Guide

- **PRIMARY KEY** — Main identifier, must be unique
- **NOT NULL** — Required field
- **UNIQUE** — No duplicates allowed
- **DEFAULT** — Automatic starting value
- **FOREIGN KEY** — Links to another table's primary key
- **CHECK** — Must meet a condition (e.g., price > 0)

### 4.10.4 Transaction Flow Example

When a buyer completes a payment for a property:

1. `property_id` links to the **properties** table
2. `user_id` (buyer) links to the **users** table
3. A record is created in the **agreement_requests** table
4. A record is created in the **agreement_payments** table
5. An M-Pesa transaction is logged in the **mpesa_transactions** table
6. If a broker is involved, a record is created in the **agreement_commissions** table
7. An entry is added to the **agreement_workflow_history** audit table

---

## 4.11 User Interface Design

### 4.11.1 How Users Navigate the System

Each user type has a dedicated dashboard and navigation menu:

**Table 5: Role Menu Options**

| User Type | Main Menu Options |
|---|---|
| Buyer / Tenant | Browse Properties, My Favorites, My Bookings, My Agreements, My Payments, Messages, Complaints |
| Property Owner | My Properties, My Agreements, Rental Ledger, Messages, Profile |
| Broker (Agent) | My Properties, Broker Engagement, Commission Tracking, Site Checks, Key Requests, Messages |
| Property Admin | Assigned Properties, Site Check Management, Key Requests, Announcements |
| Admin | Manage Users, Manage Properties, Manage Brokers, Agreements, Transactions, Reports, Announcements |
| System Admin | All Admin features + System Settings, Audit Logs, System Transactions, Password Reset Requests |
| Everyone (Public) | Landing Page, Browse Properties, Property Details, Register, Login |

### 4.11.2 Main Screens

**1. Landing / Home Page**
- Search bar with keyword, property type, and price range filters
- Featured property cards with photos, price, location, and type
- "Apply as Broker" button with a multi-step application modal
- Navigation to Login and Register

**2. Property Details Page**
- Photo gallery with multiple images
- Property information: price, location, size, bedrooms, bathrooms, type
- "Verified" badge if the property has passed site check
- Interactive map showing property location (Leaflet/OpenStreetMap)
- Action buttons: "Save to Favorites", "Book Property", "Message Broker/Owner"

**3. Role-Based Dashboards**
Each role has a dedicated dashboard showing relevant statistics, recent activity, and quick-action buttons. For example:
- *Admin Dashboard:* Total properties, users, transactions, revenue charts, recent activity
- *Broker Dashboard:* Active listings, pending commissions, client messages, engagement metrics
- *Customer Dashboard:* Saved properties, active agreements, payment status, notifications

**4. AI Price Advisor**
- Form to fill: property location, type, size (m²), bedrooms, bathrooms, condition, amenities (near school, hospital, market, parking, security rating)
- Returns: predicted price, confidence score, price range (low–high), and neighborhood average
- Powered by a Random Forest ML model trained on Dire Dawa property data, with GIS-based distance adjustments

**5. Suspicious Activity Page (Admin)**
- List of properties flagged by the AI engine for anomalous pricing
- Shows the listed price vs. AI-predicted price and the deviation percentage
- Action buttons next to each: "Dismiss", "Investigate", "Block Listing"

**6. Agreement Workflow**
- Multi-step process: Request → Review → Approval → Document Generation → Signing → Payment → Completion
- Each step is tracked with timestamps and actor IDs
- M-Pesa payment integration within the workflow

**7. M-Pesa Payment Page**
- Initiates STK Push to buyer's phone
- Shows real-time payment status (pending, completed, failed)
- Admin can manually confirm payments
- B2C payout initiation for owner/broker disbursements

### 4.11.3 Common UI Elements

On every authenticated page:
- Sidebar navigation (collapsible)
- Notification bell showing unread in-app notifications (real-time via Socket.io)
- User name and profile picture
- Logout button

Property Cards (Browse/Landing):
- Photo, price, location, size, type
- "Verified" badge or "Pending" label
- Save to favorites button

### 4.11.4 Key User Workflows

**Workflow 1: Renting a House**
Search Properties → View Details → Save to Favorites / Book Property → Message Broker → Agreement Request Created → Review & Sign Agreement → Pay via M-Pesa → Receive Keys

**Workflow 2: Selling a Property**
Owner Lists Property → Admin Approves → Site Check Scheduled → Property Marked Verified → Buyer Makes Offer → Agreement Workflow Initiated → Both Parties Sign → Payment Confirmed → Commission Calculated → Payout to Owner and Broker

**Workflow 3: Broker Assisting a Client**
Broker Adds Property → Property Admin Conducts Site Check → Property Goes Live → Broker Engages Buyers → Agreement Negotiated → Commission Tracked → M-Pesa Payout Received

### 4.11.5 Responsive Design

- **Desktop View:** Full sidebar navigation, multi-column layouts, larger maps and charts
- **Mobile / Tablet View:** Simplified single-column layout, collapsible hamburger menu, larger touch-friendly buttons

---

## Conclusion

This project successfully implemented the Dire Dawa Real Estate Management System (DDREMS) to address the critical challenges of inefficiency, fraud, and opacity in Dire Dawa's real estate market. By leveraging modern technologies — including a secure React and Node.js web platform, a Python-based AI pricing engine, M-Pesa payment integration, and real-time Socket.io communication — DDREMS provides a comprehensive digital solution for managing property listings, transactions, legal agreements, and broker operations.

The system's modular, service-oriented architecture ensures scalability and maintainability, while its role-based design caters to all key stakeholders: buyers, sellers, brokers, property admins, and system administrators. The AI Price Predictor, trained on real Dire Dawa property data, provides data-driven pricing guidance, while the suspicious activity scanner adds a layer of fraud prevention.

DDREMS establishes a foundational platform to bring transparency, trust, and efficiency to the real estate sector in Dire Dawa, and demonstrates a viable model for digitizing real estate management in emerging urban markets.
