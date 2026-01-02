import { View, Text, StyleSheet, Pressable } from "react-native"
import { useState } from "react"
import { COLORS } from "../../store/app-store"

function TinyBarChart({ data, selected, onBarPress }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <View style={styles.chartContainer}>
      {data.map((d, i) => {
        const isSelected = selected === i
        return (
          <Pressable key={i} onPress={() => onBarPress?.(i)} style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  height: (d.value / max) * 80 + 10,
                  backgroundColor: isSelected ? COLORS.red : (d.color || COLORS.primary),
                }
              ]}
            />
            <Text style={styles.barLabel}>{d.label}</Text>
            <Text style={styles.barValue}>{d.value}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default function AnalyticsTab({ state }) {
  const [selectedBar, setSelectedBar] = useState(null)

  const activeTables = state.tables.filter((t) => t.status !== "vacant").length
  const totalTables = state.tables.length
  const totalCollection = state.completedOrders.reduce((sum, order) => sum + order.total, 0)

  const hourlyData = Array.from({ length: 12 }, (_, i) => ({
    label: `${8 + i}h`,
    value: Math.floor(Math.random() * 20) + 5,
    color: i < 4 ? COLORS.primary : i < 8 ? COLORS.yellow : COLORS.green,
  }))

  const performanceData = state.staff.map((s) => ({
    label: s.name.split(" ")[0],
    value: s.active ? Math.floor(Math.random() * 10) + 85 : Math.floor(Math.random() * 5) + 40,
    color: s.active ? COLORS.green : COLORS.red,
  }))

  const supplierScores = state.suppliers.map((sup) => ({
    label: sup.name.split(" ")[0],
    value: Math.floor(Math.random() * 50) + 50,
    color: COLORS.primary,
  }))

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Performance Analytics</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hourly Revenue (Today)</Text>
        <TinyBarChart data={hourlyData} selected={selectedBar} onBarPress={setSelectedBar} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Staff Performance Scores</Text>
        <TinyBarChart data={performanceData} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Supplier Comparison</Text>
        <TinyBarChart data={supplierScores} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Peak Hour</Text>
            <Text style={styles.metricValue}>12-1 PM</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Best Table</Text>
            <Text style={styles.metricValue}>Table 3</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Avg Order</Text>
            <Text style={styles.metricValue}>
              ${(totalCollection / Math.max(state.completedOrders.length, 1)).toFixed(0)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Occupancy</Text>
            <Text style={styles.metricValue}>{Math.round((activeTables / totalTables) * 100)}%</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.fg,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.fg,
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
    marginTop: 16,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
    maxWidth: 40,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: COLORS.primary,
  },
  barLabel: {
    fontSize: 10,
    color: COLORS.muted,
    marginBottom: 2,
  },
  barValue: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.fg,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: "45%",
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 4,
    fontWeight: "500",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.fg,
  },
})