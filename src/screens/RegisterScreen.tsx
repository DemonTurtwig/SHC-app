// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

/* ---------- nav / route generics ---------- */
type RegNav   = NativeStackNavigationProp<RootStackParamList>;
type RegRoute = RouteProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegNav>();
  const route      = useRoute<RegRoute>();
  const { registerGuest } = useAuth();
  const isGuest = route.params?.isGuest ?? false;

  const [name, setName]                 = useState('');
  const [phone, setPhone]               = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [address, setAddress]           = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);

  /* ---------- helpers ---------- */
  const handlePhoneInput = (input: string) => {
    const digits = input.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 3 && digits.length <= 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }
    setPhone(formatted);
  };

  const validateFields = () => {
    const nameRx = /^[가-힣a-zA-Z\s\-]{2,}$/;
    const phoneRx = /^010-\d{3,4}-\d{4}$/;
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pwRx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

    if (!name) return '이름을 입력해주세요.';
    if (!nameRx.test(name)) return '이름은 한글/영문 2자 이상 (공백·하이픈 허용)';
    if (!phone) return '휴대폰 번호를 입력해주세요.';
    if (!phoneRx.test(phone)) return '휴대폰 번호는 010-XXXX-XXXX 형식이어야 합니다.';
    if (!address) return '주소를 입력해주세요.';

    if (!isGuest) {
      if (!email) return '이메일을 입력해주세요.';
      if (!emailRx.test(email)) return '이메일 형식이 올바르지 않습니다.';
      if (!password) return '비밀번호를 입력해주세요.';
      if (!pwRx.test(password)) return '비밀번호는 대/소문자·숫자 포함 6자 이상';
      if (!passwordConfirm) return '비밀번호 확인을 입력해주세요.';
      if (password !== passwordConfirm) return '비밀번호가 일치하지 않습니다.';
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validateFields();
    if (error) {
      Alert.alert('입력 오류', error);
      return;
    }

    try {
      if (isGuest) {
        await registerGuest(name, phone, address, addressDetail);
        Alert.alert('등록 완료', '비회원 정보가 저장되었습니다.');
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }
      else {
        await axios.post('https://smart-homecare-backend.onrender.com/api/register', {
          name,
          phone,
          email,
          password,
          address,
          addressDetail,
        });
        Alert.alert('등록 성공!', '스마트홈케어 아이디 등록이 완료되었습니다.');
        navigation.navigate('Login');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? '처리에 실패했습니다.');
    }
  };

  /* ---------- UI ---------- */
  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.container}>
      <Text style={styles.title}>{isGuest ? '비회원 정보 등록' : '스마트홈케어에 가입하기'}</Text>

      <TextInput placeholder="이름"            value={name}            onChangeText={setName}            style={styles.input} />
      <TextInput placeholder="휴대폰 번호"    value={phone}           onChangeText={handlePhoneInput} style={styles.input} keyboardType="number-pad" maxLength={13} />

      {!isGuest && (
        <>
          <TextInput placeholder="이메일"        value={email}           onChangeText={setEmail}          style={styles.input} autoCapitalize="none" />
          <TextInput placeholder="패스워드"      value={password}        onChangeText={setPassword}       style={styles.input} secureTextEntry />
          <TextInput placeholder="비밀번호 확인" value={passwordConfirm} onChangeText={setPasswordConfirm} style={styles.input} secureTextEntry />
        </>
      )}

      <TouchableOpacity
        onPress={() =>
          navigation.navigate('AddressSearchScreen', {
            onSelect: (addr: string) => {
              const tokens = addr.trim().split(' ');
              if (tokens.length >= 2) {
                setAddress(tokens.slice(0, -1).join(' ').trim());
                setAddressDetail(tokens[tokens.length - 1].trim());
              } else {
                setAddress(addr);
                setAddressDetail('');
              }
            },
          })
        }
  style={styles.addressBox}
>
  <Text style={address ? styles.addressText : styles.addressPlaceholder}>
    {address || '주소 검색하기'}
  </Text>
</TouchableOpacity>

{addressDetail && (
  <View style={styles.addressDetailBox}>
    <Text style={{
      color: '#333',
      fontSize: 14,
      fontFamily: 'Pretendard-Regular',
    }}>
      상세 주소: {addressDetail}
    </Text>
  </View>
)}



      <TouchableOpacity style={styles.loginButton} onPress={handleSubmit}>
        <Text style={styles.loginText}>
          {isGuest ? '정보 등록 후 예약하기' : '회원가입'}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default RegisterScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'JalnanGothic',
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    color: '#010198',
  },
  input: {
    fontFamily: 'Pretendard-Regular',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  addressBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 14,
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  addressText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
  },
  addressPlaceholder: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    color: '#999',
  },
  loginButton: {
    backgroundColor: '#007BFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  loginText: {
    fontFamily: 'Pretendard-Bold',
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  addressOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  addressDetailBox: {
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
  },  
});
