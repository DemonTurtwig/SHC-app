import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  BackHandler,
  Alert,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

import { RootStackParamList, ServiceType } from '../navigation/AppNavigator';

/* ---------- minimal local interfaces ---------- */
interface ServiceOption {
  name: string;
}
interface Subtype {
  _id: string;
  name: string;
  category: { name: string };
  serviceOptions: ServiceOption[];
}

/* ---------- nav / route generics ---------- */
type SubtypeRoute = RouteProp<RootStackParamList, 'BookingSubtypeSelection'>;
type SubtypeNav   = NativeStackNavigationProp<RootStackParamList>;

const subtypeIcons: Record<string, any> = {
  벽걸이형: require('../assets/icons/byukgulyee-icon.png'),
  천장형4way: require('../assets/icons/chungang4way-icon.png'),
  천장형2way: require('../assets/icons/chungang2way-icon.png'),
  천장형1way: require('../assets/icons/chungang1way-icon.png'),
  천장형원형: require('../assets/icons/chunjangonehyung-icon.png'),
  실외기: require('../assets/icons/shiwaegi-icon.png'),
  스탠드형: require('../assets/icons/standairconditioner-icon.png'),
  '2in1형': require('../assets/icons/2in1-icon.png'),
};

export default function BookingSubtypeSelect() {
  const navigation = useNavigation<SubtypeNav>();
  const route      = useRoute<SubtypeRoute>();

  /* param guaranteed by RootStackParamList */
  const { selectedServiceType } = route.params;

  const [subtypes, setSubtypes] = useState<Subtype[]>([]);
  const [loading,  setLoading]  = useState(true);

  /* fetch list once */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get('https://smart-homecare-backend.onrender.com/api/booking/initialize');
        if (!Array.isArray(data.subtypes)) throw new Error('subtypes is not array');
        const filtered = data.subtypes.filter(
          (s: Subtype) => s.category.name === 'aircon',
        );
        setSubtypes(filtered);
      } catch (err) {
        console.error('Failed to load subtypes:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* hardware-back block */
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  /* handlers */
  const handleBack = () =>
    navigation.reset({ index: 0, routes: [{ name: 'BookingServiceSelection' }] });

  const handleSelect = (sub: Subtype) => {
    
    const svc = sub.serviceOptions.find(s => s.name === selectedServiceType);
    if (!svc) {
      Alert.alert('오류', `${selectedServiceType} 서비스는 이 기기에서 지원되지 않습니다.`);
      return;
    }
      const svcFull = {
    _id: 'temp',
    label: svc.name,
    tiers: [],
    options: [],
    } as ServiceType;
    navigation.navigate('BookingExplanation', {
      subtype: sub,
      serviceType: svcFull,
    });
  };

  /* ---------- UI ---------- */
  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image
            source={require('../assets/icons/back-button.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.title}>에어컨 종류 선택</Text>
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color="#010198" />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContainer}
          >
            {subtypes.length === 0 ? (
              <Text style={styles.noDataText}>등록된 에어컨 종류가 없습니다.</Text>
            ) : (
              subtypes.map(sub => (
                <TouchableOpacity
                  key={sub._id}
                  style={styles.card}
                  onPress={() => handleSelect(sub)}
                >
                  <Image
                    source={
                      subtypeIcons[sub.name] ??
                      require('../assets/icons/byukgulyee-icon.png')
                    }
                    style={styles.cardIcon}
                  />
                  <Text style={styles.cardText}>{sub.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  title: {
    fontFamily: 'JalnanGothic',
    fontSize: 28,
    color: '#010198',
    paddingTop: 45,
  },
  body: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#3a8df7',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
    width: 250,
    marginBottom: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardIcon: {
    width: 168,
    height: 168,
    marginBottom: 14,
    tintColor: "#ffffff",
    resizeMode: 'contain',
  },
  cardText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 32,
    color: '#ffffff',
    textAlign: 'center',
  },
  horizontalContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  noDataText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 14,
    color: '#555',
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 60,
    padding: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#010198',
  },
});
