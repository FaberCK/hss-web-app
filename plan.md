# HSS-Web: Developer Implementation Roadmap

This document provides a step-by-step execution plan. Use these steps with Cursor (Cmd+L / Cmd+I) to build the system.

## Phase 0: Containerization & Environment

### Step 0.1: Docker Orchestration
**Prompt:** *"Using @docker-compose.yml and @backend.Dockerfile, set up the project environment. Ensure the PostgreSQL container is configured for high performance and includes the necessary extensions for our hierarchy logic. Setup a .env file template with placeholders for DB_URL and JWT_SECRET."*

## Phase 1: Backend Foundation (The Core)

### Step 1.1: Project Setup
**Prompt:** *"Initialize a NestJS backend with TypeScript. Setup a folder structure following Domain-Driven Design (modules for: Auth, Organizations, Properties, Users). Install Prisma and @nestjs/passport."*

### Step 1.2: Database & Prisma
**Action:** Copy the content from `db_schema_v1.md` into `prisma/schema.prisma`.
**Prompt:** *"Using @db_schema_v1.md, generate the Prisma client. Create a `PrismaService` and a global interceptor that handles the PostgreSQL SET LOCAL app.current_organization_id logic for Row Level Security as specified in the PRD."*

### Step 1.3: Authentication & Context Middleware
**Prompt:** *"Implement the Auth & Context Middleware. It must validate JWTs and extract the `x-hss-scope-id` header. Attach the user context (roles, allowed departments) to the request object for use in guards."*

## Phase 2: Hierarchy & User Management API

### Step 2.1: Property Management
**Prompt:** *"Create a Property controller and service. Implement CRUD operations. Enforce the 5-character alphanumeric 'code' validation and ensures it is unique within the Division."*

### Step 2.2: Granular User Assignments
**Prompt:** *"Implement the User Management API. Create an endpoint for 'Invite User' that handles the tiered assignment logic (selecting Properties and specific Departments) as described in @ui_user_mgmt_v1.md."*

## Phase 3: Frontend Development (React + Tailwind)

### Step 3.1: Layout & Context Switcher
**Prompt:** *"Setup a React SPA with Tailwind CSS. Create a SideBar and a TopBar. In the TopBar, implement the 'Active Scope Switcher' dropdown that updates the x-hss-scope-id header for all subsequent API calls."*

### Step 3.2: User Management Matrix UI
**Prompt:** *"Referencing @ui_user_mgmt_v1.md, build the User Invite Matrix component. It should allow admins to toggle departments for multiple selected properties in a clean, nested list view."*

## Phase 4: Real-time & Aggregations

### Step 4.1: Aggregation Engine
**Prompt:** *"Create a Dashboard service that performs 'bottom-up' data aggregation. It should sum up metrics from Departments -> Properties based on the user's active scope."*

### Step 4.2: WebSockets for Alerts
**Prompt:** *"Implement Socket.io in the backend. When a new alert is created, broadcast it to the specific 'room' corresponding to the Property ID so relevant managers see it instantly."*