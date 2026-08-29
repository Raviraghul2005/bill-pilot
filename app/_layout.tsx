import "@/global.css";
import {useFonts} from "expo-font";
import { useEffect, useRef } from "react";
import { SplashScreen, Stack } from "expo-router";
import { ClerkProvider, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { PostHogErrorBoundary, PostHogProvider } from "posthog-react-native";
import { posthog } from "@/lib/posthog";
import { SubscriptionsProvider } from "@/lib/subscriptions";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env");
}

function PostHogIdentity() {
  const { isLoaded, user } = useUser()
  const identifiedUserId = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !user || !posthog || identifiedUserId.current === user.id) return

    const email = user.primaryEmailAddress?.emailAddress
    posthog.identify(
      user.id,
      email
        ? {
            $set: { email },
          }
        : undefined,
    )
    identifiedUserId.current = user.id
  }, [isLoaded, user])

  return null
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
  })

  useEffect(()=>{
    if(fontsLoaded){
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) return null;

  const content = (
    <SubscriptionsProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SubscriptionsProvider>
  );

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {posthog ? (
        <PostHogProvider client={posthog}>
          <PostHogErrorBoundary>
            <PostHogIdentity />
            {content}
          </PostHogErrorBoundary>
        </PostHogProvider>
      ) : (
        content
      )}
    </ClerkProvider>
  );
}
