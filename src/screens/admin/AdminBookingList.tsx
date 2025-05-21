// screens/admin/AdminBookingList.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import dayjs from 'dayjs';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';

/* ---------- types ---------- */
interface Booking {
  _id: string;
  name: string | null;
  reservationDate: string;
  reservationTime: string;
  totalPrice: number;
  status: '대기' | '확정' | '완료' | '취소';
  userAddress?: string;
  userPhone?: string;
}


const statusOptions: Booking['status'][] = ['대기', '확정', '완료', '취소'];

/* ---------- status colours ---------- */
const statusColor: Record<Booking['status'], string> = {
  대기: '#ff9800',
  확정: '#2196f3',
  완료: '#4caf50',
  취소: '#d32f2f',
};
const StatusPill = ({ status }: { status: Booking['status'] }) => {
  const color = statusColor[status];
  return (
    <View style={[styles.pill, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.pillText, { color }]}>{status}</Text>
    </View>
  );
};

/* ---------- main component ---------- */
export default function AdminBookingList() {
  const { token } = useAuth();
  const navigation = useNavigation<any>();

  /* date range: default = 1 month */
  const today       = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState<Date>(oneMonthAgo);
  const [endDate,   setEndDate]   = useState<Date>(today);
  const [showStart, setShowStart] = useState(false);
  const [showEnd,   setShowEnd]   = useState(false);

  /* bookings */
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(false);

  /* edit modal */
  const [editing,  setEditing]  = useState<Booking | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        'https://smart-homecare-backend.onrender.com/api/admin/bookings/filter',
        {
          start: dayjs(startDate).format('YYYY-MM-DD'),  
          end: dayjs(endDate).format('YYYY-MM-DD'),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setBookings(res.data);
    } catch (err) {
      console.error('fetchBookings error', err);
      Alert.alert('오류', '예약을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchBookings(); }, []);   // first load

  /* save status */
  const saveStatus = async (newStatus: Booking['status']) => {
    if (!editing) return;
    try {
      await axios.patch(
        `https://smart-homecare-backend.onrender.com/api/admin/bookings/${editing._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEditing(null);
      fetchBookings();
    } catch (err) {
      console.error('updateStatus error', err);
      Alert.alert('오류', '상태 변경에 실패했습니다.');
    }
  };
  
  const deleteBooking = async (id: string) => {
    Alert.alert('삭제 확인', '정말로 이 예약을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(
              `https://smart-homecare-backend.onrender.com/api/admin/bookings/${id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchBookings(); // refresh list
          } catch (err) {
            console.error('deleteBooking error', err);
            Alert.alert('오류', '예약 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };
  

  /* ---------- UI ---------- */
  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>예약 관리</Text>

        {/* date filter row */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowStart(true)}>
            <Text style={styles.dateText}>
              시작일: {dayjs(startDate).format('YYYY. M. D.')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dateButton} onPress={() => setShowEnd(true)}>
            <Text style={styles.dateText}>
              종료일: {dayjs(endDate).format('YYYY. M. D.')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={fetchBookings}>
          <Text style={styles.searchText}>예약 검색</Text>
        </TouchableOpacity>

        {showStart && (
          <DateTimePicker
            value={startDate}
            onChange={(_, d) => { setShowStart(false); d && setStartDate(d); }}
          />
        )}
        {showEnd && (
          <DateTimePicker
            value={endDate}
            onChange={(_, d) => { setShowEnd(false); d && setEndDate(d); }}
          />
        )}

        {/* list */}
        <FlatList
          refreshing={loading}
          onRefresh={fetchBookings}
          data={bookings}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyExtractor={b => b._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name ?? '게스트'}</Text>

              <View style={styles.cardRow}>
                <Text style={styles.cardPrice}>₩{item.totalPrice.toLocaleString()}</Text>
                <StatusPill status={item.status} />
              </View>

               <TouchableOpacity
                onPress={async () => {
                await Clipboard.setStringAsync(item.userAddress ?? '');
                Toast.show({
                  type: 'success',
                  text1: '주소 복사됨',
                  text2: item.userAddress,
                  position: 'bottom',
                });
              }}
            >
               <Text style={[styles.cardSubtitle, { textDecorationLine: 'underline' }]}>
                  주소: {item.userAddress}
                </Text>
              </TouchableOpacity>


              <Text style={styles.cardSubtitle}>
                {dayjs(item.reservationDate).format('YYYY. M. D.')} {item.reservationTime}
              </Text>

              

              <View style={{ position: 'absolute', right: 14, top: 10, flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => setEditing(item)}>
                  <Image
                    source={require('../../assets/icons/edit.png')}
                    style={styles.editIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteBooking(item._id)}>
                  <Image
                    source={require('../../assets/icons/delete-booking.png')}
                    style={[styles.editIcon, { tintColor: '#d32f2f' }]}
                  />
                </TouchableOpacity>
              </View>

            </View>
          )}
        />
      </View>

      <View style={styles.footer}>
  <TouchableOpacity
    style={styles.footerItem}
    onPress={() => navigation.navigate('AdminDashboard')}
  >
    <Image source={require('../../assets/icons/home.png')} style={styles.footerIcon} />
    <Text style={styles.footerText}>홈</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.footerItem}
    onPress={() => navigation.navigate('AdminUsers')}
  >
    <Image source={require('../../assets/icons/user.png')} style={styles.footerIcon} />
    <Text style={styles.footerText}>유저</Text>
  </TouchableOpacity>

  <View style={[styles.footerItem, styles.activeTab]}>
    <Image
      source={require('../../assets/icons/view-order.png')}
      style={[styles.footerIcon, styles.activeIcon]}
    />
    <Text style={[styles.footerText, styles.activeText]}>예약</Text>
  </View>

  <TouchableOpacity
    style={styles.footerItem}
    onPress={() => navigation.navigate('AdminSettings')}
  >
    <Image source={require('../../assets/icons/settings.png')} style={styles.footerIcon} />
    <Text style={styles.footerText}>설정</Text>
  </TouchableOpacity>
</View>

      {/* edit modal */}
      <Modal transparent visible={!!editing} animationType="fade">
        <View style={styles.modalWrap}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>상태 변경</Text>
            {statusOptions.map(st => (
              <TouchableOpacity
                key={st}
                style={[styles.statusBtn, { backgroundColor: `${statusColor[st]}22` }]}
                onPress={() => saveStatus(st)}
              >
                <Text style={[styles.statusBtnTxt, { color: statusColor[st] }]}>{st}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(null)}>
              <Text style={styles.cancelTxt}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 24 },
  title: {
    fontFamily: 'JalnanGothic', fontSize: 28, color: '#010198',
    textAlign: 'center', marginBottom: 18,
  },

  /* filter */
  filterRow: { flexDirection: 'row', gap: 12 },
  dateButton: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  dateText: { fontFamily: 'Pretendard-Regular', fontSize: 14, color: '#333' },
  searchButton: {
    marginTop: 16, backgroundColor: '#007BFF', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    marginBottom: 16,
  },
  searchText: { fontFamily: 'Pretendard-Bold', fontSize: 16, color: '#fff' },

  /* card */
  card: {
    backgroundColor: '#f7fbff', borderRadius: 16, padding: 16,
    marginBottom: 14, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1,
    shadowRadius: 3, elevation: 2,
  },
  cardTitle: { fontFamily: 'Pretendard-Bold', fontSize: 16, color: '#0d47a1', marginBottom: 6 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { fontFamily: 'Pretendard-Bold', fontSize: 15 },
  cardSubtitle: { fontFamily: 'Pretendard-Regular', fontSize: 13, color: '#666' },
  editIcon: { width: 24, height: 24, tintColor: '#007BFF', resizeMode: 'contain', },

  /* status pill */
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  pillText: { fontFamily: 'Pretendard-Bold', fontSize: 12 },

  /* footer */
  footer: {
    flexDirection: 'row', justifyContent: 'space-around',
    width: '100%', borderTopWidth: 1, borderColor: '#dbe9f9',
    backgroundColor: '#ffffff', paddingVertical: 10,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 5,
  },
  footerItem: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16 },
  footerIcon: { width: 24, height: 24, tintColor: '#90a4ae', marginBottom: 4 },
  footerText: { fontSize: 12, fontFamily: 'Pretendard-Regular', color: '#90a4ae' },
  activeTab: { backgroundColor: '#d0eaff' },
  activeIcon: { tintColor: '#007BFF' },
  activeText: { color: '#007BFF', fontFamily: 'Pretendard-Bold' },

  /* modal */
  modalWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0006' },
  modalBox: { width: 260, backgroundColor: '#fff', borderRadius: 14, padding: 20 },
  modalTitle: { fontFamily: 'Pretendard-Bold', fontSize: 18, marginBottom: 12, textAlign: 'center' },
  statusBtn: { paddingVertical: 10, borderRadius: 8, marginBottom: 8, alignItems: 'center' },
  statusBtnTxt: { fontFamily: 'Pretendard-Bold', fontSize: 15 },
  cancelBtn: { alignItems: 'center', marginTop: 4 },
  cancelTxt: { fontFamily: 'Pretendard-Regular', fontSize: 14, color: '#007BFF' },
});