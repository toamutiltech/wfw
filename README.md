# Walk From Within (WFW) App

Welcome to the **Walk From Within (WFW)** React Native mobile application repository. WFW is a comprehensive faith-based community and networking application designed to foster spiritual growth, connection, and engagement among its users.

## 📱 Core Features

### 1. Community & Engagement
- **Social Feed**: A centralized timeline where users can discover and interact with posts from the community.
- **Create Posts**: Rich text posting allowing users to share updates, insights, and media.
- **Discover Users**: Find and connect with other community members seamlessly.
- **Direct Messaging**: Private real-time chat functionality for one-on-one conversations.

### 2. Spiritual Growth
- **Daily Devotionals**: Access to daily readings and reflections.
- **Prayer Board**: A dedicated space for users to post, share, and engage with prayer requests.
- **Push Notifications**: Automated daily reminders ("Take a moment to walk from within") to encourage consistent spiritual habits.

### 3. Events & Organization
- **Events Calendar**: Browse upcoming community events, services, and gatherings.

### 4. User Profiles & Customization
- **Authentication**: Secure Login and Registration flows.
- **Profile Management**: Customizable user profiles with the ability to edit information.
- **Theming**: Full support for system-based Light and Dark modes.

---

## 🛠 Tech Stack

This project is built using modern mobile development technologies:
- **Framework**: [React Native](https://reactnative.dev) (v0.85.3) via [Expo](https://expo.dev) SDK 56
- **Language**: TypeScript
- **Navigation**: React Navigation v7 (Bottom Tabs & Native Stack)
- **Icons**: Expo Vector Icons (Ionicons)
- **State Management**: React Context API (`AuthContext`)
- **Networking**: Axios

## 📂 Project Structure

```text
c:\reactnative\wfw\
├── src/
│   ├── context/         # React Context providers (AuthContext)
│   ├── screens/         # Application screens
│   │   ├── auth/        # Login and Registration screens
│   │   ├── FeedScreen, HomeScreen, PrayerBoardScreen, etc.
│   ├── utils/           # Utility functions (Global Logger, etc.)
├── assets/              # Splash screens, app icons, fonts, etc.
├── App.tsx              # Main application entry point and Navigation router
├── app.json             # Expo configuration (bundle ID: com.adeoluquantum.wfw)
└── package.json         # Project dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm/yarn installed. You will also need to follow the [Expo Environment Setup](https://docs.expo.dev/get-started/installation/) if you haven't already.

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Running the App (Metro Bundler)
Start the Expo Metro development server:
```bash
npm start
```

### 3. Build & Run on Device/Emulator
To compile and run the native apps:

**Android:**
```bash
npm run android
```

**iOS:**
```bash
# Ensure CocoaPods dependencies are installed
cd ios && pod install && cd ..
npm run ios
```

## 🐛 Troubleshooting & Error Handling
- **Global Error Logger**: The app uses a global `ErrorUtils` handler configured to log fatal crashes remotely (`logToServer`).
- If you run into build issues or Metro cache errors, try running `npm start -- --clear`.

## 📜 Legal
For details regarding user privacy and terms of service, refer to the in-app **Privacy Policy** and **Terms of Service** screens accessible via the Profile tab.
