/* eslint-disable react/no-unescaped-entities */
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signUpWithEmail } from "../../src/services/authService";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const lastAttemptTime = useRef(0);
  const countdownInterval = useRef(null);

  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  const startCountdown = (minutes) => {
    let remaining = minutes * 60;
    setCountdown(remaining);

    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    countdownInterval.current = setInterval(() => {
      remaining--;
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(countdownInterval.current);
        setRateLimitExceeded(false);
        setCountdown(0);
      }
    }, 1000);
  };

  const handleSignup = async () => {
    if (rateLimitExceeded) {
      const minutes = Math.ceil(countdown / 60);
      Alert.alert(
        "Rate Limit Exceeded",
        `Please wait ${minutes} minute${minutes > 1 ? "s" : ""} before trying again.`,
        [{ text: "OK" }],
      );
      return;
    }

    if (!username.trim() || !email.trim() || !password) {
      Alert.alert("Missing info", "Fill in username, email, and password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    const now = Date.now();
    if (now - lastAttemptTime.current < 5000) {
      Alert.alert(
        "Please wait",
        "You're trying too quickly. Please wait a moment.",
      );
      return;
    }

    lastAttemptTime.current = now;
    setLoading(true);

    try {
      await signUpWithEmail(email.trim(), password, username.trim());

      // Form clear
      setUsername("");
      setEmail("");
      setPassword("");

      // ✅ Direct Login Page (No Alert)
      router.replace("/auth/login");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Try again";

      if (
        errorMessage === "RATE_LIMIT_EXCEEDED" ||
        errorMessage.toLowerCase().includes("rate limit") ||
        errorMessage.toLowerCase().includes("too many")
      ) {
        setRateLimitExceeded(true);
        startCountdown(60);
        Alert.alert(
          "Too Many Attempts",
          "You've exceeded the email rate limit. Please wait 60 minutes before trying again.",
          [{ text: "OK" }],
        );
      } else if (
        errorMessage === "EMAIL_ALREADY_REGISTERED" ||
        errorMessage.toLowerCase().includes("already registered")
      ) {
        Alert.alert(
          "Email Already Registered",
          "This email is already registered. Please login instead.",
          [
            { text: "Login", onPress: () => router.replace("/auth/login") },
            { text: "OK", style: "cancel" },
          ],
        );
      } else {
        Alert.alert("Couldn't sign up", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = (name) => ({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 54,
    borderWidth: 1.5,
    borderColor: focusedField === name ? "#818cf8" : "transparent",
  });

  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <LinearGradient
      colors={["#1e1b4b", "#4338ca", "#312e81"]}
      style={{ flex: 1 }}
    >
      <View
        style={{
          position: "absolute",
          top: -70,
          left: -60,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: "rgba(139,92,246,0.25)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -40,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "rgba(96,165,250,0.2)",
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ padding: 24, paddingTop: 8 }}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="chevron-back" size={22} color="white" />
              </Pressable>
            </View>

            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 24,
                  backgroundColor: "rgba(255,255,255,0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                  shadowColor: "#6366f1",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                }}
              >
                <Image
                  source={require("../../assets/Images/MainLogo.png")}
                  style={{ width: "68%", height: "68%", resizeMode: "contain" }}
                />
              </View>
            </View>

            <View
              style={{
                flex: 1,
                paddingHorizontal: 24,
                justifyContent: "center",
                paddingBottom: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderRadius: 28,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 26,
                    fontWeight: "800",
                    marginBottom: 6,
                  }}
                >
                  Create your account
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    marginBottom: 24,
                    fontSize: 14,
                  }}
                >
                  Join and start building your taste profile.
                </Text>

                {rateLimitExceeded && (
                  <View
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.2)",
                      borderColor: "rgba(239, 68, 68, 0.5)",
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 16,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="time-outline" size={20} color="#f87171" />
                    <Text
                      style={{
                        color: "#fca5a5",
                        marginLeft: 10,
                        fontSize: 13,
                        flex: 1,
                      }}
                    >
                      Rate limit active. Try again in {formatCountdown()}
                    </Text>
                  </View>
                )}

                <View style={fieldStyle("username")}>
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color="rgba(255,255,255,0.6)"
                  />
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Username"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    autoCapitalize="none"
                    editable={!rateLimitExceeded && !loading}
                    style={{
                      flex: 1,
                      color: "white",
                      marginLeft: 12,
                      fontSize: 15,
                      opacity: rateLimitExceeded || loading ? 0.5 : 1,
                    }}
                  />
                </View>

                <View style={fieldStyle("email")}>
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color="rgba(255,255,255,0.6)"
                  />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Email address"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!rateLimitExceeded && !loading}
                    style={{
                      flex: 1,
                      color: "white",
                      marginLeft: 12,
                      fontSize: 15,
                      opacity: rateLimitExceeded || loading ? 0.5 : 1,
                    }}
                  />
                </View>

                <View style={{ ...fieldStyle("password"), marginBottom: 28 }}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color="rgba(255,255,255,0.6)"
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="At least 6 characters"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry={!showPassword}
                    editable={!rateLimitExceeded && !loading}
                    style={{
                      flex: 1,
                      color: "white",
                      marginLeft: 12,
                      fontSize: 15,
                      opacity: rateLimitExceeded || loading ? 0.5 : 1,
                    }}
                  />
                  <Pressable
                    onPress={() => setShowPassword((s) => !s)}
                    hitSlop={10}
                    disabled={rateLimitExceeded || loading}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={19}
                      color="rgba(255,255,255,0.6)"
                    />
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleSignup}
                  disabled={loading || rateLimitExceeded}
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#4f46e5",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    opacity: rateLimitExceeded || loading ? 0.5 : 1,
                  }}
                >
                  <LinearGradient
                    colors={
                      rateLimitExceeded || loading
                        ? ["#6b7280", "#4b5563"]
                        : ["#6366f1", "#4338ca"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 17, alignItems: "center" }}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "700",
                          fontSize: 16,
                        }}
                      >
                        {rateLimitExceeded
                          ? "Please Wait..."
                          : "Create Account"}
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>

                {rateLimitExceeded && (
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        "Rate Limit",
                        `Please wait ${Math.ceil(countdown / 60)} minutes before trying again.`,
                        [{ text: "OK" }],
                      );
                    }}
                    style={{ marginTop: 12, alignItems: "center" }}
                  >
                    <Text style={{ color: "#f87171", fontSize: 13 }}>
                      Why can't I sign up?
                    </Text>
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => router.push("/auth/login")}
                style={{ marginTop: 24, alignItems: "center" }}
              >
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                  Already have an account?{" "}
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    Log in
                  </Text>
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default Signup;
