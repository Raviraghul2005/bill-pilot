// app/index.tsx
import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { colors } from "@/constants/theme";

const SafeAreaView = styled(RNSafeAreaView);

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <SafeAreaView className="auth-safe-area items-center justify-center">
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  return <Redirect href={isSignedIn ? "/(tabs)" : "/(auth)/sign-in"} />;
}
