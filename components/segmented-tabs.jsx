import { View, Text, Pressable, StyleSheet } from "react-native"
import { COLORS } from "../store/app-store"

export default function SegmentedTabs({ tabs, active, onChange }) {
  return (
    <View style={styles.row}>
      {tabs.map((t) => {
        const selected = t.key === active
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[styles.tab, selected && styles.tabActive]}
          >
            <Text style={[styles.tabText, selected && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export { SegmentedTabs }

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  tabActive: {
    backgroundColor: COLORS.primary + "22",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: "#111827",
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
})