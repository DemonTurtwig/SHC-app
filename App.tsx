// App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useFonts } from 'expo-font';
import { View, Text } from 'react-native';
import Toast from 'react-native-toast-message';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Thin': require('./src/assets/fonts/Pretendard-Thin.otf'),
    'Pretendard-ExtraLight': require('./src/assets/fonts/Pretendard-ExtraLight.otf'),
    'Pretendard-Light': require('./src/assets/fonts/Pretendard-Light.otf'),
    'Pretendard-Regular': require('./src/assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./src/assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('./src/assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./src/assets/fonts/Pretendard-Bold.otf'),
    'Pretendard-ExtraBold': require('./src/assets/fonts/Pretendard-ExtraBold.otf'),
    'Pretendard-Black': require('./src/assets/fonts/Pretendard-Black.otf'),
    'PretendardStd-Thin': require('./src/assets/fonts/PretendardStd-Thin.otf'),
    'PretendardStd-ExtraLight': require('./src/assets/fonts/PretendardStd-ExtraLight.otf'),
    'PretendardStd-Light': require('./src/assets/fonts/PretendardStd-Light.otf'),
    'PretendardStd-Regular': require('./src/assets/fonts/PretendardStd-Regular.otf'),
    'PretendardStd-Medium': require('./src/assets/fonts/PretendardStd-Medium.otf'),
    'PretendardStd-SemiBold': require('./src/assets/fonts/PretendardStd-SemiBold.otf'),
    'PretendardStd-Bold': require('./src/assets/fonts/PretendardStd-Bold.otf'),
    'PretendardStd-ExtraBold': require('./src/assets/fonts/PretendardStd-ExtraBold.otf'),
    'PretendardStd-Black': require('./src/assets/fonts/PretendardStd-Black.otf'),
    'JalnanGothic': require('./src/assets/fonts/JalnanGothic.otf'),
  });

  if (!fontsLoaded) {
    return <View><Text>Loading...</Text></View>;
  }

  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
      <Toast />
    </AuthProvider>
  );
}