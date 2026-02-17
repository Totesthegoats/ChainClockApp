import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { sharedStyles, COLORS, formatNumber } from './styles';

export default function BlockHeightScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [heightRes, feeRes] = await Promise.all([
        fetch('https://mempool.space/api/blocks/tip/height'),
        fetch('https://mempool.space/api/v1/fees/recommended'),
      ]);
      const height = await heightRes.json();
      const fees = await feeRes.json();
      setData({ height, fees });
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
    intervalRef.current = setInterval(fetchData, 30000);
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

  const { height, fees } = data;

  const feeRows = [
    { label: 'Fastest (~10 min)', value: fees.fastestFee, priority: true },
    { label: 'Half Hour', value: fees.halfHourFee },
    { label: '1 Hour', value: fees.hourFee },
    { label: 'Economy', value: fees.economyFee },
    { label: 'Minimum', value: fees.minimumFee },
  ];

  return (
    <ScrollView
      style={sharedStyles.container}
      contentContainerStyle={sharedStyles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
        />
      }
    >
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.label}>Current Block Height</Text>
        <Text style={[sharedStyles.heroValue, { marginTop: 12, marginBottom: 8 }]}>
          {formatNumber(height)}
        </Text>
      </View>

      <Text style={sharedStyles.sectionHeader}>FEE ESTIMATES (sat/vB)</Text>

      <View style={sharedStyles.card}>
        {feeRows.map((row, i) => (
          <View key={row.label} style={[sharedStyles.row, i === feeRows.length - 1 && sharedStyles.rowLast]}>
            <Text style={sharedStyles.label}>{row.label}</Text>
            <Text style={[
              sharedStyles.value,
              row.priority && { color: COLORS.primary, fontSize: 22 },
            ]}>
              {row.value} sat/vB
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
