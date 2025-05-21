// src/screens/SettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Alert, TextInput, ScrollView,
} from 'react-native';
import {
  useNavigation,
  RouteProp,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';   // adjust path if needed

/* ---------- nav / route generics ---------- */
type SetNav   = NativeStackNavigationProp<RootStackParamList>;
type SetRoute = RouteProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const navigation = useNavigation<SetNav>();
  useRoute<SetRoute>();            // only to satisfy unused param warning
  const { logout, token, guestId } = useAuth();

  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    address: '',
    isGuest: false,
  });

  /* ---------- editable fields ---------- */
  const [editField, setEditField] = useState<null | 'name' | 'phone' | 'password'>(null);
  const [editValue, setEditValue] = useState('');

  /* ---------- fetch user ---------- */
  useEffect(() => {
    const fetchMe = async () => {
      try {
        if (token) {
          const { data } = await axios.get(
            'https://smart-homecare-backend.onrender.com/api/users/me',
            { headers: { Authorization: `Bearer ${token}` } },
          );
          setUserInfo({
            name: data.name ?? '',
            phone: formatPhone(data.phone ?? ''),
            address: data.address ?? '',
            isGuest: data.isGuest ?? false,
          });
        } else if (guestId) {
          const { data } = await axios.get(
            `https://smart-homecare-backend.onrender.com/api/guests/${guestId}`
          );
          setUserInfo({
            name: data.name ?? '',
            phone: formatPhone(data.phone ?? ''),
            address: data.address ?? '',
            isGuest: true,
          });
        }
      } catch {
        Alert.alert('오류', '사용자 정보를 불러오는 데 실패했습니다.');
      }
    };
  
    fetchMe();
  }, [token, guestId]);
  

  /* ---------- delete account ---------- */
  const handleDeleteAccount = () => {
    Alert.alert('계정 삭제 확인', '정말로 계정을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          try {
              await axios.delete(
              'https://smart-homecare-backend.onrender.com/api/users/me',
              { headers: { Authorization: `Bearer ${token}` } }
              );
  
            Alert.alert('삭제 완료', '계정이 삭제되었습니다.', [
              {
                text: '확인',
                onPress: () => {
                  logout();
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                },
              },
            ]);
          } catch {
            Alert.alert('오류', '계정 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };
  
  /* ---------- helpers for each field ---------- */
  const saveField = async (field: 'name' | 'phone' | 'password', value: string) => {
    try {
      const { data } = await axios.patch(
        'https://smart-homecare-backend.onrender.com/api/users/me',
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setUserInfo(cur => ({ ...cur, [field]: data[field] }));
      setEditField(null);
    } catch {
      Alert.alert('오류', `${field} 변경 실패`);
    }
  };

  const cleanPhone = (p: string) => p.replace(/\D/g, '');

  const formatPhone = (p: string) => {
    const d = cleanPhone(p);
    return d.length === 11 ? `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}` : p;
  };

  /* ---------- UI ---------- */
  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>유저 설정</Text>

        {/* ---------- editable rows ---------- */}
        <View style={styles.rowGroup}>
          {/* Name */}
          <EditableRow
            icon={require('../assets/icons/user.png')}
            label="이름"
            value={userInfo.name}
            field="name"
            editField={editField}
            setEditField={setEditField}
            editValue={editValue}
            setEditValue={setEditValue}
            onSave={saveField}
          />

          {/* Phone */}
          <EditableRow
            icon={require('../assets/icons/phone-icon.png')}
            label="연락처"
            value={userInfo.phone}
            field="phone"
            keyboardType="phone-pad"
            editField={editField}
            setEditField={setEditField}
            editValue={editValue}
            setEditValue={setEditValue}
            onSave={saveField}
          />

          {/* Password */}
          { !userInfo.isGuest && (
            <EditableRow
              icon={require('../assets/icons/password.png')}
              label="비밀번호"
              value="••••••••"
              field="password"
              secure
              editField={editField}
              setEditField={setEditField}
              editValue={editValue}
              setEditValue={setEditValue}
              onSave={saveField}
            />
          )}

          {/* Address */}
          <View style={styles.row}>
            <Image source={require('../assets/icons/home.png')} style={styles.icon} />
            <Text style={styles.label}>주소: {userInfo.address}</Text>
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() =>
                navigation.navigate('AddressSearchScreen', {
                  onSelect: async addr => {
                    try {
                      const { data } = await axios.patch(
                        '/api/users/me',
                        { address: addr },
                        {
                          baseURL: 'https://smart-homecare-backend.onrender.com',
                          headers: { Authorization: `Bearer ${token}` },
                        },
                      );
                      setUserInfo(cur => ({ ...cur, address: data.address }));
                    } catch {
                      Alert.alert('오류', '주소 저장 실패');
                    }
                  },
                })
              }
            >
              <Text style={styles.changeText}>변경</Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          { !userInfo.isGuest && (
          <SimpleRow
            icon={require('../assets/icons/logout.png')}
            label="로그아웃"
            actionLabel="로그아웃"
            onPress={async () => {
              await logout();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }}
          />
        )}

          {/* Delete */}
          <SimpleRow
            icon={require('../assets/icons/delete-user.png')}
            label="회원 탈퇴"
            actionLabel="삭제"
            actionColor="#d32f2f"
            onPress={handleDeleteAccount}
          />
        </View>

        <View style={styles.contactBox}>
          <Text style={styles.contactLabel}>스마트홈케어 고객센터</Text>
          <Text style={styles.contactNumber}>1588-5678</Text>
        </View>
      </ScrollView>

      {/* footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('History')}
        >
          <Image source={require('../assets/icons/history.png')} style={styles.footerIcon} />
          <Text style={styles.footerText}>예약내역</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Image source={require('../assets/icons/home.png')} style={styles.footerIcon} />
          <Text style={styles.footerText}>홈</Text>
        </TouchableOpacity>

        <View style={[styles.footerItem, styles.activeTab]}>
          <Image
            source={require('../assets/icons/user.png')}
            style={[styles.footerIcon, styles.activeIcon]}
          />
          <Text style={[styles.footerText, styles.activeText]}>유저 설정</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

/* ---------- helper sub-components ---------- */
type Field = 'name' | 'phone' | 'password';

const EditableRow = ({
  icon,
  label,
  value,
  field,
  keyboardType,
  secure,
  editField,
  setEditField,
  editValue,
  setEditValue,
  onSave,
}: {
  icon: any;
  label: string;
  value: string;
  field: Field;
  keyboardType?: 'default' | 'phone-pad';
  secure?: boolean;
  editField: Field | null;
  setEditField: React.Dispatch<React.SetStateAction<Field | null>>;
  editValue: string;
  setEditValue: React.Dispatch<React.SetStateAction<string>>;
  onSave: (f: Field, v: string) => void;
}) => (
  <View style={styles.row}>
    <Image source={icon} style={styles.icon} />
    {editField === field ? (
      <TextInput
        value={editValue}
        onChangeText={setEditValue}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        placeholder={field === 'password' ? '새 비밀번호 입력' : undefined}
        style={[styles.label, { borderBottomWidth: 1, borderColor: '#ccc', paddingBottom: 2 }]}
      />
    ) : (
      <Text style={styles.label}>
        {label}: {value}
      </Text>
    )}
    <TouchableOpacity
      style={styles.changeBtn}
      onPress={() => {
        if (editField === field) {
          if (field === 'password' && editValue.length < 6) {
            Alert.alert('오류', '비밀번호는 최소 6자리여야 합니다.');
            return;
          }
          onSave(field, editValue);
        } else {
          setEditField(field);
          setEditValue(value);
        }
      }}
    >
      <Text style={styles.changeText}>{editField === field ? '저장' : '변경'}</Text>
    </TouchableOpacity>
  </View>
);

const SimpleRow = ({
  icon,
  label,
  actionLabel,
  actionColor = '#007BFF',
  onPress,
}: {
  icon: any;
  label: string;
  actionLabel: string;
  actionColor?: string;
  onPress: () => void;
}) => (
  <View style={styles.row}>
    <Image source={icon} style={styles.icon} />
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.changeBtn} onPress={onPress}>
      <Text style={[styles.changeText, { color: actionColor }]}>{actionLabel}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'JalnanGothic',
    fontSize: 28,
    color: '#010198',
    textAlign: 'center',
    marginBottom: 40,
  },

  rowGroup: {
    gap: 14,
  },
  row: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#007BFF',
    marginRight: 12,
  },
  label: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  changeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e3f0ff',
    borderRadius: 8,
  },
  changeText: {
    fontFamily: 'Pretendard-Bold',
    color: '#007BFF',
    fontSize: 14,
  },
  contactBox: {
    marginTop: 25,
    alignItems: 'center',
  },
  contactLabel: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 14,
    color: '#333',
  },
  contactNumber: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 20,
    color: '#010198',
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#dbe9f9',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  footerItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  footerIcon: {
    width: 24,
    height: 24,
    tintColor: '#90a4ae',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#90a4ae',
  },
  activeTab: {
    backgroundColor: '#d0eaff',
  },
  activeIcon: {
    tintColor: '#007BFF',
  },
  activeText: {
    color: '#007BFF',
    fontFamily: 'Pretendard-Bold',
  },
});