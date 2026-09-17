import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, StyleSheet, Image, Text } from 'react-native';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import ChatScreen from '../screens/ChatScreen';
import GovernanceScreen from '../screens/GovernanceScreen';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Conversations: undefined;
  Chat: { conversationId?: string; conversationTitle?: string; initialPrompt?: string };
  Governance: { governance: object; messageContent: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0f0f0f' },
          headerTintColor: '#f97316',
          headerTitleStyle: { fontWeight: '700', color: '#ffffff' },
          contentStyle: { backgroundColor: '#0f0f0f' },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                headerTitle: () => (
                  <View style={styles.headerTitleRow}>
                    <Image
                      source={require('../../assets/logo.png')}
                      style={styles.headerLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.headerTitleText}>FIRE KEEPER</Text>
                  </View>
                ),
              }}
            />
            <Stack.Screen name="Conversations" component={ConversationsScreen} options={{ title: 'Conversations' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={({ route }) => ({ title: route.params?.conversationTitle ?? 'New Chat' })} />
            <Stack.Screen name="Governance" component={GovernanceScreen} options={{ title: 'Governance Report' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 24,
    height: 24,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
});
