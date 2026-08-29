import { useState } from 'react'
import { ScrollView, View, Text } from 'react-native'
import { styled } from 'nativewind'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter, useLocalSearchParams } from 'expo-router'
import { useSignIn } from '@clerk/expo'

import AuthBrandHeader from '@/components/auth/AuthBrandHeader'
import AuthHeading from '@/components/auth/AuthHeading'
import AuthTextField from '@/components/auth/AuthTextField'
import AuthPrimaryButton from '@/components/auth/AuthPrimaryButton'
import AuthBanner from '@/components/auth/AuthBanner'
import { validateSignIn, hasValidationErrors, type SignInErrors } from '@/lib/validation'
import { getAuthErrorMessage, getAuthFieldErrors } from '@/lib/auth-errors'
import { posthog } from '@/lib/posthog'

const SafeAreaView = styled(RNSafeAreaView)

const SignIn = () => {
  const { signIn } = useSignIn()
  const router = useRouter()
  const { reset } = useLocalSearchParams<{ reset?: string }>()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<SignInErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onChangeEmail = (text: string) => {
    setEmail(text)
    setErrors((prev) => ({ ...prev, email: undefined }))
    setFormError(null)
  }

  const onChangePassword = (text: string) => {
    setPassword(text)
    setErrors((prev) => ({ ...prev, password: undefined }))
    setFormError(null)
  }

  const onSubmit = async () => {
    const nextErrors = validateSignIn({ email, password })
    setErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) return

    setSubmitting(true)
    try {
      const { error } = await signIn.password({ emailAddress: email.trim(), password })

      if (error) {
        setErrors((prev) => ({ ...prev, ...getAuthFieldErrors(error) }))
        setFormError(getAuthErrorMessage(error))
        return
      }

      if (signIn.status === 'complete') {
        await signIn.finalize()
        posthog?.capture('sign_in_completed')
        router.replace('/(tabs)')
      } else {
        setFormError(
          "Your account needs an extra step to finish signing in. Please check your email or try again shortly."
        )
      }
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView className="auth-safe-area">
      <ScrollView
        className="auth-scroll"
        contentContainerClassName="auth-content"
        keyboardShouldPersistTaps="handled"
      >
        <AuthBrandHeader />
        <AuthHeading title="Welcome back" subtitle="Sign in to keep every renewal in one place." />

        {reset === '1' ? (
          <View className="mt-6">
            <AuthBanner variant="success" message="Password updated. Sign in with your new password." />
          </View>
        ) : null}

        <View className="auth-card">
          <View className="auth-form">
            <AuthTextField
              label="Email"
              value={email}
              onChangeText={onChangeEmail}
              error={errors.email}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <View className="gap-2">
              <AuthTextField
                label="Password"
                value={password}
                onChangeText={onChangePassword}
                error={errors.password}
                placeholder="Enter your password"
                secureTextEntry
                autoComplete="password"
                textContentType="password"
              />
              <Link href="/(auth)/forgot-password" className="auth-link self-end">
                Forgot password?
              </Link>
            </View>

            <AuthBanner message={formError} />

            <AuthPrimaryButton label="Sign In" onPress={onSubmit} loading={submitting} disabled={submitting} />
          </View>
        </View>

        <View className="auth-link-row">
          <Text className="auth-link-copy">New to Bill Pilot?</Text>
          <Link href="/(auth)/sign-up" className="auth-link">
            Create account
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignIn
