import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';


const AdminDashboard = () => {

  const navigation = useNavigation<any>();
  
  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Image source={require('../../assets/icons/intro-logo.png')} style={styles.logo} />
            <Text style={styles.brandText}>SMART HOMECARE</Text>
          </View>

          <View style={styles.cardRow}>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdminUsers')}>
              <Image source={require('../../assets/icons/user.png')} style={styles.cardIcon} />
              <Text style={styles.cardText}>유저 관리</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdminBookings')}>
              <Image source={require('../../assets/icons/view-order.png')} style={styles.cardIcon} />
              <Text style={styles.cardText}>예약 내역</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardRow}>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AdminSettings')}>
              <Image source={require('../../assets/icons/settings.png')} style={styles.cardIcon} />
              <Text style={styles.cardText}>관리자 설정</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerItem, styles.activeTab]}
          onPress={() => navigation.navigate('AdminDashboard')}
        >
          <Image source={require('../../assets/icons/home.png')} style={[styles.footerIcon, styles.activeIcon]} />
          <Text style={[styles.footerText, styles.activeText]}>홈</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate('AdminUsers')}
        >
          <Image source={require('../../assets/icons/user.png')} style={styles.footerIcon} />
          <Text style={styles.footerText}>유저</Text>
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
};

export default AdminDashboard;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  container: {
    width: '100%',
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
  cardRow: {
    flexDirection: 'row',
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