import { View, Text, StyleSheet, Pressable } from "react-native"
import { useApp, COLORS } from "../../store/app-store"
import TimerBadge from "../../components/timer-badge"

export default function Timers() {
  const { state, dispatch } = useApp()

  return (
    <View>
      {state.tables
        .filter((t) => t.timer.elapsedSec > 0 || t.timer.running)
        .map((table) => (
          <View key={table.id} style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <View>
                <Text style={styles.cardTitle}>Table {table.id}</Text>
                <Text style={styles.caption}>{table.status}</Text>
              </View>
              <TimerBadge seconds={table.timer.elapsedSec} />
            </View>
            <View style={styles.timerActions}>
              <Pressable
                onPress={() =>
                  dispatch({ type: table.timer.running ? "STOP_TIMER" : "START_ORDER", tableId: table.id })
                }
                style={[styles.actionBtn, { backgroundColor: table.timer.running ? COLORS.red : COLORS.green }]}
              >
                <Text style={styles.actionBtnText}>{table.timer.running ? "Stop" : "Start"}</Text>
              </Pressable>
              <Pressable
                onPress={() => dispatch({ type: "RESET_TIMER", tableId: table.id })}
                style={[styles.actionBtn, { backgroundColor: COLORS.gray }]}
              >
                <Text style={styles.actionBtnText}>Reset</Text>
              </Pressable>
            </View>
          </View>
        ))}
    </View>
  )
}

const styles = StyleSheet.create({
  timerCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  timerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: COLORS.black },
  caption: { fontSize: 12, color: COLORS.gray },
  timerActions: { flexDirection: "row", gap: 8 },
  actionBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: COLORS.white, fontWeight: "600" },
})
