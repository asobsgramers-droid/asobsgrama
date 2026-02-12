import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/ThemeContext';
import * as Haptics from 'expo-haptics';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ onSend, placeholder = 'Message', disabled }: ChatInputProps) {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onSend(trimmed);
    setMessage('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceSecondary }]}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={4096}
          editable={!disabled}
        />
      </View>
      <TouchableOpacity
        style={[
          styles.sendButton,
          {
            backgroundColor: message.trim() && !disabled ? theme.colors.primary : theme.colors.surfaceSecondary,
          },
        ]}
        onPress={handleSend}
        disabled={!message.trim() || disabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name="send"
          size={20}
          color={message.trim() && !disabled ? '#FFFFFF' : theme.colors.textTertiary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  input: {
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
