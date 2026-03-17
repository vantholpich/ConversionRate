import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Modern Design Theme Constants
const COLORS = {
  background: '#0D0D12',     // Very dark base
  cardLayer1: '#1A1A24',     // First layered panel
  cardLayer2: '#242430',     // Inner inputs layer
  accent: '#OC79FE',         // Strong primary blue (iOS like but vibrant)
  accentBright: '#2F8FFF',   // Lighter blue for pressed states
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E9F',
  danger: '#FF453A',
};

export default function Index() {
  const [amount, setAmount] = useState('0');
  const [convertedAmount, setConvertedAmount] = useState('0.00');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isAudToUsd, setIsAudToUsd] = useState(true);

  // Animations
  const swapAnimation = useRef(new Animated.Value(0)).current;

  const fetchRate = async () => {
    try {
      const from = isAudToUsd ? 'AUD' : 'USD';
      const to = isAudToUsd ? 'USD' : 'AUD';
      const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
      const data = await response.json();
      setExchangeRate(data.rates[to]);
    } catch (error) {
      console.error('Error fetching exchange rate, using fallback', error);
      setExchangeRate(isAudToUsd ? 0.65 : 1.54);
    }
  };

  useEffect(() => {
    fetchRate();
  }, [isAudToUsd]);

  useEffect(() => {
    if (exchangeRate !== null) {
      const numAmount = parseFloat(amount || '0');
      setConvertedAmount((numAmount * exchangeRate).toFixed(2));
    }
  }, [amount, exchangeRate]);

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setAmount('0');
    } else if (key === '⌫') {
      setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount((prev) => prev + '.');
      }
    } else {
      setAmount((prev) => (prev === '0' ? key : prev + key));
    }
  };

  const swapCurrencies = () => {
    // Spin animation
    Animated.timing(swapAnimation, {
      toValue: 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => swapAnimation.setValue(0));

    setIsAudToUsd(!isAudToUsd);
    setAmount('0');
  };

  const spin = swapAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Reusable Animated Button component for motion everywhere
  const AnimatedPressable = ({ 
    onPress, 
    children, 
    style, 
    pressedStyle,
    activeOpacity = 0.8
  }: any) => {
    const scale = useRef(new Animated.Value(1)).current;

    const animateIn = () => {
      Animated.spring(scale, {
        toValue: 0.92,
        useNativeDriver: true,
        speed: 50,
      }).start();
    };

    const animateOut = () => {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
      }).start();
    };

    return (
      <Pressable
        onPressIn={animateIn}
        onPressOut={animateOut}
        onPress={onPress}
        style={({ pressed }) => [style, pressed && pressedStyle]}
      >
        <Animated.View style={{ transform: [{ scale }], width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </Animated.View>
      </Pressable>
    );
  };

  const KeypadButton = ({ char, isAction = false }: { char: string; isAction?: boolean }) => (
    <AnimatedPressable
      style={[styles.keypadButton, isAction && styles.keypadButtonAction]}
      pressedStyle={styles.keypadButtonPressed}
      onPress={() => handleKeyPress(char)}
    >
      <Text style={[styles.keypadButtonText, isAction && styles.keypadButtonTextAction]}>
        {char}
      </Text>
    </AnimatedPressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Convert</Text>
      </View>

      {/* Layer 1: The Main Card */}
      <View style={styles.mainCard}>
        
        {/* Layer 2: Input Field */}
        <View style={styles.currencyPanel}>
          <View style={styles.currencyTopRow}>
            <View style={styles.pillSelector}>
              <Text style={styles.flag}>{isAudToUsd ? '🇦🇺' : '🇺🇸'}</Text>
              <Text style={styles.currencyCode}>{isAudToUsd ? 'AUD' : 'USD'}</Text>
            </View>
          </View>
          <Text style={styles.bigAmountText} numberOfLines={1} adjustsFontSizeToFit>
            {amount}
          </Text>
        </View>

        {/* Floating Swap Button intersecting the layers */}
        <View style={styles.swapWrapper}>
          <AnimatedPressable
            onPress={swapCurrencies}
            style={styles.swapButton}
            pressedStyle={styles.swapButtonPressed}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="swap-vertical" size={26} color={COLORS.textPrimary} />
            </Animated.View>
          </AnimatedPressable>
        </View>

        {/* Layer 2: Output Field */}
        <View style={[styles.currencyPanel, styles.currencyPanelOutput]}>
          <View style={styles.currencyTopRow}>
            <View style={styles.pillSelector}>
              <Text style={styles.flag}>{isAudToUsd ? '🇺🇸' : '🇦🇺'}</Text>
              <Text style={styles.currencyCode}>{isAudToUsd ? 'USD' : 'AUD'}</Text>
            </View>
          </View>
          <Text style={[styles.bigAmountText, styles.convertedAmountText]} numberOfLines={1} adjustsFontSizeToFit>
            {convertedAmount}
          </Text>
        </View>

        <View style={styles.rateBadge}>
          <Ionicons name="trending-up" size={14} color={COLORS.accent} style={{ marginRight: 6 }} />
          <Text style={styles.rateText}>
            {exchangeRate ? `1 ${isAudToUsd ? 'AUD' : 'USD'} = ${exchangeRate.toFixed(4)} ${isAudToUsd ? 'USD' : 'AUD'}` : 'Updating rate...'}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* Modern Keypad taking up the bottom area */}
      <View style={styles.keypadArea}>
        <View style={styles.keypadRow}>
          <KeypadButton char="7" />
          <KeypadButton char="8" />
          <KeypadButton char="9" />
        </View>
        <View style={styles.keypadRow}>
          <KeypadButton char="4" />
          <KeypadButton char="5" />
          <KeypadButton char="6" />
        </View>
        <View style={styles.keypadRow}>
          <KeypadButton char="1" />
          <KeypadButton char="2" />
          <KeypadButton char="3" />
        </View>
        <View style={styles.keypadRow}>
          <KeypadButton char="." />
          <KeypadButton char="0" />
          <KeypadButton char="⌫" isAction />
        </View>
        <AnimatedPressable
           onPress={() => handleKeyPress('C')}
           style={styles.clearButton}
           pressedStyle={styles.clearButtonPressed}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginTop: 10,
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  mainCard: {
    backgroundColor: COLORS.cardLayer1,
    borderRadius: 36, // Large rounded cards
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 10,
  },
  currencyPanel: {
    backgroundColor: COLORS.cardLayer2, // Layered panel
    borderRadius: 24,
    padding: 20,
    minHeight: 120,
    justifyContent: 'center',
  },
  currencyPanelOutput: {
    backgroundColor: '#0a84ff15', // Tinted output layer for strong color theme
    borderWidth: 1,
    borderColor: '#0a84ff30',
  },
  currencyTopRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pillSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  flag: {
    fontSize: 18,
    marginRight: 6,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bigAmountText: {
    fontSize: 56, // Big typography
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  convertedAmountText: {
    color: '#0A84FF', // Strong color theme
  },
  swapWrapper: {
    alignItems: 'center',
    zIndex: 10,
    marginVertical: -18, // Overlapping layers technique
  },
  swapButton: {
    backgroundColor: '#0A84FF', // Strong vibrant accent
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.cardLayer1, // Creates a cutout effect
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  swapButtonPressed: {
    backgroundColor: COLORS.accentBright,
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    backgroundColor: '#FFFFFF08',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rateText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  keypadArea: {
    paddingTop: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  keypadButton: {
    backgroundColor: COLORS.cardLayer1,
    width: '31%',
    aspectRatio: 1.6,
    borderRadius: 24, // Rounded buttons matching aesthetic
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadButtonPressed: {
    backgroundColor: COLORS.cardLayer2,
  },
  keypadButtonAction: {
    backgroundColor: '#FF453A15',
  },
  keypadButtonText: {
    fontSize: 32, // Strong typography on buttons
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  keypadButtonTextAction: {
    color: COLORS.danger,
  },
  clearButton: {
    backgroundColor: '#FFFFFF05',
    width: '100%',
    paddingVertical: 20,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  clearButtonPressed: {
    backgroundColor: '#FFFFFF10',
  },
  clearButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
