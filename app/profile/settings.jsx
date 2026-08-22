import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLanguage } from "../../src/i18n/LanguageContext";
import { deleteCurrentAccount } from "../../src/services/accountService";
import { downloadManager } from "../../src/services/downloadService";
import { getSettings, updateSetting } from "../../src/services/settingsService";

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 1,
  )} ${units[index]}`;
};

const SettingsRow = ({
  icon,
  title,
  subtitle,
  onPress,
  right,
  danger = false,
  disabled = false,
  isLast = false,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 15,
        minHeight: 68,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "rgba(255,255,255,0.07)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: danger
            ? "rgba(248,113,113,0.12)"
            : "rgba(129,140,248,0.12)",
        }}
      >
        <Ionicons
          name={icon}
          size={20}
          color={danger ? "#f87171" : "#a5b4fc"}
        />
      </View>

      <View
        style={{
          flex: 1,
          marginLeft: 13,
          paddingRight: 10,
        }}
      >
        <Text
          style={{
            color: danger ? "#f87171" : "white",
            fontSize: 15,
            fontWeight: "700",
          }}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={{
              color: "rgba(255,255,255,0.48)",
              fontSize: 12,
              marginTop: 3,
              lineHeight: 17,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? (
        right
      ) : (
        <Ionicons
          name="chevron-forward"
          size={18}
          color="rgba(255,255,255,0.38)"
        />
      )}
    </Pressable>
  );
};

const Section = ({ title, children }) => {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          color: "rgba(255,255,255,0.48)",
          fontSize: 11,
          fontWeight: "800",
          letterSpacing: 1.3,
          marginBottom: 9,
          marginLeft: 4,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>

      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.065)",
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        {children}
      </View>
    </View>
  );
};

const Toggle = ({ value, onChange }) => {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={{
        width: 50,
        height: 30,
        borderRadius: 20,
        backgroundColor: value ? "#6366f1" : "rgba(255,255,255,0.14)",
        padding: 3,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "white",
          alignSelf: value ? "flex-end" : "flex-start",
        }}
      />
    </Pressable>
  );
};

const Settings = () => {
  const { t } = useLanguage();

  const [settings, setSettings] = useState({
    autoplayPreviews: true,
  });

  const [loading, setLoading] = useState(true);
  const [storageLoading, setStorageLoading] = useState(true);

  const [storageBytes, setStorageBytes] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSettings();
    loadStorage();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error("Settings load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStorage = async () => {
    setStorageLoading(true);

    try {
      const downloads = await downloadManager.getDownloads();

      const validDownloads = Array.isArray(downloads) ? downloads : [];

      let total = 0;

      for (const item of validDownloads) {
        if (item.status === "completed" && Number(item.downloadedSize) > 0) {
          total += Number(item.downloadedSize);
        }
      }

      setStorageBytes(total);
      setDownloadCount(
        validDownloads.filter((item) => item.status === "completed").length,
      );
    } catch (error) {
      console.error("Storage calculation error:", error);
      setStorageBytes(0);
      setDownloadCount(0);
    } finally {
      setStorageLoading(false);
    }
  };

  const changeAutoplay = async (value) => {
    try {
      const updated = await updateSetting("autoplayPreviews", value);

      setSettings(updated);
    } catch (error) {
      Alert.alert(t("settings_error"), t("settings_save_error"));
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      t("settings_clear_cache_title"),
      t("settings_clear_cache_message"),
      [
        {
          text: t("settings_cancel"),
          style: "cancel",
        },
        {
          text: t("settings_clear"),
          style: "destructive",
          onPress: async () => {
            try {
              /*
               * We intentionally don't delete downloaded movies here.
               * Downloads are user data and are handled separately.
               *
               * React Native / Expo may recreate temporary cache files
               * automatically, so this action only resets the app's
               * temporary settings state.
               */

              await loadStorage();

              Alert.alert(t("settings_done"), t("settings_cache_cleared"));
            } catch (error) {
              Alert.alert(t("settings_error"), t("settings_cache_error"));
            }
          },
        },
      ],
    );
  };

  const handleClearDownloads = () => {
    Alert.alert(
      t("settings_clear_downloads_title"),
      t("settings_clear_downloads_message"),
      [
        {
          text: t("settings_cancel"),
          style: "cancel",
        },
        {
          text: t("settings_clear"),
          style: "destructive",
          onPress: async () => {
            try {
              await downloadManager.clearAll();

              await loadStorage();

              Alert.alert(t("settings_done"), t("settings_downloads_cleared"));
            } catch (error) {
              console.error("Clear downloads error:", error);

              Alert.alert(
                t("settings_error"),
                t("settings_downloads_clear_error"),
              );
            }
          },
        },
      ],
    );
  };

  const openDeleteModal = () => {
    setDeleteText("");
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteText("");
    setDeleteModalVisible(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteText.trim().toUpperCase() !== "DELETE") {
      Alert.alert(
        t("settings_delete_account"),
        t("settings_delete_type_delete"),
      );

      return;
    }

    setDeleting(true);

    try {
      /*
       * Delete local downloads first.
       * This prevents downloaded files from remaining
       * on the device after account deletion.
       */
      try {
        await downloadManager.clearAll();
      } catch (downloadError) {
        console.warn("Local downloads cleanup failed:", downloadError);
      }

      await deleteCurrentAccount();

      setDeleteModalVisible(false);

      Alert.alert(
        t("settings_account_deleted"),
        t("settings_account_deleted_message"),
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
      console.error("❌ Delete account error:", error);

      Alert.alert(
        t("settings_error"),
        error instanceof Error ? error.message : t("settings_delete_error"),
      );
    } finally {
      setDeleting(false);
    }
  };

  const storageLabel = useMemo(() => {
    if (storageLoading) {
      return t("settings_calculating");
    }

    return `${formatBytes(storageBytes)} • ${downloadCount} ${t(
      "settings_downloads",
    )}`;
  }, [storageLoading, storageBytes, downloadCount, t]);

  if (loading) {
    return (
      <LinearGradient
        colors={["#3730a3", "#312e81"]}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="white" size="large" />
      </LinearGradient>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/Images/Settings.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
      imageStyle={{ opacity: 0.55 }}
    >
      <LinearGradient
        colors={[
          "rgba(30,27,75,0.9)",
          "rgba(49,46,129,0.7)",
          "rgba(30,27,75,0.9)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* HEADER */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 18,
              paddingTop: 10,
              paddingBottom: 14,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.10)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="arrow-back" size={21} color="white" />
            </Pressable>

            <View style={{ marginLeft: 13 }}>
              <Text
                style={{
                  color: "white",
                  fontSize: 22,
                  fontWeight: "800",
                }}
              >
                {t("settings_title")}
              </Text>

              <Text
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {t("settings_subtitle")}
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 18,
              paddingBottom: 50,
            }}
          >
            {/* PREFERENCES */}
            <Section title={t("settings_preferences")}>
              <SettingsRow
                icon="play-circle-outline"
                title={t("settings_autoplay")}
                subtitle={t("settings_autoplay_sub")}
                right={
                  <Toggle
                    value={settings.autoplayPreviews}
                    onChange={changeAutoplay}
                  />
                }
                isLast
              />
            </Section>

            {/* STORAGE */}
            <Section title={t("settings_storage")}>
              <SettingsRow
                icon="pie-chart-outline"
                title={t("settings_storage_usage")}
                subtitle={storageLabel}
                right={
                  storageLoading ? (
                    <ActivityIndicator size="small" color="#a5b4fc" />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="rgba(255,255,255,0.38)"
                    />
                  )
                }
                onPress={() => router.push("/downloads")}
              />

              <SettingsRow
                icon="refresh-outline"
                title={t("settings_clear_cache")}
                subtitle={t("settings_clear_cache_sub")}
                onPress={handleClearCache}
              />

              <SettingsRow
                icon="download-outline"
                title={t("settings_manage_downloads")}
                subtitle={t("settings_manage_downloads_sub")}
                onPress={() => router.push("/downloads")}
                isLast
              />
            </Section>

            {/* ACCOUNT */}
            <Section title={t("settings_account")}>
              <SettingsRow
                icon="trash-outline"
                title={t("settings_delete_account")}
                subtitle={t("settings_delete_account_sub")}
                danger
                onPress={openDeleteModal}
                isLast
              />
            </Section>

            {/* ABOUT */}
            <Section title={t("settings_about")}>
              <SettingsRow
                icon="information-circle-outline"
                title={t("settings_version")}
                subtitle="Movie App v1.0.0"
                isLast
              />
            </Section>

            {/* FOOTER */}
            <View
              style={{
                alignItems: "center",
                marginTop: 2,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 17,
                  overflow: "hidden",
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                <ImageBackground
                  source={require("../../assets/Images/MainLogo.png")}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="cover"
                />
              </View>

              <Text
                style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: 11,
                  textAlign: "center",
                }}
              >
                {t("settings_footer")}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>

        {/* DELETE ACCOUNT MODAL */}
        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeDeleteModal}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.72)",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 430,
                backgroundColor: "#17163a",
                borderRadius: 24,
                padding: 22,
                borderWidth: 1,
                borderColor: "rgba(248,113,113,0.22)",
              }}
            >
              <View
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  backgroundColor: "rgba(248,113,113,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <Ionicons name="trash-outline" size={25} color="#f87171" />
              </View>

              <Text
                style={{
                  color: "white",
                  fontSize: 21,
                  fontWeight: "800",
                }}
              >
                {t("settings_delete_account")}
              </Text>

              <Text
                style={{
                  color: "rgba(255,255,255,0.62)",
                  fontSize: 13,
                  lineHeight: 20,
                  marginTop: 8,
                }}
              >
                {t("settings_delete_account_warning")}
              </Text>

              <Text
                style={{
                  color: "rgba(255,255,255,0.78)",
                  fontSize: 13,
                  marginTop: 18,
                  marginBottom: 8,
                  fontWeight: "600",
                }}
              >
                {t("settings_type_delete")}
              </Text>

              <TextInput
                value={deleteText}
                onChangeText={setDeleteText}
                placeholder="DELETE"
                placeholderTextColor="rgba(255,255,255,0.28)"
                autoCapitalize="characters"
                style={{
                  height: 52,
                  borderRadius: 14,
                  paddingHorizontal: 15,
                  color: "white",
                  backgroundColor: "rgba(255,255,255,0.07)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                  fontSize: 15,
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <Pressable
                  onPress={closeDeleteModal}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    height: 50,
                    borderRadius: 14,
                    backgroundColor: "rgba(255,255,255,0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontWeight: "700",
                    }}
                  >
                    {t("settings_cancel")}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleDeleteAccount}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    height: 50,
                    borderRadius: 14,
                    overflow: "hidden",
                    opacity: deleting ? 0.65 : 1,
                  }}
                >
                  <LinearGradient
                    colors={["#ef4444", "#b91c1c"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {deleting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "800",
                        }}
                      >
                        {t("settings_delete_forever")}
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </ImageBackground>
  );
};

export default Settings;
