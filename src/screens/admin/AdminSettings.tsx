// screens/admin/AdminSettings.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

type Field = 'name' | 'phone' | 'password' | null;

export default function AdminSettings() {
  const { logout, token } = useAuth();
  const navigation = useNavigation<any>();

  /* ---------- user info ---------- */
  const [userInfo, setUserInfo] = useState({
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await axios.get(
          'https://smart-homecare-backend.onrender.com/api/users/me',
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setUserInfo({
          name: data.name ?? '',
          phone: formatPhone(data.phone ?? ''),
          address: data.address ?? '',
        });
      } catch {
        Alert.alert('오류', '사용자 정보를 불러오지 못했습니다.');
      }
    };
    token && fetchMe();
  }, [token]);

  const cleanPhone = (p: string) => p.replace(/\D/g, '');

  const formatPhone = (p: string) => {
    const d = cleanPhone(p);
    return d.length === 11 ? `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}` : p;
  };

  /* ---------- edit state ---------- */
  const [editField, setEditField] = useState<Field>(null);
  const [editValue, setEditValue] = useState('');

  const saveEdit = async () => {
    if (!editField) return;

    if (editField === 'password' && editValue.length < 6) {
      Alert.alert('오류', '비밀번호는 최소 6자리여야 합니다.');
      return;
    }

    try {
      const { data } = await axios.patch(
        'https://smart-homecare-backend.onrender.com/api/users/me',
        { [editField]: editValue },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (editField !== 'password') {
        setUserInfo(cur => ({ ...cur, [editField]: data[editField] }));
        Alert.alert('완료', `${editField === 'name' ? '이름' : '연락처'}가 변경되었습니다.`);
      } else {
        Alert.alert('완료', '비밀번호가 변경되었습니다.');
      }
      setEditField(null);
    } catch {
      Alert.alert('오류', '정보 수정 실패');
    }
  };

  /* ---------- reusable row ---------- */
  const Row = ({
    icon,
    label,
    field,
    secure = false,
  }: {
    icon: any;
    label: string;
    field: Field;
    secure?: boolean;
  }) => (
    <View style={styles.row}>
      <Image source={icon} style={styles.icon} />
      {editField === field ? (
        <TextInput
          value={editValue}
          onChangeText={setEditValue}
          secureTextEntry={secure}
          keyboardType={field === 'phone' ? 'phone-pad' : 'default'}
          placeholder={field === 'password' ? '새 비밀번호 입력' : undefined}
          style={[
            styles.label,
            { borderBottomWidth: 1, borderColor: '#ccc', paddingBottom: 2 },
          ]}
        />
      ) : (
        <Text style={styles.label}>
          {label}:{' '}
          {field === 'password' ? '••••••••': userInfo[(field ?? 'name') as 'name' | 'phone']}
        </Text>
      )}

      <TouchableOpacity
        style={styles.changeBtn}
        onPress={() => {
          if (editField === field) {
            saveEdit();
          } else {
            setEditField(field);
            setEditValue(field ? userInfo[field as 'name' | 'phone'] : '');
          }
        }}
      >
        <Text style={styles.changeText}>
          {editField === field ? '저장' : '변경'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { paddingBottom: 100 }]}
      >
        <Text style={styles.title}>관리자 설정</Text>

        <View style={styles.rowGroup}>
          <Row
            icon={require('../../assets/icons/user.png')}
            label="이름"
            field="name"
          />

          <Row
            icon={require('../../assets/icons/phone-icon.png')}
            label="연락처"
            field="phone"
          />

          <Row
            icon={require('../../assets/icons/password.png')}
            label="비밀번호"
            field="password"
            secure
          />

          {/* 주소 (opens the search screen) */}
          <View style={styles.row}>
            <Image
              source={require('../../assets/icons/home.png')}
              style={styles.icon}
            />
            <Text style={styles.label}>주소: {userInfo.address}</Text>
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() =>
                navigation.navigate(
                  'AddressSearchScreen' as never,
                  {
                    onSelect: async (addr: string) => {
                      try {
                        const { data } = await axios.patch(
                          '/api/users/me',
                          { address: addr },
                          {
                            baseURL:
                              'https://smart-homecare-backend.onrender.com',
                            headers: { Authorization: `Bearer ${token}` },
                          },
                        );
                        setUserInfo(cur => ({
                          ...cur,
                          address: data.address,
                        }));
                      } catch {
                        Alert.alert('오류', '주소 저장 실패');
                      }
                    },
                  } as never,
                )
              }
            >
              <Text style={styles.changeText}>변경</Text>
            </TouchableOpacity>
          </View>

          {/* logout */}
          <View style={styles.row}>
            <Image
              source={require('../../assets/icons/logout.png')}
              style={styles.icon}
            />
            <Text style={styles.label}>로그아웃</Text>
            <TouchableOpacity
              style={styles.changeBtn}
              onPress={async () => {
                await logout();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' as never }],
                });
              }}
            >
              <Text style={styles.changeText}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* footer (Settings active) */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <Image
            source={require('../../assets/icons/home.png')}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>홈</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('AdminUsers')}
        >
          <Image
            source={require('../../assets/icons/user.png')}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>유저</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('AdminBookings')}
        >
          <Image
            source={require('../../assets/icons/view-order.png')}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>예약</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerItem, styles.activeTab]}
          onPress={() => {
            /* already here */
          }}
        >
          <Image
            source={require('../../assets/icons/settings.png')}
            style={[styles.footerIcon, styles.activeIcon]}
          />
          <Text style={[styles.footerText, styles.activeText]}>설정</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

/* ---------- styles (same palette as other admin screens) ---------- */
const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { paddingTop: 60, paddingHorizontal: 24 },
  title: {
    fontFamily: 'JalnanGothic',
    fontSize: 28,
    color: '#010198',
    textAlign: 'center',
    marginBottom: 40,
  },
  rowGroup: { gap: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: { width: 24, height: 24, tintColor: '#007BFF', marginRight: 12 },
  label: {
    flex: 1,
    fontFamily: 'Pretendard-Regular',
    fontSize: 16,
    color: '#333',
  },
  changeBtn: {
    backgroundColor: '#e3f0ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  changeText: { color: '#007BFF', fontFamily: 'Pretendard-Bold', fontSize: 14 },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#dbe9f9',
    backgroundColor: '#fff',
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
  activeTab: { backgroundColor: '#d0eaff' },
  activeIcon: { tintColor: '#007BFF' },
  activeText: { color: '#007BFF', fontFamily: 'Pretendard-Bold' },
});
