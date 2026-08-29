import { View, Text } from 'react-native'
import clsx from 'clsx'

type AuthBannerProps = {
  message?: string | null;
  variant?: 'error' | 'success';
}

const AuthBanner = ({ message, variant = 'error' }: AuthBannerProps) => {
  if (!message) return null

  const isSuccess = variant === 'success'

  return (
    <View className={clsx(isSuccess ? 'auth-banner-success' : 'auth-banner')}>
      <Text className={clsx(isSuccess ? 'auth-banner-success-text' : 'auth-banner-text')}>
        {message}
      </Text>
    </View>
  )
}

export default AuthBanner
