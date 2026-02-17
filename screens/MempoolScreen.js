import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { sharedStyles, COLORS, formatNumber, formatCompact } from './styles';

export default function MempoolScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [mempoolRes, feeRes] = await Promise.all([
        fetch('https://mempool.space/api/mempool'),
        fetch('https://mempool.space/api/v1/fees/recommended'),
      ]);
      const mempool = await mempoolRes.json();
      const fees = await feeRes.json();

      const txCount = mempool.count;
      const vsizeMB = (mempool.vsize / 1e6).toFixed(2);
      const avgTxPerBlock = Math.round(txCount / Math.max(1, Math.ceil(mempool.vsize / 1e6)));

      setData({ txCount, vsizeMB, avgTxPerBlock, fees });
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
    intervalRef.current = setInterval(fetchData, 120000);
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

  const { txCount, vsizeMB, avgTxPerBlock, fees } = data;

  const feeRows = [
    { label: 'Fastest', value: fees.fastestFee, color: COLORS.error },
    { label: 'Half Hour', value: fees.halfHourFee, color: COLORS.warning },
    { label: '1 Hour', value: fees.hourFee, color: COLORS.primary },
    { label: 'Economy', value: fees.economyFee, color: COLORS.success },
    { label: 'Minimum', value: fees.minimumFee, color: COLORS.textSecondary },
  ];

  const maxFee = Math.max(...feeRows.map(r => r.value), 1);

  const confirmTimes = [
    { label: 'Next Block', fee: fees.fastestFee },
    { label: '~30 min', fee: fees.halfHourFee },
    { label: '~1 hour', fee: fees.hourFee },
    { label: '~2+ hours', fee: fees.economyFee },
  ];

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
        <Text style={sharedStyles.label}>Fastest Fee Rate</Text>
        <Text style={[sharedStyles.heroValue, { marginTop: 8, marginBottom: 4 }]}>
          {fees.fastestFee} sat/vB
        </Text>
      </View>

      <Text style={sharedStyles.sectionHeader}>MEMPOOL STATUS</Text>

      <View style={sharedStyles.card}>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>Pending Transactions</Text>
          <Text style={sharedStyles.value}>{formatNumber(txCount)}</Text>
        </View>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>Mempool Size</Text>
          <Text style={sharedStyles.value}>{vsizeMB} vMB</Text>
        </View>
        <View style={[sharedStyles.row, sharedStyles.rowLast]}>
          <Text style={sharedStyles.label}>Avg TXs / Block</Text>
          <Text style={sharedStyles.value}>~{formatNumber(avgTxPerBlock)}</Text>
        </View>
      </View>

      <Text style={sharedStyles.sectionHeader}>FEE RATE TIERS (sat/vB)</Text>

      <View style={sharedStyles.card}>
        {feeRows.map((row, i) => {
          const pct = (row.value / maxFee) * 100;
          return (
            <View key={row.label} style={{ marginBottom: i < feeRows.length - 1 ? 16 : 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={sharedStyles.label}>{row.label}</Text>
                <Text style={[sharedStyles.value, { fontSize: 16, color: row.color }]}>
                  {row.value} sat/vB
                </Text>
              </View>
              <View style={[sharedStyles.progressBarOuter, { height: 8 }]}>
                <View style={[sharedStyles.progressBarInner, {
                  width: `${Math.min(pct, 100)}%`,
                  backgroundColor: row.color,
                }]} />
              </View>
            </View>
          );
        })}
      </View>

      <Text style={sharedStyles.sectionHeader}>CONFIRMATION ESTIMATES</Text>

      <View style={sharedStyles.card}>
        {confirmTimes.map((row, i) => (
          <View key={row.label} style={[sharedStyles.row, i === confirmTimes.length - 1 && sharedStyles.rowLast]}>
            <Text style={sharedStyles.label}>{row.label}</Text>
            <Text style={sharedStyles.value}>{row.fee} sat/vB</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
