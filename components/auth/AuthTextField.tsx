import { useState } from 'react'
import { View, Text, TextInput, Pressable, type TextInputProps } from 'react-native'
import clsx from 'clsx'

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  editable?: boolean;
  inputClassName?: string;
}

const AuthTextField = ({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  textContentType,
  editable = true,
  inputClassName = 'auth-input',
}: AuthTextFieldProps) => {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <View className="auth-field">
      <Text className="auth-label">{label}</Text>
      <View className="auth-input-wrap">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(0, 0, 0, 0.35)"
          secureTextEntry={secureTextEntry && !isVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          editable={editable}
          className={clsx(inputClassName, error && 'auth-input-error', secureTextEntry && 'pr-16')}
        />
        {secureTextEntry ? (
          <Pressable className="auth-input-toggle" onPress={() => setIsVisible((prev) => !prev)}>
            <Text className="auth-input-toggle-text">{isVisible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="auth-error">{error}</Text> : null}
    </View>
  )
}

export default AuthTextField
