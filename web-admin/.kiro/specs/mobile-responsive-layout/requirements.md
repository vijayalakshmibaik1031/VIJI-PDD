# Requirements Document

## Introduction

The FacilityDesk web-admin app (React + Capacitor) currently renders a left sidebar for navigation on all screen sizes. This feature adapts the app so it works correctly on both web browsers (desktop/tablet) and Android mobile devices running via Capacitor. On web, the existing sidebar layout is preserved unchanged. On Android (native platform), the sidebar is hidden and replaced with a fixed bottom navigation bar showing icons and short labels. All pages and shared components are made responsive so content is readable and usable on small screens without overlapping or clipping.

## Glossary

- **AppShell**: The root layout component (`AppShell.jsx`) that renders the sidebar, top menu toggle, and main content outlet.
- **BottomNav**: The new fixed bottom navigation bar rendered only on native (Capacitor) platforms.
- **Sidebar**: The existing left-side navigation panel (`w-64`) rendered only on web browsers.
- **Platform**: The runtime environment — either `web` (browser) or `native` (Android via Capacitor).
- **isNative**: A boolean derived from `Capacitor.isNativePlatform()` that is `true` when running inside the Capacitor Android shell.
- **RoomPicker**: The shared grid component in `FacilityUI.jsx` that displays selectable room buttons.
- **AuthorityOverview**: The stats dashboard page for the Authority role showing complaint counts in a grid.
- **NavLink**: A navigation item consisting of a route path, a display label, and an associated icon.
- **Role**: One of three user types — Employee, Manager, or Authority — each with its own set of NavLinks.
- **Safe Area**: The device screen region outside of system UI elements (status bar, home indicator) defined by CSS `env(safe-area-inset-*)`.

---

## Requirements

### Requirement 1: Platform-Aware Navigation Shell

**User Story:** As a user, I want the navigation to match my device type, so that I get a sidebar on desktop and a bottom bar on mobile without having to configure anything.

#### Acceptance Criteria

1. WHEN the app is running on a web browser (`isNative === false`), THE AppShell SHALL render the left Sidebar and SHALL NOT render the BottomNav.
2. WHEN the app is running on a native Android platform (`isNative === true`), THE AppShell SHALL render the BottomNav and SHALL NOT render the Sidebar.
3. WHEN the app is running on a native Android platform, THE AppShell SHALL NOT render the top "Menu" toggle button.
4. THE AppShell SHALL derive the platform value by calling `Capacitor.isNativePlatform()` from `@capacitor/core` at component initialisation.
5. WHEN the app is running on a web browser and the viewport width is below the `md` breakpoint (768 px), THE AppShell SHALL render the top "Menu" toggle button that shows or hides the Sidebar.

---

### Requirement 2: Bottom Navigation Bar

**User Story:** As a mobile user, I want a fixed bottom navigation bar with icons and labels, so that I can switch between sections with one tap without scrolling.

#### Acceptance Criteria

1. THE BottomNav SHALL be fixed to the bottom of the viewport and SHALL span the full screen width.
2. THE BottomNav SHALL render one tab item for each NavLink supplied by the active Role layout.
3. WHEN a tab item is tapped, THE BottomNav SHALL navigate to the corresponding route.
4. EACH tab item in the BottomNav SHALL display a lucide-react icon and a short text label of no more than 15 characters.
5. WHEN the current route matches a tab item's route, THE BottomNav SHALL apply an active visual style (distinct colour or underline) to that tab item.
6. THE BottomNav SHALL include bottom padding equal to `env(safe-area-inset-bottom)` so that tab items are not obscured by the Android home indicator.
7. THE BottomNav SHALL have a minimum touch target height of 48 px per tab item to meet mobile usability standards.

---

### Requirement 3: Icon Mapping for Navigation Links

**User Story:** As a mobile user, I want each navigation tab to show a recognisable icon, so that I can identify sections at a glance.

#### Acceptance Criteria

