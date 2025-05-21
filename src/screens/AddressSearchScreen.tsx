import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import debounce from 'lodash.debounce';
import axios from 'axios';
import { searchAddress } from '../services/addressService';

const backIcon = require('../assets/icons/back-button.png');

export default function AddressSearchScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<any>();
  const onSelect = params?.onSelect as (addr: string) => void;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState('');
  const [selectedAddr, setSelectedAddr] = useState('');

  /** ─── debounced primary search (keep all hits so roads show) ─── */
  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) return;
      setLoading(true);
      try {
        const list = await searchAddress(q);
        setResults(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300),
    [],
  );

  const onSearch = () => doSearch(query);

  const buildAddr = (item: any) =>
    item.road_address?.address_name ?? item.address_name;

  /** ─── road‑only → fetch numbered variants ─── */
  const fetchExpandedAddresses = async (base: string) => {
    try {
      setLoading(true);
      setResults([]);
      setSelectedAddr('');
      const res = await axios.get('/api/kakao/expand-address', {
        baseURL: 'https://smart-homecare-backend.onrender.com',
        params: { query: base.trim() },
      });
      setResults(res.data);
    } catch (err) {
      console.error('확장 주소 불러오기 실패', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePressAddr = (item: any) => {
    const addr = buildAddr(item);
    if (!addr) return;
    if (!/\d/.test(addr)) {
      fetchExpandedAddresses(addr); // road only → expand
      return;
    }
    setSelectedAddr(addr); // full address selected
  };

  const confirm = () => {
    if (!selectedAddr) return Alert.alert('주소를 먼저 선택해 주세요');
    onSelect?.(`${selectedAddr} ${detail.trim()}`.trim());
    navigation.goBack();
  };

  /* ---------------------------------------------------------------- */
  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={{ flex: 1 }}>
      {/* header */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Image source={backIcon} style={{ width: 26, height: 26, tintColor: '#007BFF' }} />
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.title}>주소 검색</Text>

        {/* search bar */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.input}
            placeholder="도로명 + 건물번호 (예: 삼산로 1)"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
            <Text style={styles.searchTxt}>검색</Text>
          </TouchableOpacity>
        </View>

        {/* spinner always shows during search/expand */}
        {loading && (
          <View style={{ paddingTop: 16, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#007BFF" />
          </View>
        )}

        {/* address list & detail */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          {results.map((item, i) => {
            const addr = buildAddr(item);
            const picked = selectedAddr === addr;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.card, picked && styles.cardSelected]}
                onPress={() => handlePressAddr(item)}
              >
                <Text style={[styles.addr, picked && styles.addrSelected]}>{addr}</Text>
              </TouchableOpacity>
            );
          })}

          {selectedAddr && (
            <View style={styles.detailWrap}>
              <Text style={styles.detailLabel}>상세주소</Text>
              <TextInput
                style={styles.detailInput}
                placeholder="예: 101호"
                value={detail}
                onChangeText={setDetail}
              />
              <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
                <Text style={styles.confirmText}>주소 선택 완료</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 24,
    zIndex: 10,
  },
  container: { flex: 1, paddingTop: 90, paddingHorizontal: 24 },
  title: {
    fontFamily: 'JalnanGothic',
    fontSize: 28,
    color: '#010198',
    marginBottom: 24,
    textAlign: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 999,
    alignItems: 'center',
    paddingLeft: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  input: {
    flex: 1,
    height: 48,
    fontFamily: 'Pretendard-Regular',
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    height: 48,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
    justifyContent: 'center',
  },
  searchTxt: { color: '#fff', fontFamily: 'Pretendard-Bold' },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginTop: 14,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  cardSelected: {
    backgroundColor: '#007BFF',
    borderColor: '#0056b3',
  },
  addr: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 13,
    color: '#222',
  },
  addrSelected: {
    color: '#fff',
  },
  detailWrap: {
    marginTop: 20,
  },
  detailLabel: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  detailInput: {
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#222',
  },
  confirmBtn: {
    marginTop: 12,
    backgroundColor: '#007BFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
  },
});
