import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useColorScheme } from "@/components/useColorScheme";
import { initSolver } from "@/lib/solver";
import { useTheme } from "@/lib/theme";
import { ThemeModeProvider } from "@/lib/themeContext";

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
  const colorScheme = useColorScheme();

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
        name="settings"
        options={{
          title: "Settings",
          headerShown: true,
          headerStyle: { backgroundColor: t.BG },
          headerTintColor: t.TEXT,
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
