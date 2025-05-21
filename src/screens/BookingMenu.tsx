import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const BookingMenu = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // Disable hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleBack = () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  const handleSelectAircon = () => navigation.navigate('BookingServiceSelection', { category: 'aircon' });

  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image source={require('../assets/icons/back-button.png')} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.title}>스마트홈케어 예약</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.subTitle}>어떤 가전을 예약하시겠습니까?</Text>

        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={handleSelectAircon}>
            <Image source={require('../assets/icons/aircon.png')} style={styles.cardIcon} />
            <Text style={styles.cardText}>에어컨</Text>
          </TouchableOpacity>

          <View style={[styles.card, styles.disabledCard]}>
            <Image source={require('../assets/icons/coming-soon.png')} style={styles.cardIcon} />
            <Text style={styles.cardText}>곧 추가 예정</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

export default BookingMenu;

//TODO: apply API for data later

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  header: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 60,
    padding: 8,
  },
  backIcon: { width: 24, height: 24, tintColor: '#010198' },
  title: {
    fontFamily: 'JalnanGothic',
    fontSize: 28,
    color: '#010198',
    textAlign: 'center',
    marginTop: 50,
  },
  body: {
    flex: 1,
    paddingTop: 10,
    alignItems: 'center',
  },
  subTitle: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    gap: 12,
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
  disabledCard: { backgroundColor: '#aabecf' },
  cardIcon: { width: 64, height: 64, marginBottom: 14, tintColor: '#fff' },
  cardText: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
});
