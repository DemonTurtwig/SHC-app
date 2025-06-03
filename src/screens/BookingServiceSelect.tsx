import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, BackHandler, ScrollView,
} from 'react-native';
import {
  useNavigation, useRoute, useFocusEffect,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList } from '../navigation/AppNavigator';

/* ---------- small helper types ---------- */
interface ServiceType { _id: string; name: string; label: string }
type SelRoute = RouteProp<RootStackParamList, 'BookingServiceSelection'>;
type SelNav   = NativeStackNavigationProp<RootStackParamList>;

/* ---------- local assets ---------- */
const serviceTypeIcons: Record<string, any> = {
  clean:   require('../assets/icons/aircon-cleaning.png'),
  wash:    require('../assets/icons/aircon-washing.png'),
  install: require('../assets/icons/aircon-installation.png'),
  fix:     require('../assets/icons/aircon-repair.png'),
  sell:    require('../assets/icons/aircon-sell.png'),
};

export default function BookingServiceSelect() {
  const navigation = useNavigation<SelNav>();
  const route      = useRoute<SelRoute>();

  /* param exists but isn’t used in this screen */
  const { category } = route.params ?? {};

  const [services, setServices] = useState<ServiceType[]>([]);

  /* fetch list once */
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('https://smart-homecare-backend.onrender.com/api/servicetypes');
        const data = await res.json();
        setServices(data);
      } catch (err) {
        console.error('❌ Failed to load service types:', err);
      }
    })();
  }, []);

  /* nav helpers */
  const handleBack   = () => navigation.reset({ index: 0, routes: [{ name: 'BookingMenu' }] });
  const handleSelect = (svc: ServiceType) =>
    navigation.navigate('BookingSubtypeSelection', { selectedServiceType: svc.name });

  /* block hardware back */
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  /* ---------- UI (unchanged) ---------- */
  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image source={require('../assets/icons/back-button.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.title}>서비스 유형 선택</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.subTitle}>필요한 스마트홈케어 서비스를 선택하세요</Text>

        {services.length === 0 ? (
          <ActivityIndicator size="large" color="#010198" />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalContainer}
          >
            {services.map(svc => {
              const isDisabled = svc.name === 'sell';
              return (
                <TouchableOpacity
                  key={svc._id}
                  style={[
                    styles.card,
                    isDisabled && { backgroundColor: '#ccc', opacity: 0.7 },
                  ]}
                  onPress={() => !isDisabled && handleSelect(svc)}
                  disabled={isDisabled}
                >
                  <Image
                    source={serviceTypeIcons[svc.name] || serviceTypeIcons.clean}
                    style={[
                      styles.cardIcon,
                      isDisabled && { tintColor: '#666' },
                    ]}
                  />
                  <Text style={[
                    styles.cardText,
                    isDisabled && { color: '#666' },
                  ]}>
                    {svc.label + (isDisabled ? ' (준비중)' : '')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  header: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
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
  subTitle: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  
  horizontalContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
    tintColor: '#fff',
  },
  cardText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 36,
    color: '#ffffff',
    textAlign: 'center',
  },
});
