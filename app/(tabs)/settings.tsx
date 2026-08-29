import { useState } from 'react'
import { Text, Pressable } from 'react-native'
import clsx from 'clsx'

import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/expo";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
  const { signOut } = useAuth()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      router.replace('/(auth)/sign-in')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text>settings</Text>

      <Pressable
        onPress={handleSignOut}
        disabled={signingOut}
        className={clsx('sub-cancel', signingOut && 'sub-cancel-disabled')}
      >
        <Text className="sub-cancel-text">{signingOut ? 'Signing Out...' : 'Sign Out'}</Text>
      </Pressable>
    </SafeAreaView>
  )
}

export default Settings
