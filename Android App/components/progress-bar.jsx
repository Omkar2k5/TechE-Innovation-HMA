import { View } from "react-native"

export function ProgressBar({ value, max = 100 }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)))
  return (
    <View style={{ height: 8, backgroundColor: "#f3f4f6", borderRadius: 9999, overflow: "hidden" }}>
      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: "#2563eb" }} />
    </View>
  )
}
