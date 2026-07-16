import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text } from "react-native";

const Profile = () => {
  return (
    <LinearGradient
      colors={["#3730a3", "#312e81"]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      className="flex-1 px-6 items-center justify-center"
    >
      <Text className="text-3xl font-semibold text-white">Profile</Text>
      <Text className="mt-2 text-base text-slate-100 text-center">
        Manage your profile, preferences, and app settings.
      </Text>
    </LinearGradient>
  );
};

export default Profile;
