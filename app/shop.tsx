import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PillButton } from '@/components/PillButton';
import { useProgressStore } from '@/store/progressStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getAppPalette } from '@/theme/worlds';

const PRODUCTS = [
  { id: 'zenmatch.hints.10', price: '₹49 / $0.99', title: '10 Hints', copy: 'Adds 10 premium hints.' },
  { id: 'zenmatch.hints.50', price: '₹199 / $3.99', title: '50 Hints', copy: 'Stock up for longer sessions.' },
  { id: 'zenmatch.removeads', price: '₹299 / $4.99', title: 'Remove Ads', copy: 'One-time banner removal.' },
  { id: 'zenmatch.starterpack', price: '₹99 / $1.99', title: 'Starter Pack', copy: '20 hints, 5 shuffles, no ads for 7 days.' },
] as const;

export default function ShopScreen() {
  const addHints = useProgressStore((state) => state.addHints);
  const addShuffles = useProgressStore((state) => state.addShuffles);
  const markAdsRemoved = useProgressStore((state) => state.markAdsRemoved);
  const appearanceMode = useSettingsStore((state) => state.appearanceMode);
  const palette = getAppPalette(appearanceMode);
  const styles = useMemo(() => createStyles(palette), [palette]);

  function handleProduct(id: string): void {
    if (id === 'zenmatch.hints.10') {
      addHints(10);
      return;
    }
    if (id === 'zenmatch.hints.50') {
      addHints(50);
      return;
    }
    if (id === 'zenmatch.removeads') {
      markAdsRemoved();
      return;
    }

    addHints(20);
    addShuffles(5);
    markAdsRemoved();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Shop</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.rewardCard}>
          <Text style={styles.rewardTitle}>Rewarded Offers</Text>
          <Text style={styles.rewardCopy}>Watch a rewarded ad to claim a gameplay boost.</Text>
          <View style={styles.rewardButtons}>
            <PillButton
              label="Earn 1 Hint"
              subtitle="Rewarded ad placement"
              onPress={() => addHints(1)}
              backgroundColor={palette.buttonBackground}
              textColor={palette.buttonText}
              shadowColor={palette.shadowColor}
            />
            <PillButton
              label="Earn 1 Shuffle"
              subtitle="Rewarded ad placement"
              onPress={() => addShuffles(1)}
              backgroundColor={palette.buttonBackground}
              textColor={palette.buttonText}
              shadowColor={palette.shadowColor}
            />
          </View>
        </View>

        {PRODUCTS.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Text style={styles.productPrice}>{product.price}</Text>
            <Text style={styles.productTitle}>{product.title}</Text>
            <Text style={styles.productCopy}>{product.copy}</Text>
            <View style={styles.productButtonWrap}>
              <PillButton
                label="Sandbox Purchase"
                subtitle={product.id}
                onPress={() => handleProduct(product.id)}
                backgroundColor={palette.buttonBackground}
                textColor={palette.buttonText}
                shadowColor={palette.shadowColor}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(palette: ReturnType<typeof getAppPalette>) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.background,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    back: {
      color: palette.primaryText,
      fontSize: 15,
      fontWeight: '700',
    },
    title: {
      color: palette.primaryText,
      fontSize: 30,
      fontWeight: '700',
      fontFamily: 'serif',
    },
    headerSpacer: {
      width: 42,
    },
    rewardCard: {
      borderRadius: 30,
      paddingHorizontal: 20,
      paddingVertical: 22,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
      gap: 10,
    },
    rewardTitle: {
      color: palette.primaryText,
      fontSize: 20,
      fontWeight: '800',
    },
    rewardCopy: {
      color: palette.secondaryText,
      fontSize: 14,
      lineHeight: 22,
    },
    rewardButtons: {
      gap: 12,
      marginTop: 8,
    },
    productCard: {
      borderRadius: 28,
      paddingHorizontal: 20,
      paddingVertical: 22,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
      gap: 8,
    },
    productPrice: {
      color: palette.secondaryText,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    productTitle: {
      color: palette.primaryText,
      fontSize: 24,
      fontWeight: '700',
      fontFamily: 'serif',
    },
    productCopy: {
      color: palette.secondaryText,
      fontSize: 14,
      lineHeight: 22,
    },
    productButtonWrap: {
      marginTop: 6,
    },
  });
}
