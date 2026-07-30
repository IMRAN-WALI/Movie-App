import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useLanguage } from "../../src/i18n/LanguageContext";
import { supabase } from "../../src/lib/supabase";
import {
  updateProfileDetails,
  uploadAvatar,
} from "../../src/services/profileService";

const EditProfile = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [localAvatarUri, setLocalAvatarUri] = useState(null);

  const load = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.back();
        return;
      }
      setUserId(user.id);
      setEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("display_name, bio, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || null);
      }
    } catch (e) {
      console.error("EditProfile load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t("edit_permission_title"), t("edit_permission_msg"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setLocalAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    const name = displayName.trim();
    if (!name) {
      Alert.alert(t("edit_name_required_title"), t("edit_name_required_msg"));
      return;
    }

    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (localAvatarUri) {
        finalAvatarUrl = await uploadAvatar(localAvatarUri, userId);
      }

      await updateProfileDetails({
        displayName: name,
        bio: bio.trim() || null,
        avatarUrl: finalAvatarUrl,
      });

      Alert.alert(t("edit_saved_title"), t("edit_saved_msg"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error("Save profile error:", e);
      Alert.alert(
        t("profile_error"),
        e instanceof Error ? e.message : t("edit_save_error"),
      );
    } finally {
      setSaving(false);
    }
  };

  const previewUri = localAvatarUri || avatarUrl;
  const initials = (displayName || email || "?")
    .trim()
    .slice(0, 1)
    .toUpperCase();

  if (loading) {
    return (
      <LinearGradient
        colors={["#3730a3", "#312e81"]}
        style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
      >
        <ActivityIndicator color="white" size="large" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#3730a3", "#312e81"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
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
              <Ionicons name="arrow-back" size={22} color="white" />
            </Pressable>

            <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
              {t("edit_title")}
            </Text>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: saving ? "rgba(99,102,241,0.4)" : "#6366f1",
              }}
            >
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text
                  style={{ color: "white", fontWeight: "700", fontSize: 14 }}
                >
                  {t("edit_save")}
                </Text>
              )}
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 40,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar */}
            <View
              style={{ alignItems: "center", marginTop: 12, marginBottom: 28 }}
            >
              <Pressable onPress={pickImage} style={{ position: "relative" }}>
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 55,
                    backgroundColor: "rgba(255,255,255,0.12)",
                    borderWidth: 2,
                    borderColor: "rgba(255,255,255,0.25)",
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {previewUri ? (
                    <Image
                      source={{ uri: previewUri }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <Text
                      style={{
                        color: "white",
                        fontSize: 40,
                        fontWeight: "800",
                      }}
                    >
                      {initials}
                    </Text>
                  )}
                </View>

                <View
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: "#6366f1",
                    borderWidth: 3,
                    borderColor: "#312e81",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </Pressable>

              <Pressable onPress={pickImage} style={{ marginTop: 12 }}>
                <Text
                  style={{
                    color: "#a5b4fc",
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {t("edit_change_photo")}
                </Text>
              </Pressable>
            </View>

            {/* Form card */}
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 20,
                padding: 18,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              {/* Display name */}
              <Text
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.6,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                {t("edit_display_name")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  height: 50,
                  marginBottom: 20,
                }}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color="rgba(255,255,255,0.5)"
                />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder={t("edit_display_name_placeholder")}
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  maxLength={40}
                  style={{
                    flex: 1,
                    color: "white",
                    marginLeft: 10,
                    fontSize: 15,
                  }}
                />
              </View>

              {/* Bio */}
              <Text
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.6,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                {t("edit_bio")}
              </Text>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  minHeight: 100,
                  marginBottom: 8,
                }}
              >
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder={t("edit_bio_placeholder")}
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  multiline
                  maxLength={160}
                  textAlignVertical="top"
                  style={{
                    color: "white",
                    fontSize: 15,
                    lineHeight: 22,
                    minHeight: 80,
                  }}
                />
              </View>
              <Text
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 11,
                  textAlign: "right",
                  marginBottom: 20,
                }}
              >
                {bio.length}/160
              </Text>

              {/* Email (read-only) */}
              <Text
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 0.6,
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}
              >
                {t("edit_email")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  height: 50,
                  opacity: 0.7,
                }}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="rgba(255,255,255,0.4)"
                />
                <Text
                  style={{
                    flex: 1,
                    color: "rgba(255,255,255,0.6)",
                    marginLeft: 10,
                    fontSize: 15,
                  }}
                  numberOfLines={1}
                >
                  {email}
                </Text>
                <Ionicons
                  name="lock-closed"
                  size={14}
                  color="rgba(255,255,255,0.3)"
                />
              </View>
              <Text
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 11,
                  marginTop: 6,
                }}
              >
                {t("edit_email_hint")}
              </Text>
            </View>

            {/* Save button (bottom) */}
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={{
                marginTop: 28,
                borderRadius: 16,
                overflow: "hidden",
                opacity: saving ? 0.7 : 1,
              }}
            >
              <LinearGradient
                colors={["#6366f1", "#4338ca"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 16,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "700",
                        fontSize: 16,
                      }}
                    >
                      {t("edit_save_changes")}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EditProfile;
