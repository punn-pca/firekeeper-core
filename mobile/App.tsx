import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WebFirekeeperScreen from './src/screens/WebFirekeeperScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <WebFirekeeperScreen />
    </SafeAreaProvider>
  );
}
