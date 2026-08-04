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
import {
  changePasswordWithVerification,
  getCurrentUser,
} from "../../src/services/authService";

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      Alert.alert("Current Password", "Please enter your current password.");
      return;
    }

    if (!password.trim()) {
      Alert.alert("New Password", "Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Get current user to access email
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not found. Please login again.");
      }

      // Change password with verification
      await changePasswordWithVerification(
        user.email,
        currentPassword,
        password,
      );

      Alert.alert(
        "Success",
        "Password changed successfully. Please login again.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/auth/login");
            },
          },
        ],
      );
    } catch (error) {
      let errorMessage = "Unable to change password.";

      if (error instanceof Error) {
        if (error.message === "INCORRECT_PASSWORD") {
          errorMessage = "Current password is incorrect. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert("Error", errorMessage);
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
                justifyContent: "center",
                paddingHorizontal: 24,
              }}
            >
              <View style={{ alignItems: "center", marginBottom: 24 }}>
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
                    fontSize: 25,
                    fontWeight: "800",
                  }}
                >
                  Change Password
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    marginTop: 8,
                    marginBottom: 24,
                  }}
                >
                  Enter your password details below.
                </Text>

                {/* Current Password */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    marginBottom: 18,
                    height: 56,
                  }}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="rgba(255,255,255,0.6)"
                  />

                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Current Password"
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

                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="rgba(255,255,255,0.7)"
                    />
                  </Pressable>
                </View>

                {/* New Password */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    marginBottom: 18,
                    height: 56,
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
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
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
                    marginBottom: 30,
                    height: 56,
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
                    placeholder="Confirm Password"
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
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={22}
                      color="rgba(255,255,255,0.7)"
                    />
                  </Pressable>
                </View>

                <Pressable onPress={handleChangePassword} disabled={loading}>
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
                          fontSize: 16,
                          fontWeight: "700",
                        }}
                      >
                        Update Password
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
};

export default ChangePassword;
