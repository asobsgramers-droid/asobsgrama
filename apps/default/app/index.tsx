import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme } from '@/lib/ThemeContext';

function AuthenticatedRedirect() {
  const profile = useQuery(api.users.getCurrentProfile);
  const createOrUpdateProfile = useMutation(api.users.createOrUpdateProfile);

  useEffect(() => {
    // Ensure profile exists when authenticated
    const ensureProfile = async () => {
      if (profile === undefined) return; // Still loading
      
      if (profile === null) {
        // Create initial profile
        await createOrUpdateProfile({
          name: 'User',
          email: undefined,
          phone: undefined,
          username: undefined,
          bio: undefined,
        });
      }
    };

    ensureProfile();
  }, [profile, createOrUpdateProfile]);

  // Redirect to tabs when authenticated
  return <Redirect href="/(tabs)" />;
}

export default function Index() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AuthLoading>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </AuthLoading>
      
      <Unauthenticated>
        <Redirect href="/auth/login" />
      </Unauthenticated>
      
      <Authenticated>
        <AuthenticatedRedirect />
      </Authenticated>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
