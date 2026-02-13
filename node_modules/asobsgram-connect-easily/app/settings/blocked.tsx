import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme } from '@/lib/ThemeContext';
import { Avatar } from '@/components/Avatar';

export default function BlockedUsersScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const blockedUsers = useQuery(api.users.getBlockedUsers);
  const unblockUser = useMutation(api.users.unblockUser);

  const isLoading = blockedUsers === undefined;

  const handleUnblock = async (blockedUserId: string) => {
    try {
      await unblockUser({ blockedUserId });
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Blocked Users</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : blockedUsers && blockedUsers.length > 0 ? (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <Avatar name={item.profile?.name || 'User'} size={50} />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {item.profile?.name || 'Unknown User'}
                </Text>
                {item.profile?.username && (
                  <Text style={[styles.userUsername, { color: theme.colors.textSecondary }]}>
                    @{item.profile.username}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.unblockButton, { backgroundColor: theme.colors.surfaceSecondary }]}
                onPress={() => handleUnblock(item.blockedUserId)}
              >
                <Text style={[styles.unblockButtonText, { color: theme.colors.primary }]}>
                  Unblock
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Ionicons name="ban-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No blocked users</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Users you block won't be able to message you
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '500',
  },
  userUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 0.5,
    marginLeft: 80,
  },
});
