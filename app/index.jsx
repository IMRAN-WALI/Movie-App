import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 30, fontWeight: "bold", color: "blue" }}>
        Welcome
      </Text>
      <Text>Edit app/index.jsx to edit this screen.</Text>
    </View>
  );
}
