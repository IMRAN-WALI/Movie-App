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
import { updatePassword } from "../../src/services/authService";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Please re-enter to confirm.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      Alert.alert("Success", "Your password has been updated.", [
        { text: "OK", onPress: () => router.replace("/(tabs)") },
      ]);
    } catch (e) {
      Alert.alert(
        "Couldn't reset password",
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
                    fontSize: 24,
                    fontWeight: "800",
                    marginBottom: 6,
                  }}
                >
                  Set new password
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    marginBottom: 24,
                    fontSize: 14,
                  }}
                >
                  Choose a new password for your account.
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
                    placeholder="New password"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry
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
                  }}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color="rgba(255,255,255,0.6)"
                  />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    secureTextEntry
                    style={{
                      flex: 1,
                      color: "white",
                      marginLeft: 12,
                      fontSize: 15,
                    }}
                  />
                </View>

                <Pressable onPress={handleReset} disabled={loading}>
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
                        Update Password
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default ResetPassword;
