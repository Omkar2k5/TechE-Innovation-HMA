"use client"
import { useState } from "react"
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { COLORS } from "../store/app-store"
import FloorPlanEnhanced from "../features/manager/FloorPlanEnhanced"
import OrdersEnhanced from "../features/manager/OrdersEnhanced"
import WalkInReservation from "../features/manager/WalkInReservation"
import Staff from "../features/manager/Staff"
import Timers from "../features/manager/Timers"

export default function ManagerScreen() {
  const [tab, setTab] = useState("Floor Plan")
  const [activeTab, setActiveTab] = useState("floor")

  const tabs = [
    { key: "Floor Plan", icon: "🏢" },
    { key: "Orders", icon: "📋" },
    { key: "Walk-in", icon: "🚶" },
    { key: "Timers", icon: "⏱️" },
    { key: "Staff", icon: "👥" },
  ]

  const renderContent = () => {
    switch (tab) {
      case "Floor Plan":
        return <FloorPlanEnhanced />
      case "Orders":
        return <OrdersEnhanced />
      case "Walk-in":
        return <WalkInReservation />
      case "Timers":
        return <Timers />
      case "Staff":
        return <Staff />
      default:
        return <FloorPlanEnhanced />
    }
  }

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Manager Dashboard</Text>
          <Text style={styles.subtitle}>Manage your restaurant operations</Text>
        </View>

        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {tabs.map((item, index) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.navButton,
              tab === item.key && styles.navButtonActive
            ]}
            onPress={() => setTab(item.key)}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.black || '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '400',
  },
  contentContainer: {
    flex: 1,
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  navIcon: {
    fontSize: 18,
  },
})