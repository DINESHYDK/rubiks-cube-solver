import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColorScheme } from "@/components/useColorScheme";
import { initSolver } from "@/lib/solver";
import { useTheme } from "@/lib/theme";
import { ThemeModeProvider } from "@/lib/themeContext";
import AppSplashScreen from "@/app/splash";
import Onboarding from "@/app/onboarding";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme    = useColorScheme();
  const [showSplash,   setShowSplash]   = useState(true);
  const [showOnboard,  setShowOnboard]  = useState(false);
  const [onboardReady, setOnboardReady] = useState(false);

  // Check first-launch flag BEFORE splash disappears
  useEffect(() => {
    AsyncStorage.getItem("onboarded").then((val) => {
      if (!val) setShowOnboard(true);
      setOnboardReady(true);
    }).catch(() => setOnboardReady(true));
  }, []);

  useEffect(() => {
    const warmUp = async () => {
      try {
        await new Promise<void>((resolve) => {
          setTimeout(() => {
            initSolver();
            resolve();
          }, 500);
        });
      } catch (e) {
        console.warn("[Solver] Pre-warm failed:", e);
      }
    };
    warmUp();
  }, []);

  return (
    <ThemeModeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <NavStack />
          {showSplash && (
            <AppSplashScreen
              onComplete={() => {
                setShowSplash(false);
              }}
            />
          )}
          {/* Show onboarding only after splash is gone and flag is checked */}
          {!showSplash && onboardReady && showOnboard && (
            <Onboarding onComplete={() => setShowOnboard(false)} />
          )}
        </ThemeProvider>
      </GestureHandlerRootView>
    </ThemeModeProvider>
  );
}

// Separate component so it sits inside ThemeModeProvider and can read live theme tokens
function NavStack() {
  const t = useTheme();
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="landing"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: true,
          headerStyle: { backgroundColor: t.BG },
          headerTintColor: t.TEXT,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="tutorial"
        options={{
          title: "Kociemba Demo",
          headerShown: true,
          headerStyle: { backgroundColor: t.BG },
          headerTintColor: t.TEXT,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
