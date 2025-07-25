import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TextInput, Image, TouchableOpacity,
  Alert, ScrollView, Platform
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
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
  const { loginEmail, loginKakao, loginApple, token, isLoading, currentUser } = useAuth();

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
      if (!KakaoLogins || typeof KakaoLogins.login !== 'function') {
    alert('Kakao module is not linked. 😡');
  }
  }, [token, currentUser]);

  /* --- email login handler --- */
  const handleEmailLogin = () => loginEmail(email, password);


/* -- native Kakao login + scopes + debug logging -- */
const handleKakaoNativeLogin = async () => {
  try {
    /* 1️⃣ sign-in (+ scopes) */
    const loginRes = await (KakaoLogins as any).loginWithKakaoAccount({
      scopes: ['profile_nickname', 'phone_number', 'shipping_address'],
    });
    let { accessToken } = loginRes;

    /* 2️⃣ read the address list (may be empty) */
    let bestAddr: { baseAddress?: string; detailAddress?: string } | null = null;
    try {
      const ship = await (KakaoLogins as any).shippingAddresses();

      const list = ship?.shippingAddresses ?? [];
      const picked = list.find((a: any) => a.isDefault) ?? list[0];
      if (picked?.baseAddress) {
        bestAddr = {
          baseAddress:  picked.baseAddress,
          detailAddress: picked.detailAddress ?? '',
        };
      }
    } catch (e) {
    }

    /* 3️⃣ send BOTH token + address */
   await loginKakao(accessToken, bestAddr);
  } catch (err) {
    console.error('Kakao native login error:', err);
    Alert.alert('로그인 실패', '카카오 로그인 중 오류가 발생했습니다.');
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
    <ScrollView
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
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
    

      {Platform.OS === 'ios' && (
  <AppleAuthentication.AppleAuthenticationButton
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
    cornerRadius={8}
    style={{ width: '100%', height: 44, marginTop: 12 }}
    onPress={async () => {
      try {
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
        });

        // 🔗 Call real login handler from AuthContext
        await loginApple({
          identityToken: credential.identityToken!,
          authorizationCode: credential.authorizationCode!,
        });

      } catch (e: any) {
        if (e.code === 'ERR_CANCELED') {
          console.log('Apple login canceled by user');
        } else {
          console.error('Apple login failed:', e);
          Alert.alert('Apple 로그인 실패', e.message ?? '다시 시도해주세요.');
        }
      }
    }}
  />
)}


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
    </ScrollView>
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