import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
  RouteProp,
} from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList, Subtype } from '../navigation/AppNavigator';

/* --------- minimal local types (only fields we read) --------- */
export interface TierAssetPart { partId: string; label: string; url: string }
export interface TierAsset      { blueprint?: string; parts?: TierAssetPart[] }
export interface Tier           { tier: string; price: number; assets: TierAsset }
export interface Choice         { label: string; value: string; extraCost: number; extraTime: number }
export interface Option         { _id: string; key: string; label: string; choices: Choice[] }

export interface ServiceType {
  _id: string;
  label: string;
  tiers: Tier[];
  options: Option[];
}

/* --------- stack generics --------- */
type ExpRoute = RouteProp<RootStackParamList, 'BookingExplanation'>;
type ExpNav   = NativeStackNavigationProp<RootStackParamList>;

export default function BookingExplanation() {
  /* route + nav with generics */
  const route = useRoute<ExpRoute>();
  const navigation = useNavigation<ExpNav>();

  /* params are optional in stack list */
  const {
    serviceType = {} as ServiceType,
    subtype = {} as Subtype,
  } = route.params ?? {};

  /* ---------- tier & part state ---------- */
  const [selectedTier, setSelectedTier] = useState(
    serviceType.tiers?.[0]?.tier ?? '',
  );
  const currentTier =
    serviceType.tiers?.find((t: { tier: any; }) => t.tier === selectedTier) ?? null;

  const [selectedPartId, setSelectedPartId] = useState<string | null>(
    currentTier?.assets.parts?.[0]?.partId ?? null,
  );
  const selectedPart =
    currentTier?.assets.parts?.find((p: { partId: string | null; }) => p.partId === selectedPartId) ?? null;

  /* ---------- option selection ---------- */
  interface SelectedOption {
    _id: string;
    key: string;
    label: string;
    selectedLabel: string;
    selectedValue: string;
    extraCost: number;
    extraTime: number;
  }
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, SelectedOption>
  >({});

  /* ---------- block system back button ---------- */
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  const handleBack = () => {
    setTimeout(() => {
      Alert.alert(
        '경고',
        '서비스 선택부터 다시 시작해야 합니다. 그래도 돌아가시겠습니까?',
        [
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
        ],
      );
    }, 0);
  };

  /* ---------- confirm ---------- */
  const handleConfirm = () => {
    if (!serviceType.tiers?.length) {
      Alert.alert('오류', '유효한 서비스 정보가 없습니다.');
      return;
    }

    const allSelected = (serviceType.options ?? []).every(
      opt => !!selectedOptions[opt.key],
    );
    if (!allSelected) {
      Alert.alert('옵션 선택 필요', '모든 옵션을 선택해 주세요.');
      return;
    }

    const selectedOptionData = (serviceType.options ?? []).map(opt => {
      const sel = selectedOptions[opt.key];
      return (
        sel ?? {
          _id: opt._id,
          key: opt.key,
          label: opt.label,
          selectedLabel: opt.choices[0].label,
          selectedValue: opt.choices[0].value,
          extraCost: opt.choices[0].extraCost,
          extraTime: opt.choices[0].extraTime,
        }
      );
    });

    const tierData = serviceType.tiers.find((t: { tier: any; }) => t.tier === selectedTier);
    if (!tierData) {
      Alert.alert('오류', '티어를 선택해 주세요.');
      return;
    }

    navigation.navigate('Confirm', {
      serviceType,
      subtype,
      tier: {
        ...tierData,
        tier: tierData.tier === 'standard-others' ? 'standard' : tierData.tier,
      },
      selectedOptions: selectedOptionData,
    });
  };

  /* ---------- blueprint images map (unchanged) ---------- */
  const blueprintMap: Record<string, any> = {
    'bpbyukgulyee - standard.png': require('../assets/acpic/bpbyukgulyee - standard.png'),
    // … other entries unchanged …
    'bpshilwaegi - 2dan': require('../assets/acpic/bpshilwaegi - 2dan.png'),
  };

  /* ---------- UI (identical to your file) ---------- */
  return (
    <LinearGradient colors={['#d0eaff', '#89c4f4']} style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Image
            source={require('../assets/icons/back-button.png')}
            style={styles.backIcon}
          />
        </TouchableOpacity>

        <Text style={styles.title}>{serviceType.label ?? '서비스'} 안내</Text>
        <Text style={styles.subTitle}>세부 옵션 및 세척 부위를 확인하세요</Text>

        {/* Tier buttons */}
        <View style={styles.tierList}>
  {(serviceType.tiers ?? []).map((
      tier /* <-- let TS infer it as Tier */
  ) => (
    <TouchableOpacity
      key={String(tier.tier)}                     /* key must be string   */
      style={[
        styles.tierButton,
        selectedTier === tier.tier && styles.tierActive,
      ]}
      onPress={() => {
        setSelectedTier(tier.tier);
        setSelectedPartId(
          tier.assets.parts?.[0]?.partId ?? null   /* already null-safe   */
        );
      }}
    >
      <Text
        style={[
          styles.tierLabel,
          selectedTier === tier.tier && styles.tierLabelSelected,
        ]}
      >
        {(tier.tier === 'standard-others' ? 'STANDARD' : tier.tier)
          .toUpperCase()}
      </Text>

      <Text
        style={[
          styles.tierPrice,
          selectedTier === tier.tier && styles.tierPriceSelected,
        ]}
      >
        ₩{tier.price.toLocaleString()}
      </Text>
    </TouchableOpacity>
  ))}
</View>

        <Text style={styles.title}>설계도</Text>

        {/* Blueprint */}
        <View style={styles.blueprintContainer}>
          {currentTier?.assets.blueprint &&
            blueprintMap[currentTier.assets.blueprint] && (
              <Image
                source={blueprintMap[currentTier.assets.blueprint]}
                style={styles.blueprint}
              />
            )}
        </View>

        {/* Parts */}
        <View style={styles.partList}>
          {(currentTier?.assets.parts ?? []).map((part: { partId: string | number | bigint | ((prevState: string | null) => string | null) | null | undefined; label: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
            <TouchableOpacity
              key={String(part.partId)}
              style={[
                styles.partButton,
                selectedPartId === part.partId && styles.partActive,
              ]}
              onPress={() => part.partId && setSelectedPartId(String(part.partId))}
            >
              <Text
                style={[
                  styles.partLabel,
                  selectedPartId === part.partId && styles.partLabelActive,
                ]}
              >
                {part.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preview */}
        {selectedPart && (
          <View style={styles.previewBox}>
            <Image source={{ uri: selectedPart.url }} style={styles.previewImage} />
            <Text style={styles.previewText}>
              실제 {selectedPart.label} 세척 모습입니다.
            </Text>
          </View>
        )}

        {/* Options */}
        {serviceType.options?.length > 0 && (
          <View style={styles.optionsBox}>
            <Text style={styles.subTitle}>선택 가능한 옵션</Text>
            {serviceType.options.map(opt => (
              <View key={opt._id} style={styles.optionGroup}>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                {opt.choices.map(choice => {
                  const isSel =
                    selectedOptions[opt.key]?.selectedValue === choice.value;
                  return (
                    <TouchableOpacity
                      key={choice.value}
                      style={[
                        styles.optionChoiceButton,
                        isSel && styles.optionChoiceSelected,
                      ]}
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
                            extraTime: choice.extraTime,
                          },
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.optionChoiceText,
                          isSel && styles.optionChoiceTextSelected,
                        ]}
                      >
                        ▸ {choice.label} (+₩{choice.extraCost}, +
                        {choice.extraTime}분)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
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
    }

});
