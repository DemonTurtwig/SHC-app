import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator'; 

/* ---------- navigation / route types ---------- */
type HomeNav = NativeStackNavigationProp<RootStackParamList>;
type HomeRoute = RouteProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const route = useRoute<HomeRoute>();

  const isGuest = route.params?.isGuest ?? false;

  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <View style={styles.container}>
        {/* header */}
        <View style={styles.header}>
          <Image source={require('../assets/icons/intro-logo.png')} style={styles.logo} />
          <Text style={styles.brandText}>SMART HOMECARE</Text>
        </View>

        {/* cards */}
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => Linking.openURL('https://smarthomecare.kr')}
          >
            <Image source={require('../assets/icons/website.png')} style={styles.cardIcon} />
            <Text style={styles.cardText}>스마트홈케어 둘러보기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('BookingMenu', { isGuest })}
          >
            <Image source={require('../assets/icons/make-reservation.png')} style={styles.cardIcon} />
            <Text style={styles.cardText}>스마트홈케어 예약하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('History')}
        >
          <Image source={require('../assets/icons/history.png')} style={styles.footerIcon} />
          <Text style={styles.footerText}>예약내역</Text>
        </TouchableOpacity>

        <View style={[styles.footerItem, styles.activeTab]}>
          <Image
            source={require('../assets/icons/home.png')}
            style={[styles.footerIcon, styles.activeIcon]}
          />
          <Text style={[styles.footerText, styles.activeText]}>홈</Text>
        </View>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Image source={require('../assets/icons/user.png')} style={styles.footerIcon} />
          <Text style={styles.footerText}>유저 설정</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  brandText: {
    fontFamily: 'JalnanGothic',
    fontSize: 44,
    color: '#010198',
    marginTop: 30,
    textAlign: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 40,
  },
  card: {
    backgroundColor: '#3a8df7',
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: 'center',
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardIcon: {
    width: 72,
    height: 72,
    marginBottom: 14,
    tintColor: '#ffffff',
  },
  cardText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 22,
    color: '#ffffff',
    textAlign: 'center',
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
