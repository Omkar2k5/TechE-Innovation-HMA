import { View, Text, StyleSheet } from "react-native"
import { COLORS } from "../store/app-store"

export default function TimerBadge({ seconds = 0 }) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  let bg = "#e5e7eb" // gray
  if (seconds >= 1800) bg = COLORS.red + "33"
  else if (seconds >= 900)
    bg = "#f59e0b33" // amber-ish
  else bg = COLORS.green + "33"
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text}>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </Text>
    </View>
  )
}

export { TimerBadge }

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  text: { color: COLORS.black, fontVariant: ["tabular-nums"] },
})
