import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Tabs, usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/lib/theme";

// ── Tab definitions ───────────────────────────────────────────────────────────

const TABS = [
  { name: "index",   route: "/",        iconActive: "house",  iconInactive: "house-outline",  label: "Home"    },
  { name: "scan",    route: "/scan",     iconActive: "camera", iconInactive: "camera-outline", label: "Scan"    },
  { name: "solve",   route: "/solve",    iconActive: "cube",   iconInactive: "cube-outline",   label: "Solve"   },
  { name: "history", route: "/history",  iconActive: "time",   iconInactive: "time-outline",   label: "History" },
] as const;

// ── CustomTabBar ──────────────────────────────────────────────────────────────

function CustomTabBar() {
  const t        = useTheme();
  const router   = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  // Resolve active index — default to 0 (Home) for non-tab routes
  const activeIdx = Math.max(
    0,
    TABS.findIndex((tab) => tab.route === pathname)
  );

  // Dimensions
  const BAR_WIDTH  = width - 40;           // left:20 + right:20
  const PADH       = 8;                    // paddingHorizontal on container
  const TAB_WIDTH  = (BAR_WIDTH - PADH * 2) / TABS.length;

  // Animated indicator position
  const indicatorX = useRef(new Animated.Value(activeIdx * TAB_WIDTH)).current;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: activeIdx * TAB_WIDTH,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [activeIdx, TAB_WIDTH]); // eslint-disable-line react-hooks/exhaustive-deps

  const indicatorBg     = t.isDark ? "rgba(184,228,192,0.15)" : "rgba(91,79,207,0.10)";
  const indicatorBorder = t.isDark ? "rgba(184,228,192,0.30)" : "rgba(91,79,207,0.20)";

  const barShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.20,
      shadowRadius: 20,
    },
    android: { elevation: 16 },
    default: {},
  }) as object;

  return (
    <View
      style={[
        s.bar,
        barShadow,
        { backgroundColor: t.CARD, borderColor: t.BORDER },
      ]}
    >
      {/* Sliding indicator */}
      <Animated.View
        pointerEvents="none"
        style={[
          s.indicator,
          {
            width: TAB_WIDTH,
            backgroundColor: indicatorBg,
            borderColor: indicatorBorder,
            transform: [{ translateX: indicatorX }],
          },
        ]}
      />

      {/* Tab items */}
      {TABS.map((tab, idx) => {
        const isActive = idx === activeIdx;
        return (
          <Pressable
            key={tab.name}
            style={s.tabItem}
            onPress={() => router.push(tab.route as any)}
          >
            <Ionicons
              name={(isActive ? tab.iconActive : tab.iconInactive) as any}
              size={22}
              color={isActive ? t.HIGHLIGHT : t.MUTED}
            />
            {isActive && (
              <Text style={[s.tabLabel, { color: t.HIGHLIGHT }]}>{tab.label}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ── TabLayout ─────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <View style={s.root}>
      <Tabs
        screenOptions={{
          lazy: false,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="index"   />
        <Tabs.Screen name="scan"    />
        <Tabs.Screen name="solve"   />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="timer"   options={{ href: null }} />
      </Tabs>

      <CustomTabBar />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  bar: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    overflow: "hidden",   // clips the sliding indicator
  },

  indicator: {
    position: "absolute",
    left: 8,              // aligns with paddingHorizontal baseline
    top: 10,              // (64 - 44) / 2
    height: 44,
    borderRadius: 20,
    borderWidth: 1,
  },

  tabItem: {
    flex: 1,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
});
