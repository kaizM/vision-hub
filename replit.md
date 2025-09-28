# StoreHub - Local-First Operations Dashboard

## Overview

StoreHub is a local-first, in-store operations dashboard designed for convenience stores and retail environments. The system provides real-time task management, employee check-in/out functionality, inventory tracking, and camera monitoring through a kiosk-style interface that operates 24/7 without requiring cloud services or internet connectivity.

The application follows a "single source of truth" principle with all data stored locally on the store's PC, ensuring reliability and eliminating monthly cloud costs. It features role-based access control with PIN authentication, automated task scheduling, carton inventory management, and quick shortcuts to external vendor websites.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React with TypeScript, Vite build system, Tailwind CSS for styling
- **Component Library**: Radix UI components with shadcn/ui design system following Material Design principles
- **State Management**: TanStack Query for server state, local React state for UI interactions
- **Routing**: Wouter for lightweight client-side routing
- **Design Tokens**: CSS custom properties with light/dark mode support, consistent spacing units (2, 4, 6, 8)

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Design**: RESTful endpoints with JSON responses
- **Session Management**: Cookie-based sessions with 12-hour expiration for admin access
- **Authentication**: PIN-based authentication with hashed storage, role-based access control

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Design**: Comprehensive tables for employees, tasks (regular/special), task logs, carton inventory ledger, shortcuts, temperature equipment, and audit trails
- **Data Integrity**: Foreign key constraints, proper indexing, and timestamp tracking for all operations
- **Local-First**: Designed to operate entirely on local infrastructure without cloud dependencies

### Authentication and Authorization
- **Role Hierarchy**: Employee (level 1) → Shift Lead (level 2) → Admin (level 3) → Manager (level 4)
- **PIN Security**: Numeric PINs (3-8 digits) stored as hashes, special manager PIN (786110) for admin access
- **Session Management**: Separate session handling for admin interface and personal task tabs
- **Access Control**: RoleGuard component enforces permission levels throughout the application

### Key Features Architecture
- **Kiosk Interface**: Always-on display with real-time alerts, camera feeds, and quick access buttons
- **Personal Task System**: PIN-authenticated individual task management with auto-close functionality
- **Task Scheduling**: Regular recurring tasks and special one-off assignments with rotation logic
- **Inventory Management**: Carton counting with full audit trail (Add/Remove/Set/Reset operations)
- **Camera Integration**: Simulated feeds for demo environment, RTSP support for production deployment
- **Quick Shortcuts**: Configurable tiles linking to external vendor websites

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver for database connectivity
- **drizzle-orm**: Type-safe ORM for database operations and migrations
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI components for accessibility and functionality
- **express**: Web server framework for API endpoints
- **connect-pg-simple**: PostgreSQL session store for authentication

### Development Tools
- **Vite**: Fast build tool and development server with HMR support
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **PostCSS**: CSS processing with autoprefixer
- **esbuild**: Fast JavaScript bundler for production builds

### Future Integrations
- **RTSP Camera Streams**: For live security camera feeds in production environment
- **Text-to-Speech API**: Web Speech API for employee name announcements
- **QR Code Generation**: For mobile access to personal task interfaces
- **Local File System**: For backup/restore functionality and report exports

### Asset Dependencies
- **Google Fonts**: Inter font family for typography
- **Lucide React**: Icon library for consistent UI iconography
- **Generated Images**: Placeholder camera feed images stored in attached_assets