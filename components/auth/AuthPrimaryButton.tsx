import { Pressable, Text, ActivityIndicator } from 'react-native'
import clsx from 'clsx'
import { colors } from '@/constants/theme'

type AuthPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const AuthPrimaryButton = ({ label, onPress, loading, disabled }: AuthPrimaryButtonProps) => {
  const isDisabled = Boolean(disabled || loading)

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={clsx('auth-button', isDisabled && 'auth-button-disabled')}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text className="auth-button-text">{label}</Text>
      )}
    </Pressable>
  )
}

export default AuthPrimaryButton
