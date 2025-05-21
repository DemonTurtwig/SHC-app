import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TextInput, Image, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as KakaoLogins from '@react-native-seoul/kakao-login';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

const introLogo = require('../assets/icons/intro-logo.png');
const kakaoIcon  = require('../assets/icons/kakao-icon.png');

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { loginEmail, loginKakao, token, isLoading, currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /* --- post-login redirect --- */
  useEffect(() => {
    if (token && currentUser) {
      setTimeout(() => {
        if (currentUser.isAdmin) {
          navigation.reset({ index: 0, routes: [{ name: 'AdminDashboard' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
      }, 100);
    }
     console.log('🔍 KakaoLogins object:', KakaoLogins);
      if (!KakaoLogins || typeof KakaoLogins.login !== 'function') {
    alert('Kakao module is not linked. 😡');
  }
  }, [token, currentUser]);

  /* --- email login handler --- */
  const handleEmailLogin = () => loginEmail(email, password);

  /* --- native Kakao login --- */
  const handleKakaoNativeLogin = async () => {
    try {
      const result = await KakaoLogins.login();
      const accessToken = result.accessToken;
      await loginKakao(accessToken); // Sends token to backend
    } catch (err) {
      console.error('Kakao native login error:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.container}>
      <Image source={introLogo} style={styles.logo} />
      <Text style={styles.title}>SMART HOMECARE</Text>
      <Text style={styles.subTitle}>스마트홈케어</Text>

      <TextInput
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="패스워드"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleEmailLogin}>
        <Text style={styles.loginText}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.kakaoButton} onPress={handleKakaoNativeLogin}>
        <Image source={kakaoIcon} style={styles.kakaoIcon} />
        <Text style={styles.kakaoText}>카카오로 로그인</Text>
      </TouchableOpacity>

      <Text style={styles.or}>또는</Text>

      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.registerText}>
          아직 계정이 없으신가요? <Text style={styles.strongText}>회원가입</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.guestCTA}
        onPress={() => navigation.navigate('Register', { isGuest: true })}
      >
        <Text style={styles.guestCTAText}>비회원으로 예약하기</Text>
        <Text style={styles.guestSubText}>로그인 없이 예약이 가능합니다</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'JalnanGothic',
    fontSize: 32,
    textAlign: 'center',
    color: '#010198',
  },
  subTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 17,
    color: '#040498',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 2,
  },
  input: {
    fontFamily: 'Pretendard-Regular',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  or: {
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  registerButton: {
    marginBottom: 16,
    marginTop: 12,
    alignSelf: 'center',
  },
  registerText: {
    fontFamily: 'Pretendard-Regular',
    color: '#555',
    fontSize: 14,
  },
  strongText: {
    fontFamily: 'Pretendard-Bold',
    color: '#007BFF',
  },
  loginButton: {
    backgroundColor: '#007BFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    fontFamily: 'Pretendard-Bold',
    color: '#fff',
    fontSize: 16,
  },
  kakaoButton: {
    flexDirection: 'row',
    backgroundColor: '#FEE500',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  kakaoIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    resizeMode: 'contain',
  },
  kakaoText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 16,
  },
  guestCTA: {
    backgroundColor: '#e8f0fe',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  guestCTAText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 17,
    color: '#174ea6',
  },
  guestSubText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 13,
    color: '#5f6368',
    marginTop: 4,
  },
});