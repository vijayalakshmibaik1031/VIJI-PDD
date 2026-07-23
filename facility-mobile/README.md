# Facility Desk - Standalone React Native CLI Android Application

A standalone **React Native CLI (Bare Native Android)** application built without Expo dependencies for Facility Management (Facility Desk / VIJI-PDD).

---

## 📱 Modules Included

1. **Auth & Registration**: Email/Password Login, User Registration with role selection, Email verification flow.
2. **Employee Module**:
   - **Raise Issue**: Submit tickets with category, priority, room location, description, and privacy settings.
   - **My Tickets**: View personal private complaint history and status updates.
   - **Community Feed**: Public facility board with upvoting functionality.
   - **Profile**: View user department, room assignment, and role details.
3. **Manager Module**:
   - **Dashboard Overview**: Visual metrics for Pending, In Progress, Completed, and Escalated tickets.
   - **Pending Tickets**: Approve incoming issues and move to active processing.
   - **In-Progress Tickets**: Track maintenance work and mark tickets as completed/resolved.
   - **Resolved Archives**: Review historical closed tickets.
   - **Staff Directory**: Inspect registered facility employees.
4. **Authority Module**:
   - **System Audit Dashboard**: High-level facility operational metrics.
   - **Escalated Alerts**: Audit urgent escalated issues.
   - **Room Management**: Inspect room numbers, floor layout, and capacity allocations.
   - **User Governance**: Audit all registered accounts across all roles.

---

## 🚀 How to Run the App (React Native CLI)

### 1. Prerequisites
- **Node.js**: v18+ installed
- **Android Studio & SDK**: Android SDK API 34 installed
- **Android Emulator or USB Device**: ADB connected

### 2. Install Dependencies
```bash
cd facility-mobile
npm install
```

### 3. Start Metro Bundler
```bash
npx react-native start
```

### 4. Run on Android Emulator / Device
In a separate terminal:
```bash
npx react-native run-android
```
Or open the `facility-mobile/android` folder in **Android Studio** and click **Run App** (`Shift + F10`).

---

## 🔌 API Configuration

The API URL handler in `src/config/api.js` is automatically configured to point to:
- **Android Emulator**: `http://10.0.2.2:5000` (maps to local host machine port 5000)
- **Live Cloud Backend**: `https://viji-pdd-production-7c95.up.railway.app`
