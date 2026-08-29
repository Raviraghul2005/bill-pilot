import { useState } from 'react'
import { ScrollView, View, Text, Pressable } from 'react-native'
import { styled } from 'nativewind'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import { Link, useRouter } from 'expo-router'
import { useSignUp } from '@clerk/expo'

import AuthBrandHeader from '@/components/auth/AuthBrandHeader'
import AuthHeading from '@/components/auth/AuthHeading'
import AuthTextField from '@/components/auth/AuthTextField'
import AuthPrimaryButton from '@/components/auth/AuthPrimaryButton'
import AuthBanner from '@/components/auth/AuthBanner'
import {
  validateSignUp,
  validateCode,
  hasValidationErrors,
  type SignUpErrors,
} from '@/lib/validation'
import { getAuthErrorMessage, getAuthFieldErrors } from '@/lib/auth-errors'
import { posthog } from '@/lib/posthog'

const SafeAreaView = styled(RNSafeAreaView)

type Stage = 'form' | 'verify'

const SignUp = () => {
  const { signUp } = useSignUp()
  const router = useRouter()

  const [stage, setStage] = useState<Stage>('form')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<SignUpErrors & { code?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendNotice, setResendNotice] = useState<string | null>(null)

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

  const onChangeConfirmPassword = (text: string) => {
    setConfirmPassword(text)
    setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
    setFormError(null)
  }

  const onChangeCode = (text: string) => {
    setCode(text)
    setErrors((prev) => ({ ...prev, code: undefined }))
    setFormError(null)
    setResendNotice(null)
  }

  const onSubmitForm = async () => {
    const nextErrors = validateSignUp({ email, password, confirmPassword })
    setErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) return

    setSubmitting(true)
    try {
      const { error: passwordError } = await signUp.password({
        emailAddress: email.trim(),
        password,
      })

      if (passwordError) {
        setErrors((prev) => ({ ...prev, ...getAuthFieldErrors(passwordError) }))
        setFormError(getAuthErrorMessage(passwordError))
        return
      }

      const { error: codeError } = await signUp.verifications.sendEmailCode()
      if (codeError) {
        setFormError(getAuthErrorMessage(codeError))
        return
      }

      posthog?.capture('sign_up_started')
      setStage('verify')
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const onVerify = async () => {
    const codeErrorMessage = validateCode(code)
    if (codeErrorMessage) {
      setErrors((prev) => ({ ...prev, code: codeErrorMessage }))
      return
    }

    setVerifying(true)
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code })
      if (error) {
        setErrors((prev) => ({ ...prev, ...getAuthFieldErrors(error) }))
        setFormError(getAuthErrorMessage(error))
        return
      }

      if (signUp.status === 'complete') {
        await signUp.finalize()
        posthog?.capture('sign_up_completed')
        router.replace('/(tabs)')
      } else {
        setFormError("We couldn't finish verifying your account. Please try again or request a new code.")
      }
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setVerifying(false)
    }
  }

  const onResend = async () => {
    setResending(true)
    setFormError(null)
    try {
      const { error } = await signUp.verifications.sendEmailCode()
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
    setStage('form')
    setCode('')
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

        {stage === 'form' ? (
          <>
            <AuthHeading title="Create your account" subtitle="Track every subscription in one place." />

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
                <AuthTextField
                  label="Password"
                  value={password}
                  onChangeText={onChangePassword}
                  error={errors.password}
                  placeholder="Create a password"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
                <AuthTextField
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={onChangeConfirmPassword}
                  error={errors.confirmPassword}
                  placeholder="Re-enter your password"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                />

                <AuthBanner message={formError} />

                <AuthPrimaryButton
                  label="Create Account"
                  onPress={onSubmitForm}
                  loading={submitting}
                  disabled={submitting}
                />

                {/* Required by Clerk for sign-up on web; a harmless empty view on iOS/Android. */}
                <View nativeID="clerk-captcha" />
              </View>
            </View>

            <View className="auth-link-row">
              <Text className="auth-link-copy">Already have an account?</Text>
              <Link href="/(auth)/sign-in" className="auth-link">
                Sign in
              </Link>
            </View>
          </>
        ) : (
          <>
            <AuthHeading title="Check your email" subtitle={`We sent a code to ${email.trim()}`} />

            <View className="auth-card">
              <View className="auth-form">
                <AuthTextField
                  label="Verification Code"
                  value={code}
                  onChangeText={onChangeCode}
                  error={errors.code}
                  placeholder="000000"
                  keyboardType="number-pad"
                  inputClassName="auth-code-input"
                />

                <View className="flex-row items-center justify-between">
                  <Pressable onPress={onResend} disabled={resending}>
                    <Text className="auth-link">{resending ? 'Resending...' : 'Resend code'}</Text>
                  </Pressable>
                  <Pressable onPress={onChangeEmailPressed}>
                    <Text className="auth-link">Change email</Text>
                  </Pressable>
                </View>

                {resendNotice ? <Text className="auth-helper">{resendNotice}</Text> : null}

                <AuthBanner message={formError} />

                <AuthPrimaryButton
                  label="Verify Email"
                  onPress={onVerify}
                  loading={verifying}
                  disabled={verifying}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignUp
