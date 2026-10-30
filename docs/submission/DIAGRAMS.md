# Karachi Bites — Diagrams

All diagrams below are written in Mermaid syntax and reflect the actual implementation of the project.

---

# 1. System Architecture

```mermaid
graph TB
    subgraph Browser["Browser (Customer / Staff)"]
        IH["index.html\n(Stitch Homepage)"]
        AH["app.html\n(API-backed SPA)"]
        AD["admin.html\n(Staff/Admin Dashboard)"]
        KT["kitchen-ticket.html\n(Print-friendly ticket)"]
    end

    subgraph Vercel["Vercel Hosting"]
        EX["Express Serverless Function\n(src/server.js)"]
    end

    subgraph Supabase["Supabase PostgreSQL"]
        MI["menu_items"]
        BR["branches"]
        US["users"]
        OR["orders"]
        OI["order_items"]
        AP["auth_profiles"]
    end

    subgraph Local["Local Development (SQLite)"]
        SQ["karachi_bites.db"]
    end

    Browser -->|HTTP/HTTPS| Vercel
    Vercel -->|sqlite3| Local
    Vercel -->|pg pool| Supabase
```

---

# 2. Customer Ordering Workflow

```mermaid
flowchart TD
    A["Customer visits homepage"] --> B["Browses menu / filters"]
    B --> C["Adds items to cart"]
    C --> D["Cart persists in localStorage"]
    D --> E["Goes to checkout"]
    E --> F["Fills name, phone, address, branch"]
    F --> G["Server validates all fields"]
    G -->|Invalid| H["Returns 400 with error message"]
    G -->|Valid| I["Server calculates total\nsubtotal + Rs.150 delivery fee"]
    I --> J["Creates order in database\nGenerates public ID KB-YYYYMMDD-XXXXXXXX"]
    J --> K["Returns orderId + total"]
    K --> L["Customer sees confirmation page"]
    L --> M["Customer tracks order\n(orderId + phone)"]
    M --> N["Server verifies phone match"]
    N -->|Mismatch| O["Returns 403"]
    N -->|Match| P["Returns full order details\nwith status"]
    P --> Q["Customer may Order Again"]
```

---

# 3. Authentication and 2FA Flow

```mermaid
flowchart LR
    subgraph Legacy["Legacy JWT Auth"]
        L1["POST /api/auth/login"] --> L2["bcrypt compare password"]
        L2 --> L3["Issue JWT (24h expiry)"]
        L3 --> L4["Store in sessionStorage"]
        L4 --> L5["authMiddleware re-checks DB on each request"]
    end

    subgraph Supabase["Supabase Auth (Production)"]
        S1["Customer signs up via email/Google"] --> S2["Supabase issues access token"]
        S2 --> S3["Server calls /auth/v1/user"]
        S3 --> S4["Resolve role from auth_profiles"]
        S4 --> S5["Accept or reject request"]
    end

    subgraph Staff2FA["Staff 2FA (Planned)"]
        F1["POST /auth/login"] --> F2["Validate credentials"]
        F2 --> F3["Create OTP challenge"]
        F3 --> F4["Send OTP via email (Resend)"]
        F4 --> F5["POST /auth/verify-otp"]
        F5 --> F6["Issue server-side session"]
    end

    Legacy --> AdminDashboard["Admin Dashboard"]
    Supabase --> CustomerPortal["Customer Portal"]
    Staff2FA -.->|Pending config| StaffDashboard["Staff Dashboard"]
```

---

# 4. Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    menu_items {
        int id PK
        text name
        int price
        text category
        text tags
        boolean available
        text description
        text image
    }

    branches {
        text name PK
    }

    users {
        int id PK
        text username UK
        text password_hash
        text role
        boolean is_active
    }

    orders {
        int id PK
        text public_order_id UK
        text customer_name
        text customer_phone
        text customer_address
        text branch FK
        text status
        int total
        text customer_notes
        timestamp created_at
        text idempotency_key
    }

    order_items {
        int id PK
        int order_id FK
        int menu_item_id FK
        int quantity
        int price_at_order
        text name_at_order
    }

    auth_profiles {
        uuid id PK
        uuid auth_user_id FK
        text role
        boolean is_active
    }

    orders ||--o{ order_items : contains
    order_items }o--|| menu_items : references
    orders }o--|| branches : placed_at
```

---

# 5. Order Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Received
    Received --> Preparing
    Preparing --> Out for Delivery
    Out for Delivery --> Delivered
    Delivered --> [*]

    note right of Received
        Initial status after order creation.
        Order is received by the restaurant.
    end note

    note right of Preparing
        Kitchen is preparing the food.
        Staff updates status from Received.
    end note

    note right of Out for Delivery
        Order has left the restaurant.
        Delivery person is en route.
    end note

    note right of Delivered
        Terminal state. Order completed.
        No further transitions allowed.
    end note
```

---

# 6. Deployment Architecture

```mermaid
flowchart TB
    subgraph Client["Client Browsers"]
        C1["Customer browsers"]
        C2["Staff/Admin browsers"]
    end

    subgraph Vercel["Vercel Platform"]
        Static["Static Files\n(public/)\nindex.html, app.html, admin.html,"]
        API["Express Serverless Function\nsrc/server.js\nRoutes + DB adapter"]
    end

    subgraph Supabase["Supabase"]
        DB[("PostgreSQL\nkarachi_bites_db")]
        EF["Edge Function\nkarachi-bites-api\n(2FA OTP endpoints)"]
        Auth["Supabase Auth\nEmail/Password + Google OAuth"]
    end

    C1 --> Static
    C1 --> API
    C2 --> API
    C2 --> Static
    API --> DB
    EF --> DB
    Auth --> EF

    style DB fill:#e1f5fe,stroke:#01579b
    style EF fill:#fff3e0,stroke:#e65100
    style Auth fill:#f3e5f5,stroke:#4a148c
```

---

# 7. Staff/Admin Authorization Flow

```mermaid
sequenceDiagram
    participant S as Staff/Admin
    participant UI as admin.html
    participant API as Express API
    participant DB as Database

    S->>UI: Enter username & password
    UI->>API: POST /api/auth/login {username, password}
    API->>DB: SELECT * FROM users WHERE username=?
    DB-->>API: user record (password_hash, role, is_active)
    API->>API: bcrypt.compare(password, password_hash)
    alt Password matches
        API->>API: jwt.sign({id, username, role}, SECRET, {expiresIn: "24h"})
        API-->>UI: {token}
        UI->>UI: Store token in sessionStorage
        UI->>API: GET /api/admin/orders (Bearer token)
        API->>API: authMiddleware verifies JWT
        API->>DB: SELECT * FROM users WHERE id=? (refresh role)
        DB-->>API: current user record
        API->>API: requireStaffOrAdmin checks role ∈ {staff, admin}
        API-->>UI: Order list
    else Password mismatch or inactive
        API-->>UI: 401 Invalid credentials
    end

    Note over API,DB: Admin-only endpoints (menu CRUD, CSV export)
    Note over API,DB: call requireAdmin middleware instead of requireStaffOrAdmin
```
