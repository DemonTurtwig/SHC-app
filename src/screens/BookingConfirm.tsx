import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

/* ---------- local types ---------- */
interface SelectedOption {
  _id: string;
  key: string;
  label: string;
  selectedLabel: string;
  selectedValue: string;
  extraCost: number;
  extraTime: number;
}
interface Tier {
  tier: string;
  price: number;
}

type ConfirmRoute = RouteProp<RootStackParamList, 'Confirm'>;
type ConfirmNav = NativeStackNavigationProp<RootStackParamList>;

interface Slot {
  time: string;
  available: boolean;
}

export default function BookingConfirm() {
  const { token, currentUser, isGuestMode } = useAuth();

  const navigation = useNavigation<ConfirmNav>();
  const route = useRoute<ConfirmRoute>();

  /* ----- params from previous screen ----- */
  const {
    subtype,
    serviceType,
    tier,
    selectedOptions,
  }: {
    subtype: { _id: string; name: string };
    serviceType: { _id: string; label: string };
    tier: Tier;
    selectedOptions: SelectedOption[];
  } = route.params;

  /* ----- local state ----- */
  const [reservationDate, setReservationDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  /* ---------- helpers ---------- */
  const fetchSlots = async (day: Date) => {
    const yyyyMMdd = day.toISOString().slice(0, 10);
    try {
      const { data } = await axios.get<Slot[]>(
        'https://smart-homecare-backend.onrender.com/api/timeslots',
        { params: { date: yyyyMMdd } },
      );
      setSlots(data);
      setSelectedSlot(null); // reset any previous selection
    } catch {
      Alert.alert('시간 정보를 불러오지 못했습니다.');
    }
  };

  const isPast = (slot: string) => {
    const now = new Date();
    if (now.toDateString() !== reservationDate.toDateString()) return false;
    const [h, m] = slot.split(':').map(Number);
    return h < now.getHours() || (h === now.getHours() && m <= now.getMinutes());
  };

  /* ----- fetch slots when date changes ----- */
  useEffect(() => {
    fetchSlots(reservationDate);
  }, [reservationDate]);

  /* ----- price calc ----- */
  const totalExtraCost = selectedOptions.reduce(
    (sum, opt) => sum + (opt.extraCost || 0),
    0,
  );
  const totalPrice = tier.price + totalExtraCost;

  /* ----- submit booking ----- */
  const handleSubmit = async () => {
    if (!selectedSlot) {
      Alert.alert('오류', '예약 시간을 선택해주세요.');
      return;
    }

    const payload = {
      subtypeId: subtype._id,
      serviceTypeId: serviceType._id,
      tier: tier.tier,
      options: selectedOptions.map(o => ({
        option: o._id,
        choice: o.selectedValue,
      })),
      reservationDate: reservationDate.toISOString().split('T')[0],
      reservationTime: selectedSlot,
      totalPrice,
      ...(currentUser?._id ? { user: currentUser._id } : {}),
    };

    try {
      if (isGuestMode && currentUser?.isGuest) {
        await axios.post(
          'https://smart-homecare-backend.onrender.com/api/guests/booking',
          {
            name: currentUser.name,
            phone: currentUser.phone,
            address: currentUser.address,
            ...payload,
          },
        );
      } else {
        await axios.post(
          'https://smart-homecare-backend.onrender.com/api/booking',
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
      Alert.alert('예약 완료', '서비스가 성공적으로 예약되었습니다.');
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      console.error('Booking failed:', err);
      Alert.alert('오류', '예약에 실패했습니다.');
      // ⬇︎ refresh slots to reflect the actual taken state
      fetchSlots(reservationDate);
    }
  };

  /* ---------- UI ---------- */
  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* … (unchanged header + summary code) … */}

        {/* --- Date picker --- */}
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
          <Text style={styles.dateButtonText}>
            예약 날짜: {reservationDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={reservationDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, d) => {
              setShowPicker(false);
              if (d) setReservationDate(d);
            }}
          />
        )}

        {/* --- Time slots --- */}
        <View style={styles.timeSlotContainer}>
          <Text style={styles.sectionTitle}>예약 시간 선택</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeSlotList}
          >
            {slots.map(({ time, available }) => {
              const disabled = isPast(time) || !available;
              const isSelected = selectedSlot === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlotButton,
                    isSelected && styles.timeSlotButtonSelected,
                    disabled && styles.timeSlotButtonDisabled,
                  ]}
                  onPress={() => !disabled && setSelectedSlot(time)}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      isSelected && styles.timeSlotTextSelected,
                      disabled && styles.timeSlotTextDisabled,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* --- Submit --- */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>예약 확정</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'JalnanGothic',
    fontSize: 28,
    color: '#010198',
    textAlign: 'center',
    marginBottom: 24,
  },
  receiptBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 15,
    marginBottom: 6,
    color: '#333',
  },
  label: {
    fontFamily: 'Pretendard-Bold',
    color: '#555',
  },
  sectionTitle: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 16,
    marginBottom: 12,
    color: '#010198',
  },
  optionRow: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  totalBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  totalLabel: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 18,
    color: '#d32f2f',
  },
  totalValue: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 18,
    color: '#d32f2f',
  },
  dateButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  dateButtonText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 15,
    color: '#010198',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  submitText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 16,
    color: '#fff',
  },
  timeSlotContainer: {
    marginVertical: 20,
  },
  timeSlotList: {
    flexDirection: 'row',
    gap: 12,
  },
  timeSlotButton: {
    backgroundColor: '#ffffffaa',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderColor: '#ccc',
    borderWidth: 1,
    marginHorizontal: 5,
  },
  timeSlotButtonSelected: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  timeSlotButtonDisabled: {
    backgroundColor: '#ddd',
    borderColor: '#bbb',
  },
  timeSlotText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 14,
    color: '#333',
  },
  timeSlotTextSelected: {
    color: '#ffffff',
    fontFamily: 'Pretendard-Bold',
  },
  timeSlotTextDisabled: {
    color: '#888',
    fontFamily: 'Pretendard-Regular',
  },
});
