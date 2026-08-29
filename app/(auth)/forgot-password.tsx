import { useState } from 'react'
import { ScrollView, View, Text, Pressable } from 'react-native'
import { styled } from 'nativewind'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import { useSignIn } from '@clerk/expo'

import AuthBrandHeader from '@/components/auth/AuthBrandHeader'
import AuthHeading from '@/components/auth/AuthHeading'
import AuthTextField from '@/components/auth/AuthTextField'
import AuthPrimaryButton from '@/components/auth/AuthPrimaryButton'
import AuthBanner from '@/components/auth/AuthBanner'
import {
  validateRequestReset,
  validateResetPassword,
  hasValidationErrors,
  type RequestResetErrors,
  type ResetPasswordErrors,
} from '@/lib/validation'
import { getAuthErrorMessage, getAuthFieldErrors } from '@/lib/auth-errors'
import { posthog } from '@/lib/posthog'

const SafeAreaView = styled(RNSafeAreaView)

type Stage = 'request' | 'reset'

const ForgotPassword = () => {
  const { signIn } = useSignIn()
  const router = useRouter()

  const [stage, setStage] = useState<Stage>('request')

  const [email, setEmail] = useState('')
  const [requestErrors, setRequestErrors] = useState<RequestResetErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetErrors, setResetErrors] = useState<ResetPasswordErrors>({})
  const [resending, setResending] = useState(false)
  const [resendNotice, setResendNotice] = useState<string | null>(null)

  const onChangeEmail = (text: string) => {
    setEmail(text)
    setRequestErrors((prev) => ({ ...prev, email: undefined }))
    setFormError(null)
  }

  const onChangeCode = (text: string) => {
    setCode(text)
    setResetErrors((prev) => ({ ...prev, code: undefined }))
    setFormError(null)
    setResendNotice(null)
  }

  const onChangePassword = (text: string) => {
    setPassword(text)
    setResetErrors((prev) => ({ ...prev, password: undefined }))
    setFormError(null)
  }

  const onChangeConfirmPassword = (text: string) => {
    setConfirmPassword(text)
    setResetErrors((prev) => ({ ...prev, confirmPassword: undefined }))
    setFormError(null)
  }

  const onRequestCode = async () => {
    const nextErrors = validateRequestReset({ email })
    setRequestErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) return

    setSubmitting(true)
    try {
      const { error: createError } = await signIn.create({ identifier: email.trim() })
      if (createError) {
        setRequestErrors((prev) => ({ ...prev, ...getAuthFieldErrors(createError) }))
        setFormError(getAuthErrorMessage(createError))
        return
      }

      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode()
      if (sendError) {
        setFormError(getAuthErrorMessage(sendError))
        return
      }

      posthog?.capture('password_reset_requested')
      setStage('reset')
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmitReset = async () => {
    const nextErrors = validateResetPassword({ code, password, confirmPassword })
    setResetErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) return

    setSubmitting(true)
    try {
      const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({ code })
      if (verifyError) {
        setResetErrors((prev) => ({ ...prev, ...getAuthFieldErrors(verifyError) }))
        setFormError(getAuthErrorMessage(verifyError))
        return
      }

      const { error: submitError } = await signIn.resetPasswordEmailCode.submitPassword({ password })
      if (submitError) {
        setResetErrors((prev) => ({ ...prev, ...getAuthFieldErrors(submitError) }))
        setFormError(getAuthErrorMessage(submitError))
        return
      }

      if (signIn.status === 'complete') {
        await signIn.finalize()
        posthog?.capture('password_reset_completed')
        router.replace('/(tabs)')
      } else {
        router.replace({ pathname: '/(auth)/sign-in', params: { reset: '1' } })
      }
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const onResendCode = async () => {
    setResending(true)
    setFormError(null)
    try {
      const { error } = await signIn.resetPasswordEmailCode.sendCode()
      if (error) {
        setFormError(getAuthErrorMessage(error))
        return
      }
      setResendNotice('We sent a new code.')
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setResending(false)
    }
  }

  const onChangeEmailPressed = () => {
    setStage('request')
    setCode('')
    setPassword('')
    setConfirmPassword('')
    setFormError(null)
    setResendNotice(null)
  }

  return (
    <SafeAreaView className="auth-safe-area">
      <ScrollView
        className="auth-scroll"
        contentContainerClassName="auth-content"
        keyboardShouldPersistTaps="handled"
      >
        <AuthBrandHeader />

        {stage === 'request' ? (
          <>
            <AuthHeading
              title="Reset your password"
              subtitle="Enter your email and we'll send you a reset code."
            />

            <View className="auth-card">
              <View className="auth-form">
                <AuthTextField
                  label="Email"
                  value={email}
                  onChangeText={onChangeEmail}
                  error={requestErrors.email}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />

                <AuthBanner message={formError} />

                <AuthPrimaryButton
                  label="Send Code"
                  onPress={onRequestCode}
                  loading={submitting}
                  disabled={submitting}
                />
              </View>
            </View>

            <View className="auth-link-row">
              <Text className="auth-link-copy">Remembered your password?</Text>
              <Link href="/(auth)/sign-in" className="auth-link">
                Sign in
              </Link>
            </View>
          </>
        ) : (
          <>
            <AuthHeading
              title="Enter your new password"
              subtitle={`Enter the code we sent to ${email.trim()}`}
            />

            <View className="auth-card">
              <View className="auth-form">
                <AuthTextField
                  label="Verification Code"
                  value={code}
                  onChangeText={onChangeCode}
                  error={resetErrors.code}
                  placeholder="000000"
                  keyboardType="number-pad"
                  inputClassName="auth-code-input"
                />

                <View className="flex-row items-center justify-between">
                  <Pressable onPress={onResendCode} disabled={resending}>
                    <Text className="auth-link">{resending ? 'Resending...' : 'Resend code'}</Text>
                  </Pressable>
                  <Pressable onPress={onChangeEmailPressed}>
                    <Text className="auth-link">Change email</Text>
                  </Pressable>
                </View>

                {resendNotice ? <Text className="auth-helper">{resendNotice}</Text> : null}

                <AuthTextField
                  label="New Password"
                  value={password}
                  onChangeText={onChangePassword}
                  error={resetErrors.password}
                  placeholder="Create a new password"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
                <AuthTextField
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={onChangeConfirmPassword}
                  error={resetErrors.confirmPassword}
                  placeholder="Re-enter your new password"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                />

                <AuthBanner message={formError} />

                <AuthPrimaryButton
                  label="Reset Password"
                  onPress={onSubmitReset}
                  loading={submitting}
                  disabled={submitting}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default ForgotPassword
