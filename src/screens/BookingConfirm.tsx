// src/screens/BookingConfirm.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Platform, Alert, ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useRoute, useNavigation, RouteProp,
} from '@react-navigation/native';
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
interface Tier { tier: string; price: number; }

type ConfirmRoute = RouteProp<RootStackParamList, 'Confirm'>;
type ConfirmNav   = NativeStackNavigationProp<RootStackParamList>;

export default function BookingConfirm() {
  const { token, currentUser, isGuestMode } = useAuth();

  const navigation = useNavigation<ConfirmNav>();
  const route      = useRoute<ConfirmRoute>();

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
  const [showPicker,      setShowPicker]      = useState(false);
  const [timeSlots,       setTimeSlots]       = useState<string[]>([]);
  const [selectedSlot,    setSelectedSlot]    = useState<string | null>(null);

  /* ----- fetch available times ----- */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get<string[]>(
          'https://smart-homecare-backend.onrender.com/api/timeslots',
        );
        setTimeSlots(data);
      } catch (err) {
        console.error('❌ Failed to load time slots:', err);
      }
    })();
  }, []);

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
            serviceTypeId: serviceType._id,
            subtypeId: subtype._id,
            tier: tier.tier,
            reservationDate: reservationDate.toISOString().split('T')[0],
            reservationTime: selectedSlot,
            options: selectedOptions.map(o => ({
              option: o._id,
              choice: o.selectedValue,
            })),
            totalPrice,
          }
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
    }
  };

  /* ---------- UI ---------- */
  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>예약 확인</Text>

        {/*--- Service summary ---*/}
        <View style={styles.receiptBox}>
          <Text style={styles.summaryRow}><Text style={styles.label}>기기:</Text> {subtype.name}</Text>
          <Text style={styles.summaryRow}><Text style={styles.label}>서비스:</Text> {serviceType.label}</Text>
          <Text style={styles.summaryRow}><Text style={styles.label}>티어:</Text> {tier.tier.toUpperCase()}</Text>
          <Text style={styles.summaryRow}><Text style={styles.label}>기본 가격:</Text> ₩{tier.price.toLocaleString()}</Text>
        </View>

        {/*--- Options ---*/}
        {selectedOptions.length > 0 && (
          <View style={styles.receiptBox}>
            <Text style={styles.sectionTitle}>선택한 옵션</Text>
            {selectedOptions.map(opt => (
              <Text key={opt.key} style={styles.optionRow}>
                {opt.label} ({opt.selectedLabel}): + ₩{opt.extraCost}
              </Text>
            ))}
          </View>
        )}

        {/*--- Total ---*/}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>총 가격</Text>
          <Text style={styles.totalValue}>₩ {totalPrice.toLocaleString()}</Text>
        </View>

        {/*--- Date picker ---*/}
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.dateButtonText}>
            예약 날짜: {reservationDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={reservationDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowPicker(false);
              if (date) setReservationDate(date);
            }}
          />
        )}

        {/*--- Time slots ---*/}
        <View style={styles.timeSlotContainer}>
          <Text style={styles.sectionTitle}>예약 시간 선택</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeSlotList}
          >
            {timeSlots.map(time => {
              const now = new Date();
              const isToday = now.toDateString() === reservationDate.toDateString();
              const [hour, minute] = time.split(':').map(Number);
              const isPast =
                isToday &&
                (hour < now.getHours() ||
                  (hour === now.getHours() && minute <= now.getMinutes()));
              const isSelected = selectedSlot === time;

              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlotButton,
                    isSelected && styles.timeSlotButtonSelected,
                    isPast && styles.timeSlotButtonDisabled,
                  ]}
                  onPress={() => !isPast && setSelectedSlot(time)}
                  disabled={isPast}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      isSelected && styles.timeSlotTextSelected,
                      isPast && styles.timeSlotTextDisabled,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/*--- Submit ---*/}
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
