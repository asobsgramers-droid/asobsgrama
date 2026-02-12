import { ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth-client";
import { ThemeProvider } from "@/lib/ThemeContext";
import { StatusBar } from "expo-status-bar";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
    unsavedChangesWarning: false,
});

export default function RootLayout() {
    return (
        <ConvexBetterAuthProvider client={convex} authClient={authClient}>
            <ThemeProvider>
                <StatusBar style="auto" />
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="auth/login" options={{ headerShown: false }} />
                    <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
                    <Stack.Screen name="chat/direct/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="chat/group/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="chat/channel/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="new-chat" options={{ headerShown: false }} />
                    <Stack.Screen name="new-group" options={{ headerShown: false }} />
                    <Stack.Screen name="new-channel" options={{ headerShown: false }} />
                    <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
                    <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
                    <Stack.Screen name="settings/blocked" options={{ headerShown: false }} />
                </Stack>
            </ThemeProvider>
        </ConvexBetterAuthProvider>
    );
}
