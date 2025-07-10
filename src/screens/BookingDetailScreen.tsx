// screens/BookingDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type DetailRoute = RouteProp<RootStackParamList, 'BookingDetail'>;
type Nav         = NativeStackNavigationProp<RootStackParamList>;

interface RawOption {
  option         : string;
  optionLabel?   : string;
  choice         : string;
  choiceLabel?   : string;
  selectedLabel? : string;
  extraCost?     : number;
}

interface NormalisedOption {
  key       : string;
  optionKey : string;
  optionLabel: string;
  choiceLabel: string;
  extraCost : number;
}

interface BookingDetail {
  _id            : string;
  subtype        : string;
  serviceLabel   : string;
  tier?          : string;
  totalPrice     : number;
  status         : '대기' | '확정' | '완료' | '취소';
  memo?          : string;
  symptom?       : string;
  options        : RawOption[];
  reservationDate: string;
  reservationTime: string;
  name?          : string;
}

const LABEL_MAP: Record<string, string> = {
  yes: '예', no: '아니오',
  paid: '본인부담', free: '무료',
  'above-3m': '3m 이상', 'below-3m': '3m 이하',
  none: '없음',
  gallery: '무풍갤러리', 'three-nozzle': '무풍3구',
  tower: '타워형', 'lg-dual': '엘지듀얼',
  wave: '웨이브', 'robot-model': '로봇모델',
  champion: '챔피언', 'aero-18': '에어로 18단',
  samsung: '삼성', lg: 'LG', winia: '위니아', others: '기타',
  model360: '360모델',
  alp1mnowall: '네', alp1mwallwallcopperpipe1m: '네', nowallcopperpipe1m: '네',
  byukgulyee: '벽걸이형', notbyukgulyee: '비벽걸이형',
};

const STATUS_COLOR: Record<BookingDetail['status'], string> = {
  대기: '#ff9800', 확정: '#2196f3', 완료: '#4caf50', 취소: '#d32f2f',
};

export default function BookingDetailScreen() {
  const { token, currentUser } = useAuth();
  const navigation   = useNavigation<Nav>();
  const { bookingId }= useRoute<DetailRoute>().params;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [options, setOptions] = useState<NormalisedOption[]>([]);
  const [loading , setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const endpoint = currentUser?.isAdmin
          ? `https://smart-homecare-backend.onrender.com/api/admin/bookings/${bookingId}`
          : `https://smart-homecare-backend.onrender.com/api/historydetail/${bookingId}`;

        const { data } = await axios.get<BookingDetail>(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const normalised: NormalisedOption[] = (data.options ?? []).map((o, idx) => {
          const humanChoice =
            o.choiceLabel ??
            o.selectedLabel ??
            LABEL_MAP[o.choice?.toLowerCase?.() ?? ''] ??
            o.choice;

          const humanOption =
            o.optionLabel ??
            // fall back to the raw option id if label missing
            o.option;

          return {
            key        : `${o.option}-${idx}`,
            optionKey  : o.option,
            optionLabel: humanOption,
            choiceLabel: humanChoice,
            extraCost  : o.extraCost ?? 0,
          };
        });

        setBooking(data);
        setOptions(normalised);
      } catch (e) {
        console.error(e);
        Alert.alert('오류', '예약 정보를 불러오지 못했습니다.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  if (loading) {
    return (
      <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
        <ActivityIndicator size="large" color="#010198" style={{ flex: 1 }} />
      </LinearGradient>
    );
  }

  if (!booking) {
    return (
      <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
        <Text style={styles.empty}>예약 정보를 찾을 수 없습니다.</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>📄 예약 상세 정보</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Image source={require('../assets/icons/back-button.png')} style={styles.backIcon} />
          </TouchableOpacity>
        <Card>
          <Info label="기기"   value={booking.subtype}       large />
          <Info label="서비스" value={booking.serviceLabel}  large />
        {booking.tier  && (
          <Info label="티어"  value={booking.tier.toUpperCase()} large />
        )}
        {booking.name && (
          <Info label="예약자" value={booking.name}         large />
        )}
        </Card>

        <Card>
      <Info
        label="가격"
        value={
          booking.totalPrice === -1
            ? '가격문의'
            : `₩${booking.totalPrice.toLocaleString('ko-KR')}`
        }
        large
        bold
      />
      <Info
        label="상태"
        value={booking.status}
        large
        bold
        valueStyle={{ color: STATUS_COLOR[booking.status] }}
      />
    </Card>

        {options.length > 0 && (
          <Card>
            <Text style={styles.section}>선택한 옵션</Text>
            {options.map(o => (
              <Text key={o.key} style={styles.value}>
                • <Text style={styles.optKey}>{o.optionLabel}</Text>: {o.choiceLabel}
                {!!o.extraCost && <> (+₩{o.extraCost.toLocaleString('ko-KR')})</>}
              </Text>
            ))}
          </Card>
        )}

        {booking.symptom?.trim() && (
          <Card>
            <Text style={styles.section}>신고된 증상</Text>
            <Text style={styles.value}>{booking.symptom}</Text>
          </Card>
        )}

        <Card>
          <Text style={styles.section}>예약 일시</Text>
          <Text style={styles.value}>
            {dayjs(booking.reservationDate).format('YYYY. M. D.')} {booking.reservationTime}
          </Text>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
}

const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.card}>{children}</View>
);

const Info = ({
  label,
  value,
  large = false,
  bold  = false,
  valueStyle = {},
}: {
  label: string;
  value: string;
  large?: boolean;
  bold?: boolean;
  valueStyle?: any;
}) => (
  <>
    <Text style={[styles.label,   large && styles.largeLabel]}>{label}</Text>
    <Text
      style={[
        styles.value,
        large && styles.largeValue,
        bold  && styles.boldValue,
        valueStyle,
      ]}
    >
      {value}
    </Text>
  </>
);


const styles = StyleSheet.create({
  wrapper : { flex: 1 },
  container: { paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24 },
  title   : { fontFamily: 'JalnanGothic', fontSize: 28, color: '#010198',
              textAlign: 'center', marginBottom: 24 },

  card    : { backgroundColor: '#fff', borderRadius: 14, padding: 18,
              marginBottom: 20, shadowColor: '#000', shadowOpacity: .05,
              shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },

  label   : { fontFamily: 'Pretendard-Bold', fontSize: 14, color: '#333', marginBottom: 4 },
  value   : { fontFamily: 'Pretendard-Regular', fontSize: 15, color: '#000', marginBottom: 10 },
  section : { fontFamily: 'Pretendard-Bold', fontSize: 16, color: '#010198', marginBottom: 10 },
  optKey  : { fontFamily: 'Pretendard-Bold', color: '#000' },

  backBtn : { position: 'absolute', top: 52, left: 16, zIndex: 20, padding: 8 },
  backIcon: { width: 24, height: 24, tintColor: '#010198' },

  empty   : { flex: 1, textAlign: 'center', marginTop: 50,
              fontFamily: 'Pretendard-Regular', color: '#555' },
  largeLabel : { fontSize: 18 },
  largeValue : { fontSize: 18 },
  boldValue  : { fontFamily: 'Pretendard-Bold' },
            
});
