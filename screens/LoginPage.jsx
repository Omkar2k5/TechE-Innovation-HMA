"use client"

import { useState } from "react"
import api from "../services/api"
import storage from "../services/storage"
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  Pressable,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const PRIMARY_BLUE = "#2F6FED"
const TEXT_DARK = "#0E141B"
const TEXT_MUTED = "#4A5568"
const BORDER = "#E5E7EB"
const SURFACE = "#FFFFFF"

// Role-based credentials
const CREDENTIALS = {
  Owner: { email: "admin@gmail.com", password: "123456", code: "PRA-17" },
  Manager: { email: "manager@gmail.com", password: "123456", code: "PRA-17" },
}

export default function LoginPage({ onLogin }) {
  const scheme = useColorScheme()
  const isDark = scheme === "dark"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [hotelCode, setHotelCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [role, setRole] = useState("Manager")
  const [roleOpen, setRoleOpen] = useState(false)

  const handleSubmit = async () => {
    // Validate inputs
    if (!email.trim()) {
      Alert.alert("Required Field", "Please enter your email")
      return
    }
    if (!password.trim()) {
      Alert.alert("Required Field", "Please enter your password")
      return
    }
    if (!hotelCode.trim()) {
      Alert.alert("Required Field", "Please enter hotel code")
      return
    }

    try {
      setSubmitting(true)
      
      // Call backend API
      const response = await api.auth.login(
        hotelCode.trim().toUpperCase(),
        role.toLowerCase(),
        email.trim().toLowerCase(),
        password
      )

      if (response.success && response.token) {
        // Save auth data to storage
        await storage.saveAuthData(
          response.token,
          response.user.role,
          response.hotel._id,
          response.hotel.name,
          response.user.email
        )

        Alert.alert(
          "Login Successful",
          `Welcome to ${response.hotel.name}!`,
          [{ text: "OK", onPress: () => onLogin?.(role) }]
        )
      } else {
        Alert.alert("Login Failed", response.message || "Invalid credentials")
      }
    } catch (error) {
      console.error("Login error:", error)
      Alert.alert(
        "Login Failed",
        error.message || "Unable to connect to server. Please check your internet connection."
      )
    } finally {
      setSubmitting(false)
    }
  }

  const onForgot = () => {
    Alert.alert("Forgot Password", "Password reset flow not implemented yet.")
  }

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: "#0B0F14" }]}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Brand */}
          <Text style={[styles.brand, isDark && { color: "#E6EDF3" }]}>TechE-innovation</Text>

          {/* Heading */}
          <Text style={[styles.title, isDark && { color: "#E6EDF3" }]}>Welcome Back!</Text>
          <Text style={[styles.subTitle, isDark && { color: "#A0AEC0" }]}>
            Manage your hotel operations seamlessly.
          </Text>

          {/* Illustration */}
          <View style={styles.imageWrapper}>
            <Image
              source={{
                uri: "https://media.istockphoto.com/id/472899538/photo/downtown-cleveland-hotel-entrance-and-waiting-taxi-cab.jpg?s=612x612&w=0&k=20&c=rz-WSe_6gKfkID6EL9yxCdN_UIMkXUBsr67884j-X9o=",
              }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          {/* Form card */}
          <View style={[styles.card, isDark && { backgroundColor: "#0F1720", borderColor: "#1F2937" }]}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDark && { color: "#CBD5E0" }]}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={role === "Owner" ? "admin@gmail.com" : "manager@gmail.com"}
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, isDark && styles.inputDark]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDark && { color: "#CBD5E0" }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="123456"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                secureTextEntry
                style={[styles.input, isDark && styles.inputDark]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDark && { color: "#CBD5E0" }]}>Hotel Unique Code</Text>
              <TextInput
                value={hotelCode}
                onChangeText={setHotelCode}
                placeholder="PRA-17"
                placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
                autoCapitalize="characters"
                style={[styles.input, isDark && styles.inputDark]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isDark && { color: "#CBD5E0" }]}>Role</Text>
              <Pressable
                onPress={() => setRoleOpen((v) => !v)}
                style={[
                  styles.input,
                  isDark && styles.inputDark,
                  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
                ]}
              >
                <Text style={[{ fontSize: 15 }, isDark ? { color: "#E6EDF3" } : { color: TEXT_DARK }]}>{role}</Text>
                <Text style={[{ fontSize: 18 }, isDark ? { color: "#93C5FD" } : { color: PRIMARY_BLUE }]}>
                  {roleOpen ? "▲" : "▼"}
                </Text>
              </Pressable>

              {roleOpen && (
                <View style={[styles.dropdown, isDark && { backgroundColor: "#0B1220", borderColor: "#334155" }]}>
                  {["Manager", "Owner"].map((opt) => (
                    <Pressable
                      key={opt}
                      onPress={() => {
                        setRole(opt)
                        setRoleOpen(false)
                      }}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        pressed && (isDark ? { backgroundColor: "#0F1720" } : { backgroundColor: "#F3F4F6" }),
                      ]}
                    >
                      <Text style={[{ fontSize: 15 }, isDark ? { color: "#E6EDF3" } : { color: TEXT_DARK }]}>
                        {opt}
                      </Text>
                      {role === opt && (
                        <Text style={{ fontSize: 13, fontWeight: "700", color: PRIMARY_BLUE }}>Selected</Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSubmit}
              disabled={submitting}
              style={[styles.button, submitting && { opacity: 0.7 }]}
            >
              <Text style={styles.buttonText}>{submitting ? "Signing in..." : "Login"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onForgot} style={styles.forgotWrap}>
              <Text style={[styles.forgotText, isDark && { color: "#93C5FD" }]}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.footer, isDark && { color: "#6B7280" }]}>© 2025 TechE-innovation. All rights reserved.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 36, alignItems: "center" },
  brand: { fontSize: 18, fontWeight: "700", color: PRIMARY_BLUE, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: TEXT_DARK, textAlign: "center" },
  subTitle: { fontSize: 15, color: TEXT_MUTED, textAlign: "center", marginTop: 8, marginBottom: 18 },
  imageWrapper: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  heroImage: { width: 260, height: 160 },
  card: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
  },
  fieldGroup: { marginBottom: 12 },
  label: { fontSize: 13, color: TEXT_DARK, marginBottom: 6, fontWeight: "600" },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: TEXT_DARK,
    backgroundColor: SURFACE,
  },
  inputDark: { borderColor: "#334155", backgroundColor: "#0B1220", color: "#E6EDF3" },
  button: {
    marginTop: 8,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_BLUE,
    elevation: 4,
    shadowColor: "#2F6FED",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  forgotWrap: { marginTop: 12, alignItems: "center" },
  forgotText: { color: PRIMARY_BLUE, fontSize: 14, fontWeight: "600" },
  footer: { fontSize: 12, color: TEXT_MUTED, textAlign: "center", marginTop: 18 },
  dropdown: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    marginTop: 6,
    overflow: "hidden",
    backgroundColor: SURFACE,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
})
