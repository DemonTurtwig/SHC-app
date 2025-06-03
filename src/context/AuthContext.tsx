import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import axios from 'axios';
import { loginWithEmail, loginWithKakao } from '../services/authService';
import * as KakaoLogins from '@react-native-seoul/kakao-login';

export interface ClientUser {
  _id: string;
  userId?: number;
  name: string;
  phone: string;
  email?: string;
  provider: string;
  isAdmin?: boolean;
  address?: string;
  addressDetail?: string;
  isGuest?: boolean;
  kakaoId?: string;
}

interface AuthContextType {
  /* state */
  token: string | null;
  currentUser: ClientUser | null;
  isLoading: boolean;
  isGuestMode: boolean;
  guestId: string | null;
  /* actions */
  setToken: (t: string | null) => void;
  loginEmail: (email: string, password: string) => Promise<void>;
  loginKakao: ( accessToken: string, shippingAddr?: {baseAddress?:  string; detailAddress?: string; } | null,) => Promise<void>;
  registerGuest: (name: string, phone: string, address: string, addressDetail?: string) => Promise<void>;
  logout: () => void;
  deleteUser: () => Promise<void>;
}

/*──────────────────────────────────────────────────────────
 * Context & Hook
 *──────────────────────────────────────────────────────────*/
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/*──────────────────────────────────────────────────────────
 * Provider
 *──────────────────────────────────────────────────────────*/
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<ClientUser | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /* Fetch profile when token changes */
  useEffect(() => {
    const fetchProfile = async (jwt: string) => {
      try {
        const res = await axios.get('https://smart-homecare-backend.onrender.com/api/users/me', {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        setCurrentUser(res.data);
        setIsGuestMode(false);
      } catch (err) {
        console.error('⚠️  Failed to load user profile:', err);
        setCurrentUser(null);
        setIsGuestMode(true);
      }
    };

    if (token) fetchProfile(token);
    else setCurrentUser(null);
  }, [token]);

  /* First-run: load token/guestId from storage */
  useEffect(() => {
    const initialize = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        const storedGuest = await AsyncStorage.getItem('guestId');
        if (storedToken) setToken(storedToken);
        else if (storedGuest) {
          setGuestId(storedGuest);
          setIsGuestMode(true);
        }
      } catch (err) {
        console.error('AuthContext init error:', err);
        Alert.alert('초기화 오류', '인증 정보를 불러오는 중 문제가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  /* Guest registration */
  const registerGuest = async (
    name: string,
    phone: string,
    address: string,
    addressDetail?: string
  ) => {
    try {
      const res = await axios.post('https://smart-homecare-backend.onrender.com/api/register', {
        isGuest: true,
        name,
        phone,
        address,
        addressDetail,
      });
      const { userId, token: jwt } = res.data;
        await AsyncStorage.setItem('guestId', userId.toString());
        await SecureStore.setItemAsync('token', jwt);
        setToken(jwt);
        setGuestId(userId.toString());
        setIsGuestMode(true);
      console.log('✅ Guest registered with userId:', userId);
    } catch (err: any) {
      console.error('Guest registration failed:', err.response?.data || err.message);
      Alert.alert('등록 실패', '비회원 등록 중 문제가 발생했습니다.');
    }
  };

  /* Email login */
  const loginEmail = async (email: string, password: string) => {
    try {
      const { token: jwt } = await loginWithEmail(email, password);
      await SecureStore.setItemAsync('token', jwt);
      setToken(jwt);
      setIsGuestMode(false);
    } catch (err: any) {
      console.error('Login error:', err);
      Alert.alert('로그인 실패', err.message || '이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };
  
const loginKakao = async (accessToken: string, shippingAddr?: { baseAddress?: string; detailAddress?: string } | null,) => {
   try {
     const { token: jwt, user, needsPhoneUpdate } =  await loginWithKakao(accessToken, shippingAddr);

    await SecureStore.setItemAsync('token', jwt);
    setToken(jwt);
    setCurrentUser(user);
    setIsGuestMode(false);

    if (needsPhoneUpdate) {
      Alert.alert(
        '전화번호 필요',
        '내 정보 → 전화번호 메뉴에서 휴대폰 번호를 등록해주세요.',
      );
    }
  } catch (err: any) {
    console.error('Kakao login error:', err);
    Alert.alert('카카오 로그인 실패', err.message || '다시 시도해주세요.');
  }
};

  /* Logout */
  const logout = async () => {
    try {
      setToken(null);
      setCurrentUser(null);
      await SecureStore.deleteItemAsync('token');
      await AsyncStorage.removeItem('guestId');
      setIsGuestMode(true);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  /* Delete user (탈퇴) */
  const deleteUser = async () => {
  if (!token || !currentUser) return;

  try {
    if (currentUser.provider === 'kakao') {
      await axios.delete('https://smart-homecare-backend.onrender.com/api/kakao/delete', {
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      await axios.delete(`https://smart-homecare-backend.onrender.com/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    Alert.alert('계정 삭제', '계정이 삭제되었습니다.');
    logout();
  } catch (err) {
    console.error('Delete user failed:', err);
    Alert.alert('삭제 실패', '계정을 삭제하지 못했습니다.');
  }
};

  /* Provider value */
  return (
    <AuthContext.Provider
      value={{
        token,
        currentUser,
        isLoading,
        isGuestMode,
        guestId,
        setToken,
        loginEmail,
        loginKakao,
        registerGuest,
        logout,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};