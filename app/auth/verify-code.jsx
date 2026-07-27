import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
import {
  sendPasswordReset,
  verifyResetCode,
} from "../../src/services/authService";
import { suppressAuthRedirect } from "../../src/lib/authRedirectLock";

const VerifyCode = () => {
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!code.trim() || code.trim().length < 6 || code.trim().length > 10) {
      Alert.alert("Invalid code", "Enter the code sent to your email.");
      return;
    }
    setLoading(true);
    suppressAuthRedirect(true);
    try {
      await verifyResetCode(email, code.trim());
      router.replace("/auth/reset-password");
    } catch (e) {
      suppressAuthRedirect(false);
      const msg = e instanceof Error ? e.message : "Try again";
      if (msg === "CODE_EXPIRED") {
        Alert.alert(
          "Code expired",
          "This code has expired. Request a new one.",
        );
      } else if (msg === "INVALID_CODE") {
        Alert.alert("Invalid code", "The code you entered is incorrect.");
      } else {
        Alert.alert("Couldn't verify code", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await sendPasswordReset(email);
      Alert.alert("Code sent", "A new code has been sent to your email.");
    } catch (e) {
      Alert.alert(
        "Couldn't resend",
        e instanceof Error ? e.message : "Try again",
      );
    } finally {
      setResending(false);
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
                onPress={() => safeBack("/auth/forgot-password")}
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
                <Ionicons
                  name="mail-open-outline"
                  size={40}
                  color="#818cf8"
                  style={{ marginBottom: 16 }}
                />
                <Text
                  style={{
                    color: "white",
                    fontSize: 24,
                    fontWeight: "800",
                    marginBottom: 6,
                  }}
                >
                  Enter the code
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    marginBottom: 24,
                    fontSize: 14,
                  }}
                >
                  We sent a 6-digit code to {email}. Enter it below.
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    marginBottom: 20,
                    height: 54,
                  }}
                >
                  <Ionicons
                    name="key-outline"
                    size={19}
                    color="rgba(255,255,255,0.6)"
                  />
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="Enter code"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="number-pad"
                    maxLength={10}
                    style={{
                      flex: 1,
                      color: "white",
                      marginLeft: 12,
                      fontSize: 18,
                      letterSpacing: 4,
                    }}
                  />
                </View>

                <Pressable onPress={handleVerify} disabled={loading}>
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
                        Verify Code
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={handleResend}
                  disabled={resending}
                  style={{ marginTop: 20, alignItems: "center" }}
                >
                  <Text style={{ color: "#a5b4fc", fontWeight: "600" }}>
                    {resending ? "Resending..." : "Didn't get a code? Resend"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default VerifyCode;
