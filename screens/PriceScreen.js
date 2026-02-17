import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { sharedStyles, COLORS, formatPrice, formatNumber } from './styles';

const ATH_PRICE = 108786;
const ATH_DATE = 'Jan 20, 2025';

export default function PriceScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('https://mempool.space/api/v1/prices');
      const prices = await res.json();
      const usd = prices.USD;
      const satsPerDollar = Math.round(100000000 / usd);
      const circulatingSupply = 19850000;
      const marketCap = usd * circulatingSupply;
      const athDiff = ((usd - ATH_PRICE) / ATH_PRICE) * 100;
      setData({ usd, satsPerDollar, marketCap, athDiff, eur: prices.EUR, gbp: prices.GBP });
      setError(null);
    } catch (err) {
      if (!data) setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [data]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 300000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={sharedStyles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={sharedStyles.centered}>
        <Text style={sharedStyles.errorText}>{error}</Text>
        <TouchableOpacity style={sharedStyles.retryButton} onPress={fetchData}>
          <Text style={sharedStyles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { usd, satsPerDollar, marketCap, athDiff, eur, gbp } = data;

  return (
    <ScrollView
      style={sharedStyles.container}
      contentContainerStyle={sharedStyles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
          tintColor={COLORS.primary} colors={[COLORS.primary]} />
      }
    >
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.label}>Bitcoin Price (USD)</Text>
        <Text style={[sharedStyles.heroValue, { marginTop: 12, marginBottom: 4 }]}>
          {formatPrice(usd)}
        </Text>
        <Text style={[sharedStyles.label, { textAlign: 'center', marginTop: 4 }]}>
          {formatNumber(satsPerDollar)} sats / $1
        </Text>
      </View>

      <Text style={sharedStyles.sectionHeader}>MARKET DATA</Text>

      <View style={sharedStyles.card}>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>Market Cap</Text>
          <Text style={sharedStyles.value}>
            ${(marketCap / 1e12).toFixed(2)}T
          </Text>
        </View>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>All-Time High</Text>
          <Text style={sharedStyles.value}>{formatPrice(ATH_PRICE)}</Text>
        </View>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>ATH Date</Text>
          <Text style={[sharedStyles.value, { fontSize: 16 }]}>{ATH_DATE}</Text>
        </View>
        <View style={[sharedStyles.row, sharedStyles.rowLast]}>
          <Text style={sharedStyles.label}>From ATH</Text>
          <Text style={[sharedStyles.value, { color: athDiff >= 0 ? COLORS.success : COLORS.error }]}>
            {athDiff >= 0 ? '+' : ''}{athDiff.toFixed(2)}%
          </Text>
        </View>
      </View>

      {(eur || gbp) && (
        <>
          <Text style={sharedStyles.sectionHeader}>OTHER CURRENCIES</Text>
          <View style={sharedStyles.card}>
            {eur != null && (
              <View style={sharedStyles.row}>
                <Text style={sharedStyles.label}>EUR</Text>
                <Text style={sharedStyles.value}>{'\u20AC'}{formatNumber(eur)}</Text>
              </View>
            )}
            {gbp != null && (
              <View style={[sharedStyles.row, sharedStyles.rowLast]}>
                <Text style={sharedStyles.label}>GBP</Text>
                <Text style={sharedStyles.value}>{'\u00A3'}{formatNumber(gbp)}</Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
