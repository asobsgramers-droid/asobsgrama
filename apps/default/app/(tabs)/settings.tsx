import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme } from '@/lib/ThemeContext';
import { Avatar } from '@/components/Avatar';
import { authClient } from '@/lib/auth-client';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const profile = useQuery(api.users.getCurrentProfileWithAvatar);
  const isLoading = profile === undefined;

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        {isLoading ? (
          <View style={[styles.profileSection, { backgroundColor: theme.colors.surface }]}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.profileSection, { backgroundColor: theme.colors.surface }]}
            onPress={() => router.push('/profile/edit')}
          >
            <Avatar name={profile?.name || 'User'} size={64} imageUrl={profile?.avatarUrl} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.text }]}>
                {profile?.name || 'Set up your profile'}
              </Text>
              {profile?.username && (
                <Text style={[styles.profileUsername, { color: theme.colors.textSecondary }]}>
                  @{profile.username}
                </Text>
              )}
              {profile?.bio && (
                <Text
                  style={[styles.profileBio, { color: theme.colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {profile.bio}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        )}

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            APPEARANCE
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon-outline" size={24} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            PRIVACY
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/settings/blocked')}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="ban-outline" size={24} color={theme.colors.error} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Blocked Users
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            ACCOUNT
          </Text>
          <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
              <View style={styles.settingInfo}>
                <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
                <Text style={[styles.settingText, { color: theme.colors.error }]}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, { color: theme.colors.textTertiary }]}>AsobsGram</Text>
          <Text style={[styles.appVersion, { color: theme.colors.textTertiary }]}>Version 1.0.0</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileUsername: {
    fontSize: 15,
    marginTop: 2,
  },
  profileBio: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 12,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingText: {
    fontSize: 17,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 40,
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
  },
  appVersion: {
    fontSize: 13,
    marginTop: 4,
  },
});
