import React from "react";
import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "house.fill", android: "home", web: "home" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "camera.fill",
                android: "photo_camera",
                web: "photo_camera",
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="solve"
        options={{
          title: "Solve",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "cube.fill",
                android: "view_in_ar",
                web: "view_in_ar",
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "clock.fill", android: "history", web: "history" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: "Timer",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "timer", android: "timer", web: "timer" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      {/* Hide the old "two" tab from template */}
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
