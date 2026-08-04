import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
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
import { suppressAuthRedirect } from "../../src/lib/authRedirectLock";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Eye toggle states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      suppressAuthRedirect(false);

      Alert.alert("Success", "Your password has been updated.", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
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
    <ImageBackground
      source={require("../../assets/Images/Forget-Change.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          "rgba(30,27,75,0.85)",
          "rgba(67,56,202,0.8)",
          "rgba(49,46,129,0.88)",
        ]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
              }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={{ alignItems: "center", paddingTop: 40 }}>
                <View
                  style={{
                    width: 100,
                    height: 100,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    source={require("../../assets/Images/MainLogo.png")}
                    style={{
                      width: "100%",
                      height: "100%",
                      resizeMode: "contain",
                    }}
                  />
                </View>
              </View>

              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  paddingHorizontal: 24,
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
                    Set New Password
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

                  {/* New Password */}
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
                      size={20}
                      color="rgba(255,255,255,0.6)"
                    />

                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="New Password"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={{
                        flex: 1,
                        color: "white",
                        marginLeft: 12,
                        fontSize: 15,
                      }}
                    />

                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={10}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="rgba(255,255,255,0.7)"
                      />
                    </Pressable>
                  </View>

                  {/* Confirm Password */}
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
                      size={20}
                      color="rgba(255,255,255,0.6)"
                    />

                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm New Password"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      style={{
                        flex: 1,
                        color: "white",
                        marginLeft: 12,
                        fontSize: 15,
                      }}
                    />

                    <Pressable
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      hitSlop={10}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={22}
                        color="rgba(255,255,255,0.7)"
                      />
                    </Pressable>
                  </View>

                  {/* Button */}
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
    </ImageBackground>
  );
};

export default ResetPassword;