1. THE AppShell SHALL accept an optional `icon` field on each NavLink object alongside the existing `label` and `to` fields.
2. WHEN an `icon` is provided on a NavLink, THE BottomNav SHALL render that icon in the corresponding tab item.
3. THE EmployeeLayout SHALL supply the following icons from lucide-react for its NavLinks: `PlusCircle` for "Raise Complaint", `FileText` for "My Complaints", `Globe` for "Public Complaints", and `User` for "Account".
4. THE ManagerLayout SHALL supply the following icons from lucide-react for its NavLinks: `Clock` for "Pending", `GitMerge` for "Merge Area", `Loader` for "Accepted/In Progress", `CheckCircle` for "Completed", and `List` for "All Complaints".
5. THE AuthorityLayout SHALL supply the following icons from lucide-react for its NavLinks: `BarChart2` for "Overview", `List` for "All Complaints", and `AlertTriangle` for "Escalated".

---

### Requirement 4: Main Content Area Clearance on Mobile

**User Story:** As a mobile user, I want the page content to not be hidden behind the bottom navigation bar, so that I can read and interact with all content.

#### Acceptance Criteria

1. WHEN the app is running on a native Android platform, THE AppShell SHALL apply a bottom padding of at least 64 px to the main content area to clear the BottomNav.
2. THE main content area bottom padding SHALL additionally account for `env(safe-area-inset-bottom)` to handle devices with a home indicator.
3. WHEN the app is running on a web browser, THE AppShell SHALL NOT apply the mobile bottom padding to the main content area.

---

### Requirement 5: Responsive RoomPicker Grid

**User Story:** As a mobile employee, I want the room selection grid to fit my screen, so that I can tap room buttons without them being too small or overflowing.

#### Acceptance Criteria

1. THE RoomPicker SHALL use a responsive column layout: 3 columns on viewports narrower than the `sm` breakpoint (640 px), and 5 columns on viewports at or wider than `sm`.
2. EACH room button in the RoomPicker SHALL have a minimum touch target size of 44 × 44 px on mobile viewports.
3. THE RoomPicker grid SHALL NOT overflow its container on any viewport width.

---

### Requirement 6: Responsive AuthorityOverview Stats Grid

**User Story:** As a mobile authority user, I want the stats cards to stack vertically on small screens, so that each stat is readable without horizontal scrolling.

#### Acceptance Criteria

1. THE AuthorityOverview stats grid SHALL use a responsive column layout: 1 column on viewports narrower than the `sm` breakpoint, 2 columns on `sm` to below `md`, and 3 columns on `md` and wider.
2. EACH stat card in the AuthorityOverview SHALL be full-width within its grid column on all viewport sizes.
3. THE AuthorityOverview stats grid SHALL NOT require horizontal scrolling on any viewport width.

---

### Requirement 7: Responsive Forms and Cards

**User Story:** As a mobile user, I want forms and content cards to fill the screen width, so that I don't have to scroll horizontally or deal with cramped inputs.

#### Acceptance Criteria

1. THE EmployeeRaise form SHALL be full-width on viewports narrower than the `md` breakpoint.
2. WHEN the app is running on a native Android platform, THE EmployeeRaise form submit button SHALL be full-width.
3. THE complaint list cards across all Role pages SHALL be full-width on mobile viewports and SHALL NOT have fixed pixel widths.
4. ALL form inputs (`input`, `textarea`, `select`) within Role pages SHALL be full-width (`w-full`) on mobile viewports.
5. IF a card or form element would overflow the viewport width, THEN THE Layout SHALL clip or wrap the content to prevent horizontal scrolling.

---

### Requirement 8: Consistent Spacing and Padding on Mobile

**User Story:** As a mobile user, I want consistent spacing between elements, so that the interface feels comfortable and nothing feels cramped or cut off.

#### Acceptance Criteria

1. THE main content area SHALL use a horizontal padding of at least 16 px (`p-4`) on mobile viewports.
2. WHILE the app is running on a native Android platform, THE AppShell SHALL apply top padding equal to `env(safe-area-inset-top)` to account for the device status bar.
3. THE vertical spacing between list items and cards SHALL be at least 8 px (`gap-2` or `space-y-2`) on all viewport sizes.
4. THE BottomNav tab items SHALL have equal horizontal spacing distributed across the full width of the bar.
