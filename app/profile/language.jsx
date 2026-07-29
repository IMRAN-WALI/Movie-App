import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SUPPORTED_LANGUAGES,
  useLanguage,
} from "../../src/i18n/LanguageContext";

const LanguageScreen = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <LinearGradient
      colors={["#3730a3", "#312e81"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
            gap: 12,
          }}
        >
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>
            {t("language_title")}
          </Text>
        </View>

        <Text
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 13,
            paddingHorizontal: 20,
            marginBottom: 16,
          }}
        >
          {t("language_subtitle")}
        </Text>

        {/* Options */}
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <Pressable
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: isSelected
                    ? "rgba(99,102,241,0.35)"
                    : "rgba(255,255,255,0.06)",
                  borderRadius: 14,
                  paddingVertical: 16,
                  paddingHorizontal: 18,
                  borderWidth: isSelected ? 1.5 : 0,
                  borderColor: "#818cf8",
                }}
              >
                <View>
                  <Text
                    style={{ color: "white", fontSize: 16, fontWeight: "700" }}
                  >
                    {lang.nativeLabel}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {lang.label}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color="#818cf8" />
                )}
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LanguageScreen;
