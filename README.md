# BoostGameFaster

**BoostGameFaster** is an Android application built with React Native to optimize gaming performance on low-end devices like the Samsung Galaxy J4+ (Android 9, \~2GB RAM, Adreno 308 GPU). It enhances gameplay by reducing CPU load, optimizing RAM usage, managing network latency, and providing an **Extreme Boost** mode for maximum performance. The app is designed to work without root access, making it safe and accessible for all users.

## Features

- **CPU Optimization**: Reduces CPU load by \~10-15% through:
  - Lowering Wi-Fi scan frequency (20s interval).
  - Using Coroutines with `Dispatchers.IO` for background tasks.
  - Disabling unnecessary system animations in Extreme Boost mode.
- **RAM Optimization**: Keeps RAM usage under 1GB by:
  - Closing non-essential background apps (excluding system apps like `com.android.systemui`).
  - Reducing `FlatList` buffer size (`windowSize=1`) in UI components.
  - Implementing lazy loading for game and Wi-Fi lists.
- **Extreme Boost Mode**: Maximizes performance for gaming by:
  - Closing all non-critical background apps.
  - Disabling system animations (`WINDOW_ANIMATION_SCALE`, `TRANSITION_ANIMATION_SCALE`, `ANIMATOR_DURATION_SCALE` = 0).
  - Disabling sync (`ContentResolver.setMasterSyncAutomatically(false)`).
  - Prioritizing game processes for smoother gameplay.
- **Network Optimization**: Reduces ping (\~40ms for FPS games like PUBG Mobile) by:
  - Scanning Wi-Fi networks to recommend optimal 2.4GHz channels (1, 6, 11).
  - Suggesting QoS settings for specific games (e.g., 90% bandwidth for FPS games).
  - Prioritizing UDP traffic for low-latency games.
- **Performance Monitoring**: Checks CPU, RAM, and ping every 60s, displaying warnings for high usage (&gt;80% CPU, &lt;300MB RAM, &gt;100ms ping).
- **Stability and Safety**:
  - Backs up system settings (animations, sync, brightness) before applying optimizations and restores them when BoostMode is disabled.
  - Validates inputs to prevent injection vulnerabilities.
  - Logs errors to `Logcat` for debugging.
- **Modular Design**: Separates logic into modules (`AppManager`, `NetworkOptimizer`, `GraphicsOptimizer`) for easy maintenance and scalability.

## Target Device

- **Samsung Galaxy J4+**:
  - Android 9 (API 28)
  - Snapdragon 425, Adreno 308 GPU
  - \~2GB RAM
- Also compatible with other low-end Android devices (API 21+).

## Installation

### Prerequisites

- Node.js 16+ and npm
- Android SDK (API 28 recommended)
- Java JDK 11+
- Git
- React Native CLI
- Android device/emulator with USB debugging enabled

### Steps

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/darkduy/boost-game-faster.git
   cd boost-game-faster
