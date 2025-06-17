import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import ResultsScreen from './src/screens/ResultsScreen';

const Stack = createStackNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200EE',
    primaryContainer: '#EADDFF',
    secondary: '#03DAC6',
    secondaryContainer: '#A7F3D0',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F2F7',
    background: '#FFFBFE',
    error: '#BA1A1A',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onSurface: '#1C1B1F',
    onBackground: '#1C1B1F',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.onPrimary,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ 
              title: 'Price Scanner',
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
            }}
          />
          <Stack.Screen 
            name="Camera" 
            component={CameraScreen}
            options={{ 
              title: 'Scan Item',
              headerBackTitleVisible: false,
            }}
          />
          <Stack.Screen 
            name="Results" 
            component={ResultsScreen}
            options={{ 
              title: 'Price Analysis',
              headerBackTitleVisible: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
} 