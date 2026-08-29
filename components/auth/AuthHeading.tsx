import { View, Text } from 'react-native'

type AuthHeadingProps = {
  title: string;
  subtitle?: string;
}

const AuthHeading = ({ title, subtitle }: AuthHeadingProps) => {
  return (
    <View className="items-center">
      <Text className="auth-title">{title}</Text>
      {subtitle ? <Text className="auth-subtitle">{subtitle}</Text> : null}
    </View>
  )
}

export default AuthHeading
