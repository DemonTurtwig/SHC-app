import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import axios from 'axios';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingConfirm from '../screens/BookingConfirm';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BookingMenu from '../screens/BookingMenu';
import BookingExplanation from '../screens/BookingExplanation';
import BookingServiceSelection from '../screens/BookingServiceSelect';
import BookingSubtypeSelection from '../screens/BookingSubtypeSelect';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminUsers from '../screens/admin/AdminUsers';
import AdminBookingList from '../screens/admin/AdminBookingList';
import AdminSettings from '../screens/admin/AdminSettings';
import AddressSearchScreen from '../screens/AddressSearchScreen';
import BookingDetail from '../screens/BookingDetailScreen';

export interface AssetPart {
  partId?: string;
  label?: string;
  url: string;
}

export interface Tier {
  tier: string;
  price: number;
  memo: string;
  assets: {
    blueprint?: string | null;
    parts: {
      partId?: string;
      label?: string;
      url: string;
    }[];
  };
}

/** Extra add-ons a customer can pick */
export interface Choice {
  label: string;
  value: string;
  extraCost: number;
}
export interface Option {
  _id: string;
  key: string; 
  label: string;
  choices: Choice[];
}

export interface ServiceType {
  _id: string;
  name: string;
  label: string;
  tiers: Tier[];
  options: Option[];
}

export interface Subtype {
  _id: string;
  name: string;
  iconUrl?: string;
  category: {_id: string; name: string;} | string;
  serviceOptions: ServiceType[];
}

export interface SelectedOption {
  _id: string;
  key: string;
  label: string;
  selectedLabel: string;
  selectedValue: string;
  extraCost: number;
}

export interface BookingPayload {
  serviceType: ServiceType;
  subtype: Subtype;
  tier: Tier;
  selectedOptions: SelectedOption[];
  symptom?: string;
}

// Explicitly type the RootStackParamList
export type RootStackParamList = {
  Login: undefined;
  Register: { isGuest?: boolean } | undefined;
  Home: { isGuest?: boolean } | undefined;
  Confirm: {serviceType: ServiceType; subtype: Subtype, tier: Tier; selectedOptions: SelectedOption[];};
  History: undefined;
  Settings: undefined;
  BookingMenu: { isGuest?: boolean };
  BookingExplanation: { subtype: Subtype; serviceType: ServiceType };
  BookingServiceSelection: { category: string } | undefined;
  BookingSubtypeSelection: { category?: string; selectedServiceType: string};
  AddressSearchScreen: { onSelect: (addr: string) => void } | undefined;
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminBookings: undefined;
  AdminSettings: undefined;
  BookingDetail: { bookingId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const { token, isLoading, isGuestMode } = useAuth();
  const [user, setUser] = useState<{ isAdmin: boolean; isGuest: boolean } | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('https://smart-homecare-backend.onrender.com/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
      } catch (err) {
        console.log('Error fetching user:', err);
      } finally {
        setUserLoading(false);
      }
    };

    if (token) {
      fetchUser();
    } else {
      setUserLoading(false);
    }
  }, [token]);

  if (isLoading || userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  let screens: React.ReactElement[] = [];

  if (token && user?.isAdmin) {
    screens = [
      <Stack.Screen key="AdminDashboard" name="AdminDashboard" component={AdminDashboard} />,
      <Stack.Screen key="AdminUsers" name="AdminUsers" component={AdminUsers} />,
      <Stack.Screen key="AdminBookings" name="AdminBookings" component={AdminBookingList} />,
      <Stack.Screen key="AdminSettings" name="AdminSettings" component={AdminSettings} />,
      <Stack.Screen key="AddressSearchScreen" name="AddressSearchScreen" component={AddressSearchScreen} />,
      <Stack.Screen key="BookingDetail" name="BookingDetail" component={BookingDetail} />
    ];
  } else {
    screens = [
      <Stack.Screen key="Login" name="Login" component={LoginScreen} />,
      <Stack.Screen key="Register" name="Register" component={RegisterScreen} />,
      <Stack.Screen key="Home" name="Home" component={HomeScreen} />,
      <Stack.Screen key="Confirm" name="Confirm" component={BookingConfirm} />,
      <Stack.Screen key="History" name="History" component={HistoryScreen} />,
      <Stack.Screen key="Settings" name="Settings" component={SettingsScreen} />,
      <Stack.Screen key="BookingMenu" name="BookingMenu" component={BookingMenu} />,
      <Stack.Screen key="BookingExplanation" name="BookingExplanation" component={BookingExplanation} />,
      <Stack.Screen key="BookingServiceSelection" name="BookingServiceSelection" component={BookingServiceSelection} />,
      <Stack.Screen key="BookingSubtypeSelection" name="BookingSubtypeSelection" component={BookingSubtypeSelection} />,
      <Stack.Screen key="AddressSearchScreen" name="AddressSearchScreen" component={AddressSearchScreen} />,
      <Stack.Screen key="BookingDetail" name="BookingDetail" component={BookingDetail} />
    ];
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        id={undefined}
        screenOptions={{ headerShown: false }}
      >
        {screens}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default AppNavigator;
