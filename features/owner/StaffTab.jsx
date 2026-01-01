import { View, Text, StyleSheet, Pressable } from "react-native"
import { COLORS } from "../../store/app-store"

function StaffItem({ name, role, status, hourlyRate, clockedIn, hoursToday, onToggle, onClock }) {
  return (
    <View style={styles.staffItem}>
      <View style={styles.staffAvatar}>
        <Text style={styles.avatarText}>{name.charAt(0)}</Text>
      </View>
      <View style={styles.staffInfo}>
        <Text style={styles.staffName}>{name}</Text>
        <Text style={styles.staffRole}>{role} • ${hourlyRate}/hr</Text>
        <Text style={styles.staffHours}>{hoursToday.toFixed(1)}h today</Text>
      </View>
      <View style={styles.staffActions}>
        <Pressable
          onPress={onToggle}
          style={[
            styles.statusButton,
            {
              backgroundColor: status === "Active" ? COLORS.green + "20" : COLORS.red + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.statusButtonText,
              {
                color: status === "Active" ? COLORS.green : COLORS.red,
              },
            ]}
          >
            {status}
          </Text>
        </Pressable>
        <Pressable
          onPress={onClock}
          style={[
            styles.clockButton,
            {
              backgroundColor: clockedIn ? COLORS.primary + "20" : COLORS.gray + "20",
            },
          ]}
        >
          <Text
            style={[
              styles.clockButtonText,
              {
                color: clockedIn ? COLORS.primary : COLORS.gray,
              },
            ]}
          >
            {clockedIn ? "Clock Out" : "Clock In"}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

export default function StaffTab({ state, dispatch }) {
  const totalHoursToday = state.staff.reduce((sum, s) => {
    const sessionHours = s.clockedInAt ? (Date.now() - s.clockedInAt) / 3600000 : 0
    return sum + s.minutesToday / 60 + sessionHours
  }, 0)

  const totalPayroll = state.staff.reduce((sum, s) => {
    const sessionHours = s.clockedInAt ? (Date.now() - s.clockedInAt) / 3600000 : 0
    const dailyHours = s.minutesToday / 60 + sessionHours
    return sum + dailyHours * s.hourlyRate
  }, 0)

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payroll & Attendance</Text>

      <View style={styles.payrollSummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Hours Today</Text>
          <Text style={styles.summaryValue}>{totalHoursToday.toFixed(1)}h</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Daily Payroll</Text>
          <Text style={styles.summaryValue}>${totalPayroll.toFixed(0)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Staff Management</Text>
        {state.staff.map((member) => (
          <StaffItem
            key={member.id}
            name={member.name}
            role={member.role}
            status={member.active ? "Active" : "Inactive"}
            hourlyRate={member.hourlyRate}
            clockedIn={!!member.clockedInAt}
            hoursToday={
              member.minutesToday / 60 + (member.clockedInAt ? (Date.now() - member.clockedInAt) / 3600000 : 0)
            }
            onToggle={() => dispatch({ type: "TOGGLE_STAFF_ACTIVE", staffId: member.id })}
            onClock={() => dispatch({ type: "CLOCK_TOGGLE", staffId: member.id })}
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
  payrollSummary: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.fg,
  },
  staffItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.fg,
    marginBottom: 2,
  },
  staffRole: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 2,
  },
  staffHours: {
    fontSize: 12,
    color: COLORS.muted,
  },
  staffActions: {
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 70,
    alignItems: "center",
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  clockButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 70,
    alignItems: "center",
  },
  clockButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
})