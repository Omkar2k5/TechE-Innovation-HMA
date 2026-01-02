import { useState } from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import InventoryManagement from "./InventoryManagement"
import MenuManagement from "./MenuManagement"

const COLORS = {
  primary: "#2F6FED",
  white: "#FFFFFF",
  black: "#0E141B",
  lightGray: "#F3F4F6",
}

export default function InventoryAndMenu() {
  const [activeTab, setActiveTab] = useState("menu")

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <Pressable
          style={[styles.tab, activeTab === "menu" && styles.tabActive]}
          onPress={() => setActiveTab("menu")}
        >
          <Text style={[styles.tabText, activeTab === "menu" && styles.tabTextActive]}>
            🍽️ Menu Items
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "ingredients" && styles.tabActive]}
          onPress={() => setActiveTab("ingredients")}
        >
          <Text style={[styles.tabText, activeTab === "ingredients" && styles.tabTextActive]}>
            📦 Ingredients
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {activeTab === "menu" ? <MenuManagement /> : <InventoryManagement />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
})
