# StoreHub Design Guidelines

## Design Approach
**Selected Approach**: Design System - Material Design  
**Justification**: This is a utility-focused dashboard application requiring 24/7 reliability, clear information hierarchy, and efficient task completion. Material Design provides excellent patterns for data-dense interfaces, real-time updates, and role-based access controls.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Light Mode: 25 85% 50% (deep blue)
- Dark Mode: 210 100% 85% (light blue)

**Secondary/Surface Colors:**
- Light Mode: 210 15% 95% (light gray-blue)
- Dark Mode: 220 15% 15% (dark blue-gray)

**Status Colors:**
- Success: 140 70% 50% (green)
- Warning: 45 90% 60% (amber)
- Error: 0 75% 55% (red)
- Info: 200 80% 60% (blue)

### B. Typography
**Font Family**: Inter (Google Fonts)
- Primary: Inter 400, 500, 600
- Monospace: JetBrains Mono (for timestamps, IDs)

**Scale:**
- Headers: text-2xl to text-4xl (600 weight)
- Body: text-sm to text-base (400 weight)
- Labels: text-xs to text-sm (500 weight)

### C. Layout System
**Spacing Units**: Tailwind units of 2, 4, 6, and 8
- Micro spacing: p-2, m-2
- Component spacing: p-4, gap-4
- Section spacing: p-6, mb-6
- Page spacing: p-8, space-y-8

### D. Component Library

**Navigation:**
- Fixed sidebar with role-based menu items
- PIN entry modal with numeric keypad
- Breadcrumb navigation for admin sections

**Data Display:**
- Card-based layout for dashboard widgets
- Real-time status badges with color coding
- Data tables with sorting and filtering
- Live camera preview tiles (3-5 maximum)

**Forms:**
- Material Design input styling
- Floating labels for better space efficiency
- Clear validation states and error messages
- Multi-step forms for complex workflows

**Alerts & Notifications:**
- Toast notifications for real-time events
- Modal dialogs for critical alerts
- In-line status indicators
- Priority-based visual hierarchy

**Task Management:**
- Checklist components with progress indicators
- Timer displays for rotating tasks
- Completion status with timestamps
- Drag-and-drop for task reordering (admin)

### E. Animations
**Minimal Animation Strategy:**
- Smooth transitions for state changes (200ms)
- Loading spinners for data fetching
- Subtle hover effects on interactive elements
- NO distracting animations that could interfere with 24/7 operations

## Specific Dashboard Layout

**Main Dashboard Structure:**
1. **Header Bar**: Current user, shift status, system alerts
2. **Left Sidebar**: Navigation menu based on user role
3. **Main Content**: 
   - Top row: Active tasks and alerts
   - Middle: Camera previews (if enabled)
   - Bottom: Quick inventory status
4. **Right Panel**: Recent activity log and notifications

**Admin Interface:**
- Clean tabbed interface for different management sections
- Form-heavy layouts with clear field grouping
- Data tables with inline editing capabilities
- Settings organized in logical categories

**Mobile Considerations:**
- Responsive design for tablet access
- Touch-friendly targets (min 44px)
- Simplified navigation for smaller screens
- Essential functions prioritized

This design system prioritizes clarity, efficiency, and reliability - critical for a 24/7 operations dashboard where staff need to quickly complete tasks and respond to alerts without visual distractions.