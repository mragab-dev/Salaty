# صلاتي - Salaty

**صلاتي (Salaty)** is a comprehensive and modern Islamic companion app designed to enrich the daily worship of Muslims. Built with React Native and Expo, it provides a seamless, beautiful, and highly functional user experience across platforms.

## ✨ Core Features

-   **Prayer Times & Qibla:** Accurate prayer times calculated locally based on the user's location, with a smooth, animated Qibla compass.
-   **Full Quran Reader:** A complete Mushaf experience with page-by-page viewing, audio playback from various reciters, bookmarking, verse-by-verse Tafsir (interpretation), and adjustable font sizes.
-   **Memorization Tester:** An interactive tool to help users test and strengthen their Quran memorization by hiding words based on selected difficulty levels.
-   **Adhkar & Tasbih:** A rich library of Adhkar (supplications) for all occasions, including morning, evening, and post-prayer remembrances, coupled with a digital Tasbih (counter) with haptic feedback.
-   **Activity Reports:** A dedicated screen to track and visualize daily and weekly worship activities, encouraging consistency and spiritual growth.
-   **Smart Chatbot Assistant:** An intelligent chatbot, "Salaty," provides spiritual guidance, answers Islamic questions, tells stories of the prophets, and offers comfort with relevant Quranic verses and Du'as.
-   **Customizable Notifications:** Highly customizable notifications for prayer times with various Adhan sounds, pre-prayer reminders, and daily Adhkar reminders.

## 🛠 Tech Stack

-   **Framework:** React Native with Expo
-   **Navigation:** React Navigation (Bottom Tabs & Native Stack)
-   **Prayer Times Calculation:** `adhan-js` library for accurate, offline calculations.
-   **State Management:** React Hooks (`useState`, `useEffect`, `useContext`)
-   **Async Storage:** `@react-native-async-storage/async-storage` for persisting user data.
-   **UI Components:** Custom-built components, `react-native-svg` for icons, and `expo-linear-gradient` for beautiful UIs.
-   **Notifications:** `expo-notifications` for local scheduling and handling.
-   **Audio:** `expo-av` for Quran and Adhan playback.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js and npm/yarn
-   Expo CLI (`npm install -g expo-cli`)
-   Git

### Installation & Running

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/salaty-app.git
    cd salaty-app
    ```
2.  **Install NPM packages:**
    ```sh
    npm install
    ```
3.  **Run the app:**
    ```sh
    npm start
    ```
    This will start the Metro Bundler. You can then run the app on an Android emulator, iOS simulator, or on your physical device using the Expo Go app.

## 📁 Project Structure

The codebase is organized into logical directories to maintain clarity and scalability:

-   **`assets/`**: Contains all static assets like fonts, images, sounds, and data files (Quran, Adhkar, etc.).
-   **`components/`**: Reusable UI components used across different screens (e.g., `PrayerCard`, `QiblaCompass`, `Modal`).
-   **`constants/`**: Holds constant values used throughout the app, such as API endpoints, color palettes, and AsyncStorage keys.
-   **`hooks/`**: Custom React hooks (e.g., `useGeolocation`).
-   **`screens/`**: Main screen components, each representing a full view in the app (e.g., `PrayerTimesScreen`, `QuranIndexScreen`).
-   **`services/`**: Contains business logic, API interactions, and service modules (e.g., `prayerTimeService`, `notificationService`, `quranAudioService`).
-   **`types.ts`**: TypeScript type definitions for the entire application.
-   **`App.tsx`**: The root component of the application, handling navigation and global setup.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE.txt` for more information.
# Salaty
# Salaty
# Salaty--
# Salaty--
# Salaty--
# Salaty--
# Salaty--
# Salaty--
# Salaty--
