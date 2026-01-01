"use client"

import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useState } from "react"
import { useApp, COLORS } from "../store/app-store"

// Import components
import DashboardEnhanced from "../features/owner/DashboardEnhanced"
import AnalyticsTab from "../features/owner/AnalyticsTab"
import InventoryAndMenu from "../features/owner/InventoryAndMenu"
import StaffTab from "../features/owner/StaffTab"
import CCTVTab from "../features/owner/CCTVTab"

const TABS = [
  { key: "Overview", icon: "📊" },
  { key: "CCTV", icon: "📹" },
  { key: "Inventory", icon: "📦" },
  { key: "Staff", icon: "👥" },
  { key: "Analytics", icon: "📈" },
]

export default function OwnerScreen() {
  const { state, dispatch } = useApp()
  const [tab, setTab] = useState("Overview")

  const renderContent = () => {
    switch (tab) {
      case "Overview":
        return <DashboardEnhanced />
      case "CCTV":
        return <CCTVTab />
      case "Inventory":
        return <InventoryAndMenu />
      case "Staff":
        return <StaffTab />
      case "Analytics":
        return <AnalyticsTab />
      default:
        return <DashboardEnhanced />
    }
  }

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        {renderContent()}
        <Text style={styles.footer}>© 2025 Teche-Innovation. All rights reserved.</Text>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {TABS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.navButton,
              tab === item.key && styles.navButtonActive
            ]}
            onPress={() => setTab(item.key)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.navIcon,
              tab === item.key && styles.navIconActive
            ]}>
              {item.icon}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  footer: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 32,
    opacity: 0.7,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 25,
    paddingBottom: 15,
    paddingTop: 15,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  navButtonActive: {
    backgroundColor: '#667EEA',
    borderColor: '#5A67D8',
    shadowColor: '#667EEA',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  navIcon: {
    fontSize: 20,
    color: '#8B949E',
  },
  navIconActive: {
    color: 'white',
  },
})