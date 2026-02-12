import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme } from '@/lib/ThemeContext';
import { Avatar } from '@/components/Avatar';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const profile = useQuery(api.users.getProfileById, id ? { userId: id } : 'skip');
  const isBlocked = useQuery(api.users.isUserBlocked, id ? { userId: id } : 'skip');
  const blockUser = useMutation(api.users.blockUser);
  const unblockUser = useMutation(api.users.unblockUser);
  const getOrCreateConversation = useMutation(api.chats.getOrCreateConversation);

  const isLoading = profile === undefined;

  const handleMessage = async () => {
    if (!id) return;
    try {
      const conversationId = await getOrCreateConversation({ otherUserId: id });
      router.push(`/chat/direct/${conversationId}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleBlockToggle = async () => {
    if (!id) return;
    try {
      if (isBlocked) {
        await unblockUser({ blockedUserId: id });
      } else {
        await blockUser({ blockedUserId: id });
      }
    } catch (error) {
      console.error('Failed to toggle block:', error);
    }
  };

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : profile ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile Info */}
          <View style={styles.profileSection}>
            <Avatar name={profile.name} size={100} isOnline={profile.isOnline} />
            <Text style={[styles.name, { color: theme.colors.text }]}>{profile.name}</Text>
            {profile.username && (
              <Text style={[styles.username, { color: theme.colors.textSecondary }]}>
                @{profile.username}
              </Text>
            )}
            <Text style={[styles.status, { color: profile.isOnline ? theme.colors.online : theme.colors.textSecondary }]}>
              {profile.isOnline ? 'online' : `last seen ${formatLastSeen(profile.lastSeen)}`}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleMessage}
            >
              <Ionicons name="chatbubble" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* Info */}
          {profile.bio && (
            <View style={[styles.infoSection, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Bio</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{profile.bio}</Text>
            </View>
          )}

          {profile.phone && (
            <View style={[styles.infoSection, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Phone</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{profile.phone}</Text>
            </View>
          )}

          {/* Block User */}
          <TouchableOpacity
            style={[styles.blockButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleBlockToggle}
          >
            <Ionicons
              name={isBlocked ? 'checkmark-circle-outline' : 'ban-outline'}
              size={22}
              color={isBlocked ? theme.colors.success : theme.colors.error}
            />
            <Text
              style={[
                styles.blockButtonText,
                { color: isBlocked ? theme.colors.success : theme.colors.error },
              ]}
            >
              {isBlocked ? 'Unblock User' : 'Block User'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={[styles.notFoundText, { color: theme.colors.textSecondary }]}>
            User not found
          </Text>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
  },
  content: {
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  name: {
    fontSize: 28,
    fontWeight: '600',
    marginTop: 16,
  },
  username: {
    fontSize: 16,
    marginTop: 4,
  },
  status: {
    fontSize: 14,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 10,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  infoSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    gap: 10,
  },
  blockButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
