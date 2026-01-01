import { View, Text, StyleSheet, Pressable } from "react-native"
import { COLORS } from "../../store/app-store"

function CCTVCard({ title, status, tables, onToggle }) {
  return (
    <Pressable onPress={onToggle} style={styles.cctvCard}>
      <View style={styles.cctvHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status === "Live" ? COLORS.red : COLORS.primary }]}>
          <Text style={styles.statusBadgeText}>{status}</Text>
        </View>
      </View>
      <View style={styles.videoPlaceholder}>
        <Text style={styles.videoStatus}>{status === "Live" ? "🔴 Live Stream" : "📹 Recording"}</Text>
        {tables && tables.length > 0 && (
          <Text style={styles.tablesInfo}>Monitoring: Tables {tables.join(", ")}</Text>
        )}
      </View>
    </Pressable>
  )
}

export default function CCTVTab({ state, dispatch }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>CCTV Live Streams</Text>
      <View style={styles.cctvGrid}>
        {state.cameras.map((cam) => (
          <CCTVCard
            key={cam.id}
            title={cam.name}
            status={cam.status === "live" ? "Live" : "Rec"}
            tables={cam.tables}
            onToggle={() => {
              const nextStatus = cam.status === "live" ? "rec" : "live"
              dispatch({ type: "SET_CAMERA_STATUS", id: cam.id, status: nextStatus })
            }}
          />
        ))}
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
  cctvGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  cctvCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cctvHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.fg,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  statusBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  videoPlaceholder: {
    height: 120,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  videoStatus: {
    fontSize: 16,
    color: COLORS.muted,
    fontWeight: "500",
  },
  tablesInfo: {
    fontSize: 12,
    color: COLORS.muted,
  },
})