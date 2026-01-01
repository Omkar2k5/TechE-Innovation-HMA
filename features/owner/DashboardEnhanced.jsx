"use client"

import { useState, useEffect } from "react"
import { 
  View, Text, StyleSheet, ScrollView, RefreshControl, 
  ActivityIndicator, Pressable, Dimensions 
} from "react-native"
import api from "../../services/api"
import syncService from "../../services/syncService"

const COLORS = {
  primary: "#2F6FED",
  green: "#10B981",
  red: "#EF4444",
  yellow: "#F59E0B",
  gray: "#6B7280",
  white: "#FFFFFF",
  black: "#0E141B",
  lightGray: "#F3F4F6",
}

const STATUS_COLORS = {
  VACANT: { bg: "#D1FAE5", border: "#10B981", text: "#065F46" },
  OCCUPIED: { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" },
  RESERVED: { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
  MAINTENANCE: { bg: "#F3F4F6", border: "#6B7280", text: "#374151" },
}

const ORDER_STATUS_COLORS = {
  PENDING: { color: "#F59E0B" },
  PREPARING: { color: "#2F6FED" },
  READY: { color: "#10B981" },
  SERVED: { color: "#6B7280" },
}

const MetricCard = ({ title, value, subtitle, icon, color = COLORS.primary }) => (
  <View style={[styles.metricCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <Text style={styles.metricIcon}>{icon}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricTitle}>{title}</Text>
    {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
  </View>
)

const TableStatusCard = ({ table, orderTimer }) => {
  const statusColor = STATUS_COLORS[table.status] || STATUS_COLORS.VACANT
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (orderTimer) {
      const placedAt = new Date(orderTimer.placedAt)
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - placedAt.getTime()) / 1000)
        setElapsedSeconds(elapsed)
      }
      
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [orderTimer])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    return `${mins}m`
  }

  const getTimerColor = (seconds) => {
    if (seconds < 900) return COLORS.green
    if (seconds < 1800) return COLORS.yellow
    return COLORS.red
  }

  return (
    <View style={[styles.tableStatusCard, { backgroundColor: statusColor.bg, borderColor: statusColor.border }]}>
      <View style={styles.tableStatusHeader}>
        <Text style={[styles.tableStatusId, { color: statusColor.text }]}>{table.tableId}</Text>
        <View style={[styles.tableStatusDot, { backgroundColor: statusColor.border }]} />
      </View>
      <Text style={[styles.tableStatusText, { color: statusColor.text }]}>{table.status}</Text>
      <Text style={styles.tableCapacityText}>👥 {table.capacity}</Text>
      
      {orderTimer && (
        <View style={[styles.tableTimerBadge, { backgroundColor: getTimerColor(elapsedSeconds) }]}>
          <Text style={styles.tableTimerText}>⏱️ {formatTime(elapsedSeconds)}</Text>
          <Text style={styles.tableTimerStatus}>{orderTimer.status}</Text>
        </View>
      )}
    </View>
  )
}

