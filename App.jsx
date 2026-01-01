"use client"

import { useState } from "react"
import { StatusBar, useColorScheme, StyleSheet, View, Text, SafeAreaView } from "react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { AppProvider } from "./store/app-store"
import LoginPage from "./screens/LoginPage"
import ManagerScreen from "./screens/ManagerScreen"
import OwnerScreen from "./screens/OwnerScreen"

function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.homeTitle}>You are logged in 🎉</Text>
        <Text style={styles.homeSub}>Replace this with your real app content.</Text>
      </View>
    </SafeAreaView>
  )
}

export default function App() {
  const isDarkMode = useColorScheme() === "dark"
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState(null)

  return (
    <AppProvider>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        {isAuthenticated ? (
          role === "Owner" ? (
            <OwnerScreen />
          ) : role === "Manager" ? (
            <ManagerScreen />
          ) : (
            <HomeScreen />
          )
        ) : (
          <LoginPage
            onLogin={(r) => {
              setRole(r)
              setIsAuthenticated(true)
            }}
          />
        )}
      </SafeAreaProvider>
    </AppProvider>
  )
}

const PRIMARY_BLUE = "#2F6FED"
const TEXT_DARK = "#0E141B"
const TEXT_MUTED = "#4A5568"
const SURFACE = "#FFFFFF"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  homeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 6,
  },
  homeSub: {
    fontSize: 16,
    color: TEXT_MUTED,
    textAlign: "center",
  },
})
