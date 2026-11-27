import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WebFirekeeperScreen from './src/screens/WebFirekeeperScreen';

export default function App() {
  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: '#060a16' }}>
      <StatusBar style="light" backgroundColor="#060a16" />
      <WebFirekeeperScreen />
    </SafeAreaProvider>
  );
}
