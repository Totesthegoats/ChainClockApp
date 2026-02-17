import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { sharedStyles, COLORS, formatNumber, formatPrice, formatPercent } from './styles';

const CIRCULATING_SUPPLY = 19850000;

export default function LightningScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [lnRes, priceRes] = await Promise.all([
        fetch('https://mempool.space/api/v1/lightning/statistics/latest'),
        fetch('https://mempool.space/api/v1/prices'),
      ]);
      const lnData = await lnRes.json();
      const prices = await priceRes.json();

      const stats = lnData.latest;
      const btcPrice = prices.USD;

      const channels = stats.channel_count;
      const nodes = stats.node_count;
      const capacitySats = stats.total_capacity;
      const capacityBTC = capacitySats / 1e8;
      const capacityUSD = capacityBTC * btcPrice;

      const avgChanSizeSats = Math.round(capacitySats / Math.max(channels, 1));
      const avgChanSizeBTC = (avgChanSizeSats / 1e8).toFixed(4);
      const avgChanPerNode = (channels / Math.max(nodes, 1)).toFixed(1);
      const pctOfSupply = (capacityBTC / CIRCULATING_SUPPLY) * 100;

      setData({
        channels, nodes, capacityBTC, capacityUSD,
        avgChanSizeSats, avgChanSizeBTC, avgChanPerNode,
        pctOfSupply, btcPrice,
      });
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
    intervalRef.current = setInterval(fetchData, 1800000);
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

  const {
    channels, nodes, capacityBTC, capacityUSD,
    avgChanSizeSats, avgChanSizeBTC, avgChanPerNode,
    pctOfSupply, btcPrice,
  } = data;

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
        <Text style={sharedStyles.label}>Total LN Capacity</Text>
        <Text style={[sharedStyles.heroValue, { marginTop: 8 }]}>
          {capacityBTC.toFixed(2)} BTC
        </Text>
        <Text style={[sharedStyles.label, { textAlign: 'center', marginTop: 4 }]}>
          {formatPrice(Math.round(capacityUSD))}
        </Text>
      </View>

      <Text style={sharedStyles.sectionHeader}>NETWORK STATS</Text>

      <View style={sharedStyles.card}>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>Public Channels</Text>
          <Text style={sharedStyles.value}>{formatNumber(channels)}</Text>
        </View>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>Active Nodes</Text>
          <Text style={sharedStyles.value}>{formatNumber(nodes)}</Text>
        </View>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>Avg Channel Size</Text>
          <Text style={sharedStyles.value}>{formatNumber(avgChanSizeSats)} sats</Text>
        </View>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>Avg Channel Size</Text>
          <Text style={sharedStyles.value}>{avgChanSizeBTC} BTC</Text>
        </View>
        <View style={[sharedStyles.row, sharedStyles.rowLast]}>
          <Text style={sharedStyles.label}>Avg Channels / Node</Text>
          <Text style={sharedStyles.value}>{avgChanPerNode}</Text>
        </View>
      </View>

      <Text style={sharedStyles.sectionHeader}>LN vs ON-CHAIN</Text>

      <View style={sharedStyles.card}>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>% of Circulating Supply</Text>
          <Text style={[sharedStyles.value, { color: COLORS.primary }]}>
            {formatPercent(pctOfSupply, 4)}
          </Text>
        </View>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>USD Value Locked</Text>
          <Text style={sharedStyles.value}>{formatPrice(Math.round(capacityUSD))}</Text>
        </View>
        <View style={[sharedStyles.row, sharedStyles.rowLast]}>
          <Text style={sharedStyles.label}>BTC Price</Text>
          <Text style={sharedStyles.value}>{formatPrice(btcPrice)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
