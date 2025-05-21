import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Image, Alert,
} from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

interface User {
  _id: string;
  name: string;
  phone: string;
  email: string;
  isAdmin: boolean;
}

export default function AdminUsers() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<User[]>([]);

  /* -------- fetch -------- */
  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        'https://smart-homecare-backend.onrender.com/api/admin/users',
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('오류', '유저 목록을 불러오지 못했습니다.');
    }
  };
  useEffect(() => { fetchUsers(); }, []);

  /* -------- promote / demote -------- */
  const toggleAdmin = (user: User) => {
    const makeAdmin = !user.isAdmin;
    Alert.alert(
      makeAdmin ? '관리자 부여' : '관리자 해제',
      `${user.name ?? '이 유저'}에게 ${
        makeAdmin ? '관리자 권한을 부여' : '관리자 권한을 해제'
      }하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async () => {
            try {
              await axios.patch(
                `https://smart-homecare-backend.onrender.com/api/admin/users/${user._id}/role`,
                  { isAdmin: makeAdmin },
                  { headers: { Authorization: `Bearer ${token}` } },
              );
              fetchUsers();
            } catch (err) {
              console.error(err);
              Alert.alert('오류', '역할 변경 실패');
            }
          },
        },
      ],
    );
  };

  /* -------- delete user (unchanged) -------- */
  const deleteUser = (id: string) => {
    Alert.alert('삭제 확인', '정말로 이 사용자를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(
              `https://smart-homecare-backend.onrender.com/api/admin/users/${id}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            fetchUsers();
          } catch {
            Alert.alert('오류', '사용자 삭제 실패');
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>유저 관리</Text>

        <FlatList
          data={users}
          keyExtractor={u => u._id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Image
                source={require('../../assets/icons/user.png')}
                style={styles.icon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>{item.phone}</Text>
                <Text style={styles.sub}>{item.email}</Text>
                <Text style={styles.role}>
                  역할: {item.isAdmin ? '관리자' : '일반'}
                </Text>
              </View>

              {/* promote / demote */}
              <TouchableOpacity onPress={() => toggleAdmin(item)}>
                <Image
                  source={
                    item.isAdmin
                      ? require('../../assets/icons/remove-admin.png')  /* red icon */
                      : require('../../assets/icons/make-admin.png')    /* blue icon */
                  }
                  style={[
                    styles.actionIcon,
                    { tintColor: item.isAdmin ? '#d32f2f' : '#007BFF' },
                  ]}
                />
              </TouchableOpacity>

              {/* delete (disabled for admins) */}
              {!item.isAdmin && (
                <TouchableOpacity onPress={() => deleteUser(item._id)}>
                  <Image
                    source={require('../../assets/icons/delete-user.png')}
                    style={styles.actionIcon}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>

      {/* footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <Image source={require('../../assets/icons/home.png')} style={styles.footerIcon} />
          <Text style={styles.footerText}>홈</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerItem, styles.activeTab]}
          onPress={() => {/* already here */}}
        >
          <Image
            source={require('../../assets/icons/user.png')}
            style={[styles.footerIcon, styles.activeIcon]}
          />
          <Text style={[styles.footerText, styles.activeText]}>유저</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('AdminBookings')}
        >
          <Image source={require('../../assets/icons/view-order.png')} style={styles.footerIcon} />
          <Text style={styles.footerText}>예약</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('AdminSettings')}
        >
          <Image source={require('../../assets/icons/settings.png')} style={styles.footerIcon} />
          <Text style={styles.footerText}>설정</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

/* ------ styles (unchanged except role text) ------ */
const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 24 },
  title: { fontFamily: 'JalnanGothic', fontSize: 28, color: '#010198', textAlign: 'center', marginBottom: 24 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  icon: { width: 40, height: 40, tintColor: '#007BFF', marginRight: 12 },
  actionIcon: { width: 24, height: 24, marginLeft: 12 },
  name: { fontFamily: 'Pretendard-Bold', fontSize: 16, color: '#333' },
  sub: { fontFamily: 'Pretendard-Regular', fontSize: 13, color: '#555' },
  role: { fontFamily: 'Pretendard-Regular', fontSize: 13, color: '#999', marginTop: 4 },
  footer: {
    flexDirection: 'row', justifyContent: 'space-around', width: '100%',
    borderTopWidth: 1, borderColor: '#dbe9f9', backgroundColor: '#fff',
    paddingVertical: 10, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 5,
  },
  footerItem: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16 },
  footerIcon: { width: 24, height: 24, tintColor: '#90a4ae', marginBottom: 4 },
  footerText: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: '#90a4ae' },
  activeTab: { backgroundColor: '#d0eaff' },
  activeIcon: { tintColor: '#007BFF' },
  activeText: { color: '#007BFF', fontFamily: 'Pretendard-Bold' },
});
