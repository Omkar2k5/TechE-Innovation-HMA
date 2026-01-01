import { View, Text, StyleSheet, Pressable } from "react-native"
import { useApp, COLORS } from "../../store/app-store"

export default function Staff() {
  const { state, dispatch } = useApp()

  return (
    <View>
      {state.staff.map((member) => (
        <Pressable
          key={member.id}
          onPress={() => dispatch({ type: "TOGGLE_STAFF_ACTIVE", staffId: member.id })}
          style={styles.staffCard}
        >
          <View>
            <Text style={styles.cardTitle}>{member.name}</Text>
            <Text style={styles.caption}>{member.role}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: member.active ? COLORS.green : COLORS.red }]}>
            <Text style={styles.statusText}>{member.active ? "Active" : "Inactive"}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  staffCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: COLORS.black },
  caption: { fontSize: 12, color: COLORS.gray },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "600", color: COLORS.white },
})
