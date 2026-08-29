import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import clsx from 'clsx'
import dayjs from 'dayjs'

import AuthTextField from '@/components/auth/AuthTextField'
import {
  CATEGORY_COLORS,
  SUBSCRIPTION_CATEGORIES,
  SUBSCRIPTION_FREQUENCIES,
  type SubscriptionCategory,
  type SubscriptionFrequency,
} from '@/constants/data'
import { icons } from '@/constants/icons'
import { parsePriceInput } from '@/lib/utils'
import {
  validateSubscription,
  hasValidationErrors,
  type SubscriptionErrors,
} from '@/lib/validation'
import { posthog } from '@/lib/posthog'

type CreateSubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
}

// Ids double as FlatList keys, so two subscriptions both named "Netflix" must
// not collide. The slug keeps them readable while debugging.
const buildSubscriptionId = (name: string): string => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `${slug || 'subscription'}-${Date.now().toString(36)}`
}

const CreateSubscriptionModal = ({ visible, onClose, onCreate }: CreateSubscriptionModalProps) => {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('Monthly')
  const [category, setCategory] = useState<SubscriptionCategory>('Entertainment')
  const [errors, setErrors] = useState<SubscriptionErrors>({})

  const resetForm = () => {
    setName('')
    setPrice('')
    setFrequency('Monthly')
    setCategory('Entertainment')
    setErrors({})
  }

  const onChangeName = (text: string) => {
    setName(text)
    setErrors((prev) => ({ ...prev, name: undefined }))
  }

  const onChangePrice = (text: string) => {
    setPrice(text)
    setErrors((prev) => ({ ...prev, price: undefined }))
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = () => {
    const nextErrors = validateSubscription({ name, price })
    setErrors(nextErrors)
    if (hasValidationErrors(nextErrors)) return

    const startDate = dayjs()
    const renewalDate = frequency === 'Yearly' ? startDate.add(1, 'year') : startDate.add(1, 'month')

    const subscription: Subscription = {
      id: buildSubscriptionId(name),
      icon: icons.wallet,
      name: name.trim(),
      category,
      status: 'active',
      startDate: startDate.toISOString(),
      price: parsePriceInput(price),
      currency: 'USD',
      billing: frequency,
      renewalDate: renewalDate.toISOString(),
      color: CATEGORY_COLORS[category],
    }

    posthog?.capture('subscription_created', {
      category,
      billing_interval: frequency,
      price: subscription.price,
    })

    onCreate(subscription)
    resetForm()
    onClose()
  }

  const isSubmittable = name.trim().length > 0 && price.trim().length > 0

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        className="modal-overlay"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable className="flex-1" onPress={handleClose} accessibilityLabel="Dismiss" />

        <View className="modal-container">
          <View className="modal-header">
            <Text className="modal-title">New Subscription</Text>
            <Pressable
              className="modal-close"
              onPress={handleClose}
              hitSlop={8}
              accessibilityLabel="Close"
            >
              <Text className="modal-close-text">×</Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="modal-body">
              {/* AuthTextField renders a TextInput on the auth-input class, so
                  the fields match the sign-in / sign-up screens exactly. */}
              <AuthTextField
                label="Name"
                value={name}
                onChangeText={onChangeName}
                error={errors.name}
                placeholder="e.g. Netflix"
                autoCapitalize="words"
              />

              <AuthTextField
                label="Price"
                value={price}
                onChangeText={onChangePrice}
                error={errors.price}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  {SUBSCRIPTION_FREQUENCIES.map((option) => {
                    const isActive = frequency === option
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setFrequency(option)}
                        className={clsx('picker-option', isActive && 'picker-option-active')}
                      >
                        <Text
                          className={clsx(
                            'picker-option-text',
                            isActive && 'picker-option-text-active'
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {SUBSCRIPTION_CATEGORIES.map((option) => {
                    const isActive = category === option
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setCategory(option)}
                        className={clsx('category-chip', isActive && 'category-chip-active')}
                      >
                        <Text
                          className={clsx(
                            'category-chip-text',
                            isActive && 'category-chip-text-active'
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={!isSubmittable}
                className={clsx('auth-button', !isSubmittable && 'auth-button-disabled')}
              >
                <Text className="auth-button-text">Add Subscription</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default CreateSubscriptionModal
