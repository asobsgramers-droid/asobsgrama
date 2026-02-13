import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme } from '@/lib/ThemeContext';

export default function NewChannelScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [channelName, setChannelName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createChannel = useMutation(api.chats.createChannel);

  const handleCreate = async () => {
    if (!channelName.trim()) {
      setError('Please enter a channel name');
      return;
    }
    if (!username.trim()) {
      setError('Please enter a username for your channel');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const channelId = await createChannel({
        name: channelName.trim(),
        description: description.trim() || undefined,
        username: username.toLowerCase().trim(),
        isPublic,
      });

      if (channelId) {
        router.replace(`/chat/channel/${channelId}`);
      } else {
        setError('This username is already taken. Please choose another.');
      }
    } catch (err) {
      console.error('Failed to create channel:', err);
      setError('Failed to create channel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValid = channelName.trim() && username.trim();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>New Channel</Text>
        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor: isValid ? theme.colors.primary : theme.colors.surfaceSecondary,
            },
          ]}
          onPress={handleCreate}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={[
                styles.createButtonText,
                { color: isValid ? '#FFFFFF' : theme.colors.textTertiary },
              ]}
            >
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Channel Avatar Placeholder */}
        <View style={styles.avatarSection}>
          <View style={[styles.channelAvatar, { backgroundColor: theme.colors.accent }]}>
            <Ionicons name="megaphone" size={40} color="#FFFFFF" />
          </View>
        </View>

        {/* Channel Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
            Channel Name
          </Text>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text },
            ]}
            placeholder="e.g., Tech News"
            placeholderTextColor={theme.colors.textTertiary}
            value={channelName}
            onChangeText={setChannelName}
            autoFocus
          />
        </View>

        {/* Username */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
            Channel Link
          </Text>
          <View
            style={[
              styles.usernameInput,
              { backgroundColor: theme.colors.surfaceSecondary },
            ]}
          >
            <Text style={[styles.usernamePrefix, { color: theme.colors.textSecondary }]}>
              @
            </Text>
            <TextInput
              style={[styles.usernameField, { color: theme.colors.text }]}
              placeholder="channelname"
              placeholderTextColor={theme.colors.textTertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={[styles.inputHint, { color: theme.colors.textTertiary }]}>
            People can find your channel by this link
          </Text>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
            Description (optional)
          </Text>
          <TextInput
            style={[
              styles.textInput,
              styles.textArea,
              { backgroundColor: theme.colors.surfaceSecondary, color: theme.colors.text },
            ]}
            placeholder="What's this channel about?"
            placeholderTextColor={theme.colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Public Toggle */}
        <View style={[styles.toggleSection, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.toggleInfo}>
            <Ionicons
              name={isPublic ? 'globe-outline' : 'lock-closed-outline'}
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.toggleText}>
              <Text style={[styles.toggleTitle, { color: theme.colors.text }]}>
                {isPublic ? 'Public Channel' : 'Private Channel'}
              </Text>
              <Text style={[styles.toggleDescription, { color: theme.colors.textSecondary }]}>
                {isPublic
                  ? 'Anyone can find and join'
                  : 'Only invited users can join'}
              </Text>
            </View>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Error */}
        {error ? (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        ) : null}

        {/* Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.textTertiary} />
          <Text style={[styles.infoText, { color: theme.colors.textTertiary }]}>
            Channels are for broadcasting messages to large audiences. Only admins can post.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  channelAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  usernameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
  },
  usernamePrefix: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 4,
  },
  usernameField: {
    flex: 1,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
