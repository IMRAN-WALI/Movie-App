/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import React, { useState } from "react";
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
import {
  signInWithEmail,
  resendConfirmationEmail,
} from "../../src/services/authService";
import { safeBack } from "../../src/lib/safeBack";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      //  Home page
      router.replace("/(tabs)");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Try again";

      if (errorMessage === "EMAIL_NOT_CONFIRMED") {
        Alert.alert(
          "Email Not Confirmed",
          "Please confirm your email address first. Check your inbox for the confirmation link.",
          [
            {
              text: "Resend Link",
              onPress: async () => {
                try {
                  await resendConfirmationEmail(email.trim());
                  Alert.alert(
                    "Link Sent",
                    "A new confirmation link has been sent to your email.",
                  );
                } catch (error) {
                  Alert.alert(
                    "Error",
                    "Could not resend link. Please try again.",
                  );
                }
              },
            },
            { text: "OK", style: "cancel" },
          ],
        );
      } else if (errorMessage === "INVALID_CREDENTIALS") {
        Alert.alert(
          "Invalid Credentials",
          "The email or password you entered is incorrect. Please try again.",
        );
      } else {
        Alert.alert("Couldn't log in", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#1e1b4b", "#4338ca", "#312e81"]}
      style={{ flex: 1 }}
    >
      <View
        style={{
          position: "absolute",
          top: -80,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: "rgba(96,165,250,0.25)",
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: 60,
          left: -80,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: "rgba(139,92,246,0.25)",
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
                onPress={() => safeBack("/")}
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
                  Welcome back
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    marginBottom: 28,
                    fontSize: 14,
                  }}
                >
                  Log in to keep watching, rating, and sharing.
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    marginBottom: 16,
                    height: 54,
                    borderWidth: 1.5,
                    borderColor:
                      focusedField === "email" ? "#818cf8" : "transparent",
                  }}
                >
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
                    style={{
                      flex: 1,
                      color: "white",
                      marginLeft: 12,
                      fontSize: 15,
                    }}
                  />
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    marginBottom: 28,
                    height: 54,
                    borderWidth: 1.5,
                    borderColor:
                      focusedField === "password" ? "#818cf8" : "transparent",
                  }}
                >
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
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry={!showPassword}
                    style={{
                      flex: 1,
                      color: "white",
                      marginLeft: 12,
                      fontSize: 15,
                    }}
                  />
                  <Pressable
                    onPress={() => setShowPassword((s) => !s)}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={19}
                      color="rgba(255,255,255,0.6)"
                    />
                  </Pressable>
                </View>

                <Pressable
                  onPress={handleLogin}
                  disabled={loading}
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    shadowColor: "#4f46e5",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                  }}
                >
                  <LinearGradient
                    colors={["#6366f1", "#4338ca"]}
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
                        Log In
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push("/auth/signup")}
                style={{ marginTop: 24, alignItems: "center" }}
              >
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                  Don't have an account?{" "}
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    Sign up
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

export default Login;
