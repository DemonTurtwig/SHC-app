import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-root-toast';
import dayjs from 'dayjs';

interface Booking {
  _id: string;
  serviceLabel: string;
  reservationDate: string;
  reservationTime: string;
  totalPrice: number;
  status: '대기' | '확정' | '완료' | '취소';
}

const statusColor: Record<Booking['status'], string> = {
  대기: '#ff9800',
  확정: '#2196f3',
  완료: '#4caf50',
  취소: '#d32f2f',
};

const StatusPill = ({ status }: { status: Booking['status'] }) => {
  const color = statusColor[status] ?? '#2196f3';
  return (
    <View style={[styles.pill, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.pillText, { color }]}>{status}</Text>
    </View>
  );
};

const BookingCard = ({ item }: { item: Booking }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{item.serviceLabel}</Text>
    <View style={styles.cardRow}>
      <Text style={styles.cardPrice}>₩{item.totalPrice.toLocaleString()}</Text>
      <StatusPill status={item.status} />
    </View>
    <View style={styles.cardRow}>
      <Text style={styles.cardSubtitle}>
        {dayjs(item.reservationDate).format('YYYY. M. D.')}{' '}
        {item.reservationTime}
      </Text>
    </View>
  </View>
);

const HistoryScreen = () => {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').toDate());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const fetchInitialBookings = async () => {
    try {
      const res = await axios.get(
        'https://smart-homecare-backend.onrender.com/api/history',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setBookings(res.data);
      setInitialLoaded(true);
    } catch (err) {
      console.error(err);
      Toast.show('예약 내역을 가져오지 못했습니다.', { duration: 1500 });
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get(
        'https://smart-homecare-backend.onrender.com/api/history',
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            startDate: dayjs(startDate).format('YYYY-MM-DD'),
            endDate: dayjs(endDate).format('YYYY-MM-DD'),
          },
        }
      );
      setBookings(res.data);
    } catch (err) {
      console.error(err);
      Toast.show('예약 내역을 가져오지 못했습니다.', { duration: 1500 });
    }
  };

  useEffect(() => {
    if (token) fetchInitialBookings();
  }, [token]);

  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>예약 내역 확인</Text>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStart(true)}
          >
            <Text style={styles.dateText}>
              시작일: {dayjs(startDate).format('YYYY. M. D.')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEnd(true)}
          >
            <Text style={styles.dateText}>
              종료일: {dayjs(endDate).format('YYYY. M. D.')}
            </Text>
          </TouchableOpacity>
        </View>

        {showStart && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowStart(false);
              if (date) setStartDate(date);
            }}
          />
        )}

        {showEnd && (
          <DateTimePicker
            value={endDate}
            mode="date"
            minimumDate={startDate}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowEnd(false);
              if (date) {
                if (date < startDate) {
                  setEndDate(startDate);
                  Toast.show(
                    '종료일이 시작일보다 빨라서 자동 수정했습니다.',
                    { duration: 1500 }
                  );
                } else {
                  setEndDate(date);
                }
              }
            }}
          />
        )}

        <TouchableOpacity style={styles.searchButton} onPress={fetchBookings}>
          <Text style={styles.searchText}>예약 검색</Text>
        </TouchableOpacity>

        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            !initialLoaded ? (
              <ActivityIndicator style={{ marginTop: 40 }} />
            ) : (
              <Text style={styles.emptyText}>예약 내역이 없습니다.</Text>
            )
          }
          renderItem={({ item }) => <BookingCard item={item} />}
          style={{ marginTop: 20 }}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>

      {/* bottom nav (unchanged) */}
      <View style={styles.footer}>
        <View style={[styles.footerItem, styles.activeTab]}>
          <Image
            source={require('../assets/icons/history.png')}
            style={[styles.footerIcon, styles.activeIcon]}
          />
          <Text style={[styles.footerText, styles.activeText]}>예약내역</Text>
        </View>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Image
            source={require('../assets/icons/home.png')}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('Settings' as never)}
        >
          <Image
            source={require('../assets/icons/user.png')}
            style={styles.footerIcon}
          />
          <Text style={styles.footerText}>유저 설정</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default HistoryScreen;


/* ---------- styles ---------- */
const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 24 },
  title: {
    fontFamily: 'JalnanGothic',
    fontSize: 28,
    color: '#010198',
    textAlign: 'center',
    marginBottom: 24,
  },
  filterRow: { flexDirection: 'row', gap: 12 },
  dateButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  dateText: { fontFamily: 'Pretendard-Regular', fontSize: 14, color: '#333' },
  searchButton: {
    backgroundColor: '#007BFF',
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  searchText: { fontFamily: 'Pretendard-Bold', color: '#fff', fontSize: 16 },

  /* card */
  card: {
    backgroundColor: '#f7fbff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 16,
    marginBottom: 6,
    color: '#0d47a1',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardPrice: { fontFamily: 'Pretendard-Bold', fontSize: 15, color: '#333' },
  cardSubtitle: { fontFamily: 'Pretendard-Regular', color: '#666' },

  /* status pill */
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  pillText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },

  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    fontFamily: 'Pretendard-Regular',
    color: '#555',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  footerItem: { alignItems: 'center', padding: 8, borderRadius: 16 },
  footerIcon: { width: 24, height: 24, tintColor: '#90a4ae', marginBottom: 4 },
  footerText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#90a4ae',
  },
  activeTab: { backgroundColor: '#d0eaff' },
  activeIcon: { tintColor: '#007BFF' },
  activeText: { color: '#007BFF', fontFamily: 'Pretendard-Bold' },
});