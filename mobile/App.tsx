import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3498db',
    secondary: '#2ecc71',
    tertiary: '#f39c12',
    surface: '#ffffff',
    background: '#ffffff',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
      <StatusBar style="dark" backgroundColor="#ffffff" />
    </PaperProvider>
  );
}
