import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
  TextInput,
} from 'react-native';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
  RouteProp,
} from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList, ServiceType, Subtype } from '../navigation/AppNavigator';

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

/* --------- stack generics --------- */
type ExpRoute = RouteProp<RootStackParamList, 'BookingExplanation'>;
type ExpNav = NativeStackNavigationProp<RootStackParamList>;

export default function BookingExplanation() {
  const route = useRoute<ExpRoute>();
  const navigation = useNavigation<ExpNav>();
  const { serviceType = {} as ServiceType, subtype = {} as Subtype } = route.params ?? {};

  const [selectedTierKey, setSelectedTierKey] = useState<string>(
    serviceType.tiers?.[0]?.tier ?? ''
  );
  const currentTier = useMemo(
    () => serviceType.tiers?.find(t => t.tier === selectedTierKey) ?? null,
    [serviceType.tiers, selectedTierKey]
  );
  const [selectedPartId, setSelectedPartId] = useState<string | null | undefined>(null);

  useEffect(() => {
    const firstPartId = currentTier?.assets.parts?.[0]?.partId ?? null;
    setSelectedPartId(firstPartId);
  }, [currentTier]);

  const selectedPart = useMemo(
    () => currentTier?.assets.parts?.find(p => p.partId === selectedPartId) ?? null,
    [currentTier, selectedPartId]
  );

  interface SelectedOption {
    _id: string;
    key: string;
    label: string;
    selectedLabel: string;
    selectedValue: string;
    extraCost: number;
  }

  const [selectedOptions, setSelectedOptions] = useState<Record<string, SelectedOption>>({});
  const [symptom, setSymptom] = useState('');

  const subKey = (subtype as any).name ?? '';

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  const handleBack = () => {
    Alert.alert('경고', '서비스 선택부터 다시 시작해야 합니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '돌아가기',
        style: 'destructive',
        onPress: () =>
          navigation.reset({
            index: 0,
            routes: [{ name: 'BookingServiceSelection' }],
          }),
      },
    ]);
  };

  const handleConfirm = () => {
    if (!currentTier) {
      Alert.alert('오류', '티어를 선택해 주세요.');
      return;
    }

    if ((serviceType.options ?? []).some(opt => !selectedOptions[opt.key])) {
      Alert.alert('옵션 선택 필요', '모든 옵션을 선택해 주세요.');
      return;
    }

    const optionPayload = (serviceType.options ?? []).map(opt => {
      const sel = selectedOptions[opt.key];
      return (
        sel ?? {
          _id: opt._id,
          key: opt.key,
          label: opt.label,
          selectedLabel: opt.choices[0].label,
          selectedValue: opt.choices[0].value,
          extraCost: opt.choices[0].extraCost,
        }
      );
    });

    navigation.navigate('Confirm', {
      serviceType,
      subtype,
      tier: currentTier,
      selectedOptions: optionPayload,
      ...(serviceType.name === 'fix' && { symptom }),
    });
  };

  const blueprintMap: Record<string, any> = {
    'bpbyukgulyee - standard.png': require('../assets/acpic/bpbyukgulyee - standard.png'),
    'bpbyukgulyee - deluxe.png': require('../assets/acpic/bpbyukgulyee - deluxe.png'),
    'bpbyukgulyee - premium.png': require('../assets/acpic/bpbyukgulyee - premium.png'),
    'bpstandairconditioner.png': require('../assets/acpic/bpstandairconditioner.png'),
    'bpstandairconditioner - standard.png': require('../assets/acpic/bpstandairconditioner - standard.png'),
    'bpstandairconditioner - deluxe.png': require('../assets/acpic/bpstandairconditioner - deluxe.png'),
    'bpstandairconditioner - premium.png': require('../assets/acpic/bpstandairconditioner - premium.png'),
    'bp2in1 - standard.png': require('../assets/acpic/bp2in1 - standard.png'),
    'bp2in1 - deluxe & premium.png': require('../assets/acpic/bp2in1 - deluxe & premium.png'),
    'bp1way - standard.png': require('../assets/acpic/bp1way - standard.png'),
    'bp1way - deluxe.png': require('../assets/acpic/bp1way - deluxe.png'),
    'bp1way - premium.png': require('../assets/acpic/bp1way - premium.png'),
    '4way - standard.png': require('../assets/acpic/4way - standard.png'),
    '4way - deluxe.png': require('../assets/acpic/4way - deluxe.png'),
    '4way - premium.png': require('../assets/acpic/4way - premium.png'),
    'bpshilwaegi - standard & deluxe.png': require('../assets/acpic/bpshilwaegi - standard & deluxe.png'),
    'bpshilwaegi - 2dan.png': require('../assets/acpic/bpshilwaegi - 2dan.png'),
  };

  const blueprintKey = useMemo(() => {
    if (!currentTier) return null;
    return currentTier.assets?.blueprint ?? null;
  }, [currentTier]);

  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image source={require('../assets/icons/back-button.png')} style={styles.backIcon} />
        </TouchableOpacity>

        <Text style={styles.title}>{serviceType.label ?? '서비스'} 안내</Text>
        <Text style={styles.subTitle}>세부 옵션 및 세척 부위를 확인하세요</Text>

        {/* Tier selection */}
        <View style={styles.tierList}>
          {(serviceType.tiers ?? []).map(tier => {
            const active = selectedTierKey === tier.tier;
            return (
              <TouchableOpacity
                key={tier.tier}
                style={[styles.tierButton, active && styles.tierActive]}
                onPress={() => setSelectedTierKey(tier.tier)}
              >
                <Text style={[styles.tierLabel, active && styles.tierLabelSelected]}>
                  {tier.tier.toUpperCase()}
                </Text>
                <Text style={[styles.tierPrice, active && styles.tierPriceSelected]}>
                  {tier.price === -1 ? '가격문의' : `₩${tier.price.toLocaleString()}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {currentTier?.memo ? (
          <Text style={styles.tierMemo}>※ {currentTier.memo}</Text>
        ) : null}

        {/* Blueprint */}
        {blueprintKey && blueprintMap[blueprintKey] && (
          <>
            <Text style={styles.title}>설계도</Text>
            <View style={styles.blueprintContainer}>
              <Image source={blueprintMap[blueprintKey]} style={styles.blueprint} />
            </View>
          </>
        )}

        {/* Part buttons */}
        {currentTier?.assets.parts?.length ? (
          <View style={styles.partList}>
            {currentTier.assets.parts.map(part => {
              const active = selectedPartId === part.partId;
              return (
                <TouchableOpacity
                  key={part.partId}
                  style={[styles.partButton, active && styles.partActive]}
                  onPress={() => setSelectedPartId(part.partId ?? null)}
                >
                  <Text style={[styles.partLabel, active && styles.partLabelActive]}>
                    {part.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {selectedPart && (
          <View style={styles.previewBox}>
            <Image source={{ uri: selectedPart.url }} style={styles.previewImage} />
            <Text style={styles.previewText}>실제 {selectedPart.label} 세척 모습입니다.</Text>
          </View>
        )}

        {/* Options */}
        {serviceType.options?.length ? (
          <View style={styles.optionsBox}>
            <Text style={styles.subTitle}>선택 가능한 옵션</Text>
            {serviceType.options.map(opt => (
              <View key={opt._id} style={styles.optionGroup}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                {opt.choices.map(choice => {
                  const isSel = selectedOptions[opt.key]?.selectedValue === choice.value;
                  return (
                    <TouchableOpacity
                      key={choice.value}
                      style={[styles.optionChoiceButton, isSel && styles.optionChoiceSelected]}
                      onPress={() =>
                        setSelectedOptions(prev => ({
                          ...prev,
                          [opt.key]: {
                            _id: opt._id,
                            key: opt.key,
                            label: opt.label,
                            selectedLabel: choice.label,
                            selectedValue: choice.value,
                            extraCost: choice.extraCost,
                          },
                        }))
                      }
                    >
                      <Text style={[styles.optionChoiceText, isSel && styles.optionChoiceTextSelected]}>
                        ▸ {choice.label} (+₩{choice.extraCost.toLocaleString('ko-KR')})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

        ) : null}

        {/* Symptom for A/S only */}
         {serviceType.name === 'fix' && (
        <Text style={styles.title}>증상을 입력해주세요</Text>
          )}
        {serviceType.name === 'fix' && (
          <View style={styles.symptomBox}>
              <TextInput
                style={styles.symptomInput}
                multiline
                placeholder="예: 냉방이 잘 안돼요, 물이 새요 등"
                value={symptom}
                onChangeText={setSymptom}
              />
              </View>
          )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleConfirm}>
          <Text style={styles.submitTxt}>예약 진행하기</Text>
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
    alignItems: 'center',
  },
  title: {
    fontFamily: 'JalnanGothic',
    fontSize: 28,
    color: '#010198',
    textAlign: 'center',
  },
  subTitle: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
    textAlign: 'center',
  },
  tierList: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  
  tierButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  
  tierActive: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  
  tierLabel: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 16,
    color: '#010198',
  },

  tierLabelSelected: {
    color: '#fff',
  },

  tierPrice: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 16,
    color: '#000',
    marginTop: 4,
  },

  tierPriceSelected: {
    color: '#fff',
  },  
  partList: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  partButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffffffaa',
    borderRadius: 10,
  },
  partActive: {
    backgroundColor: '#007BFF',
  },
  partLabel: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 14,
    color: '#333',
  },
  previewBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginBottom: 12,
    borderRadius: 10,
  },
  previewText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 14,
    textAlign: 'center',
    color: '#444',
  },

  optionsBox: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  optionHeader: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 16,
    marginBottom: 12,
    color: '#010198',
  },
  optionGroup: {
    marginBottom: 12,
  },
  optionLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 15,
    marginBottom: 4,
  },
  optionChoiceButton: {
    backgroundColor: '#e6efff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 4,
  },
  optionChoiceSelected: {
    backgroundColor: '#007BFF',
  },
  optionChoiceText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 15,
    color: '#333',
  },
  optionChoiceTextSelected: {
    color: '#fff',
    fontFamily: 'Pretendard-Bold', 
  },

  blueprintContainer: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  blueprint: {
    width: '100%',
    height: 350,
    resizeMode: 'contain',
  },
  partLabelActive: {
    color: '#ffffff',
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 60,
    padding: 8,
  },
  backIcon: { width: 24, height: 24, tintColor: '#010198' },
  
  submitBtn: {
    backgroundColor: '#007BFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
    },

    submitTxt: {
      color: '#fff', 
      fontSize: 16, 
      fontFamily: 'Pretendard-Bold'
    },

  symptomBox: {
  width: '100%',
  paddingTop: 0,
  paddingHorizontal: 0,
  paddingBottom: 0,
  marginTop: 20,
  marginBottom: 20,
  backgroundColor: 'transparent',
  },

symptomInput: {
  fontFamily: 'Pretendard-Regular',
  fontSize: 14,
  color: '#333',
  padding: 16,
  textAlignVertical: 'top',
  minHeight: 120,
  width: '100%',
  borderRadius: 10,
  borderColor: '#ccc',
  borderWidth: 1,
  backgroundColor: '#fff',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 2,
},

tierMemo: {
  fontFamily: 'Pretendard-Regular',
  fontSize: 13,
  color: '#cc0000',
  textAlign: 'center',
  marginTop: 6,
  marginBottom: 16,
  paddingHorizontal: 8,
}

});
