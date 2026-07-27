/* eslint-disable react/no-unescaped-entities */
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { safeBack } from "../../src/lib/safeBack";
import { sendPasswordReset } from "../../src/services/authService";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Enter your account email.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      router.push({
        pathname: "/auth/verify-code",
        params: { email: email.trim() },
      });
    } catch (e) {
      Alert.alert(
        "Couldn't send reset link",
        e instanceof Error ? e.message : "Try again",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#1e1b4b", "#4338ca", "#312e81"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={{ padding: 24, paddingTop: 8 }}>
              <Pressable
                onPress={() => safeBack("/auth/login")}
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
                {!sent ? (
                  <>
                    <Text
                      style={{
                        color: "white",
                        fontSize: 24,
                        fontWeight: "800",
                        marginBottom: 6,
                      }}
                    >
                      Reset your password
                    </Text>
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.65)",
                        marginBottom: 24,
                        fontSize: 14,
                      }}
                    >
                      Enter your email and we'll send you a reset link.
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "rgba(255,255,255,0.08)",
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        marginBottom: 24,
                        height: 54,
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

                    <Pressable onPress={handleSend} disabled={loading}>
                      <LinearGradient
                        colors={["#6366f1", "#4338ca"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          borderRadius: 16,
                          paddingVertical: 17,
                          alignItems: "center",
                        }}
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
                            Send Reset Link
                          </Text>
                        )}
                      </LinearGradient>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="mail-open-outline"
                      size={40}
                      color="#818cf8"
                      style={{ marginBottom: 16 }}
                    />
                    <Text
                      style={{
                        color: "white",
                        fontSize: 22,
                        fontWeight: "800",
                        marginBottom: 8,
                      }}
                    >
                      Check your inbox
                    </Text>
                    <Text
                      style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}
                    >
                      We sent a password reset link to {email}. Tap it to set a
                      new password.
                    </Text>
                    <Pressable
                      onPress={() => router.replace("/auth/login")}
                      style={{ marginTop: 24, alignItems: "center" }}
                    >
                      <Text style={{ color: "#818cf8", fontWeight: "700" }}>
                        Back to Login
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ForgotPassword;