export default function DashboardEnhanced() {
  const [analytics, setAnalytics] = useState(null)
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState("today")

  useEffect(() => {
    loadData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [timeRange])

  const loadData = async () => {
    try {
      if (!refreshing) setLoading(true)
      
      const [analyticsData, tablesData, ordersData] = await Promise.all([
        api.analytics.getDashboard(timeRange).catch(() => null),
        syncService.fetchAndCacheTables(),
        syncService.fetchAndCacheOrders(),
      ])

      if (analyticsData?.data) {
        setAnalytics(analyticsData.data)
      }

      if (tablesData) {
        setTables(tablesData.tables || [])
      }

      if (ordersData) {
        setOrders(ordersData.orders || [])
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  const getOrderTimers = () => {
    const timers = {}
    orders.forEach(order => {
      if (order.orderStatus !== "SERVED" && order.orderStatus !== "CANCELLED" && order.isActive) {
        timers[order.tableId] = {
          orderId: order.orderId,
          status: order.orderStatus,
          placedAt: order.orderTime?.placedAt || order.createdAt,
        }
      }
    })
    return timers
  }

  const orderTimers = getOrderTimers()

  // Calculate stats
  const tableStats = {
    total: tables.length,
    vacant: tables.filter(t => t.status === "VACANT" && t.isActive).length,
    occupied: tables.filter(t => t.status === "OCCUPIED" && t.isActive).length,
    reserved: tables.filter(t => t.status === "RESERVED" && t.isActive).length,
    maintenance: tables.filter(t => t.status === "MAINTENANCE" && t.isActive).length,
  }

  const orderStats = {
    pending: orders.filter(o => o.orderStatus === "PENDING" && o.isActive).length,
    preparing: orders.filter(o => o.orderStatus === "PREPARING" && o.isActive).length,
    ready: orders.filter(o => o.orderStatus === "READY" && o.isActive).length,
    served: orders.filter(o => o.orderStatus === "SERVED" && o.isActive).length,
  }

  const occupancyRate = tableStats.total > 0 
    ? ((tableStats.occupied / tableStats.total) * 100).toFixed(1) 
    : "0.0"

  const totalRevenue = analytics?.revenue?.total || 0
  const pendingAmount = analytics?.overview?.pendingAmount || 0
  const avgTurnaround = analytics?.overview?.avgTurnaroundMinutes || 0

  if (loading && !analytics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Overview</Text>
        <Text style={styles.headerSubtitle}>Real-time analytics and performance</Text>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeBar}>
        {["today", "7d", "30d"].map(range => (
          <Pressable
            key={range}
            onPress={() => setTimeRange(range)}
            style={[
              styles.timeRangeBtn,
              timeRange === range && styles.timeRangeBtnActive,
            ]}
          >
            <Text style={[
              styles.timeRangeBtnText,
              timeRange === range && styles.timeRangeBtnTextActive,
            ]}>
              {range === "today" ? "Today" : range === "7d" ? "7 Days" : "30 Days"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <MetricCard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          subtitle={`${tableStats.occupied}/${tableStats.total} tables`}
          icon="📊"
          color={parseFloat(occupancyRate) > 80 ? COLORS.red : parseFloat(occupancyRate) > 50 ? COLORS.yellow : COLORS.green}
        />
        <MetricCard
          title="Total Revenue"
          value={`₹${totalRevenue.toFixed(2)}`}
          subtitle={`${analytics?.revenue?.billCount || 0} bills paid`}
          icon="💰"
          color={COLORS.green}
        />
        <MetricCard
          title="Pending Amount"
          value={`₹${pendingAmount.toFixed(2)}`}
          subtitle={`${orderStats.pending + orderStats.preparing + orderStats.ready} active orders`}
          icon="⏳"
          color={COLORS.yellow}
        />
        <MetricCard
          title="Avg Turnaround"
          value={`${avgTurnaround} min`}
          subtitle={`${orderStats.served} completed`}
          icon="⚡"
          color={avgTurnaround <= 15 ? COLORS.green : avgTurnaround <= 25 ? COLORS.yellow : COLORS.red}
        />
      </View>

      {/* Table Status Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Table Status Summary</Text>
        <View style={styles.statusSummary}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS.VACANT.border }]} />
            <Text style={styles.statusLabel}>Vacant</Text>
            <Text style={styles.statusValue}>{tableStats.vacant}</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS.OCCUPIED.border }]} />
            <Text style={styles.statusLabel}>Occupied</Text>
            <Text style={styles.statusValue}>{tableStats.occupied}</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS.RESERVED.border }]} />
            <Text style={styles.statusLabel}>Reserved</Text>
            <Text style={styles.statusValue}>{tableStats.reserved}</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS.MAINTENANCE.border }]} />
            <Text style={styles.statusLabel}>Maintenance</Text>
            <Text style={styles.statusValue}>{tableStats.maintenance}</Text>
          </View>
        </View>
      </View>

      {/* Live Table Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Table Overview</Text>
        <Text style={styles.sectionSubtitle}>Real-time status and order timers</Text>
        <View style={styles.tablesGrid}>
          {tables.slice(0, 12).map(table => (
            <TableStatusCard
              key={table.tableId}
              table={table}
              orderTimer={orderTimers[table.tableId]}
            />
          ))}
        </View>
        {tables.length > 12 && (
          <Text style={styles.moreTablesText}>+{tables.length - 12} more tables</Text>
        )}
      </View>

      {/* Order Status Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        <View style={styles.orderStatusGrid}>
          <View style={[styles.orderStatusCard, { backgroundColor: ORDER_STATUS_COLORS.PENDING.color + "20" }]}>
            <Text style={[styles.orderStatusValue, { color: ORDER_STATUS_COLORS.PENDING.color }]}>
              {orderStats.pending}
            </Text>
            <Text style={styles.orderStatusLabel}>Pending</Text>
          </View>
          <View style={[styles.orderStatusCard, { backgroundColor: ORDER_STATUS_COLORS.PREPARING.color + "20" }]}>
            <Text style={[styles.orderStatusValue, { color: ORDER_STATUS_COLORS.PREPARING.color }]}>
              {orderStats.preparing}
            </Text>
            <Text style={styles.orderStatusLabel}>Preparing</Text>
          </View>
          <View style={[styles.orderStatusCard, { backgroundColor: ORDER_STATUS_COLORS.READY.color + "20" }]}>
            <Text style={[styles.orderStatusValue, { color: ORDER_STATUS_COLORS.READY.color }]}>
              {orderStats.ready}
            </Text>
            <Text style={styles.orderStatusLabel}>Ready</Text>
          </View>
          <View style={[styles.orderStatusCard, { backgroundColor: ORDER_STATUS_COLORS.SERVED.color + "20" }]}>
            <Text style={[styles.orderStatusValue, { color: ORDER_STATUS_COLORS.SERVED.color }]}>
              {orderStats.served}
            </Text>
            <Text style={styles.orderStatusLabel}>Served</Text>
          </View>
        </View>
      </View>

      {/* Performance Insights */}
      {analytics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Peak Hours</Text>
            <Text style={styles.insightValue}>
              {analytics.peakHours || "12:00 PM - 2:00 PM"}
            </Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Average Order Value</Text>
            <Text style={styles.insightValue}>
              ₹{(totalRevenue / Math.max(orderStats.served, 1)).toFixed(2)}
            </Text>
          </View>
          <View style={styles.insightCard}>
            <Text style={styles.insightLabel}>Table Turnover Rate</Text>
            <Text style={styles.insightValue}>
              {(orderStats.served / Math.max(tableStats.total, 1)).toFixed(1)} orders/table
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.black,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  timeRangeBar: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  timeRangeBtn: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
    alignItems: "center",
  },
  timeRangeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  timeRangeBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray,
  },
  timeRangeBtnTextActive: {
    color: COLORS.white,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
  },
  metricCard: {
    width: "48%",
    margin: "1%",
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 10,
    color: COLORS.gray,
  },
  section: {
    padding: 16,
    backgroundColor: COLORS.white,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 12,
  },
  statusSummary: {
    marginTop: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
  },
  tablesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tableStatusCard: {
    width: "31%",
    margin: "1%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  tableStatusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  tableStatusId: {
    fontSize: 16,
    fontWeight: "700",
  },
  tableStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tableStatusText: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
  },
  tableCapacityText: {
    fontSize: 10,
    color: COLORS.gray,
  },
  tableTimerBadge: {
    marginTop: 8,
    padding: 6,
    borderRadius: 6,
  },
  tableTimerText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.white,
  },
  tableTimerStatus: {
    fontSize: 8,
    color: COLORS.white,
    marginTop: 2,
  },
  moreTablesText: {
    textAlign: "center",
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 12,
  },
  orderStatusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  orderStatusCard: {
    width: "48%",
    margin: "1%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  orderStatusValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  orderStatusLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  insightCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  insightLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.black,
  },
})
