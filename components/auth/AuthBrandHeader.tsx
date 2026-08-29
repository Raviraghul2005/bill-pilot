import { View, Text } from 'react-native'

const AuthBrandHeader = () => {
  return (
    <View className="auth-brand-block">
      <View className="auth-logo-wrap">
        <View className="auth-logo-mark">
          <Text className="auth-logo-mark-text">B</Text>
        </View>
        <View>
          <Text className="auth-wordmark">Bill Pilot</Text>
          <Text className="auth-wordmark-sub">BILLING ON AUTOPILOT</Text>
        </View>
      </View>
    </View>
  )
}

export default AuthBrandHeader
