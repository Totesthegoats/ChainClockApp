import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { sharedStyles, COLORS, formatNumber, formatPercent } from './styles';

const MAX_SUPPLY = 21000000;
const HALVING_INTERVAL = 210000;

function estimateCirculatingSupply(height) {
  let supply = 0;
  let reward = 50;
  let h = 0;
  while (h < height) {
    const blocksInEra = Math.min(HALVING_INTERVAL, height - h);
    supply += blocksInEra * reward;
    h += HALVING_INTERVAL;
    reward /= 2;
  }
  return supply;
}

function getCurrentReward(height) {
  const era = Math.floor(height / HALVING_INTERVAL);
  return 50 / Math.pow(2, era);
}

export default function SupplyScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('https://mempool.space/api/blocks/tip/height');
      const height = await res.json();

      const circulating = estimateCirculatingSupply(height);
      const pctIssued = (circulating / MAX_SUPPLY) * 100;
      const remaining = MAX_SUPPLY - circulating;

      const currentEra = Math.floor(height / HALVING_INTERVAL);
      const nextHalving = (currentEra + 1) * HALVING_INTERVAL;
      const blocksToHalving = nextHalving - height;
      const daysToHalving = Math.floor((blocksToHalving * 10) / 60 / 24);

      const halvingProgress = ((HALVING_INTERVAL - blocksToHalving) / HALVING_INTERVAL) * 100;
      const currentReward = getCurrentReward(height);
      const annualBlocks = 365.25 * 24 * 6;
      const annualSupply = currentReward * annualBlocks;
      const s2f = circulating / annualSupply;

      setData({
        height, circulating, remaining, pctIssued,
        blocksToHalving, daysToHalving, halvingProgress,
        s2f, currentReward,
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
    intervalRef.current = setInterval(fetchData, 600000);
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
    height, circulating, remaining, pctIssued,
    blocksToHalving, daysToHalving, halvingProgress,
    s2f, currentReward,
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
      <Text style={sharedStyles.sectionHeader}>CIRCULATING SUPPLY</Text>

      <View style={sharedStyles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={sharedStyles.label}>Issued</Text>
          <Text style={[sharedStyles.label, { color: COLORS.primary }]}>
            {formatPercent(pctIssued)}
          </Text>
        </View>
        <View style={sharedStyles.progressBarOuter}>
          <View style={[sharedStyles.progressBarInner, { width: `${Math.min(pctIssued, 100)}%` }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <View>
            <Text style={sharedStyles.label}>Circulating</Text>
            <Text style={[sharedStyles.value, { marginTop: 4 }]}>
              {formatNumber(Math.round(circulating))} BTC
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={sharedStyles.label}>Remaining</Text>
            <Text style={[sharedStyles.value, { marginTop: 4 }]}>
              {formatNumber(Math.round(remaining))} BTC
            </Text>
          </View>
        </View>
        <View style={[sharedStyles.row, sharedStyles.rowLast, { marginTop: 8 }]}>
          <Text style={sharedStyles.label}>Max Supply</Text>
          <Text style={sharedStyles.value}>{formatNumber(MAX_SUPPLY)} BTC</Text>
        </View>
      </View>

      <Text style={sharedStyles.sectionHeader}>HALVING COUNTDOWN</Text>

      <View style={sharedStyles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={sharedStyles.label}>Halving Epoch Progress</Text>
          <Text style={[sharedStyles.label, { color: COLORS.primary }]}>
            {formatPercent(halvingProgress)}
          </Text>
        </View>
        <View style={sharedStyles.progressBarOuter}>
          <View style={[sharedStyles.progressBarInner, { width: `${Math.min(halvingProgress, 100)}%` }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <View>
            <Text style={sharedStyles.label}>Blocks Remaining</Text>
            <Text style={[sharedStyles.value, { marginTop: 4 }]}>
              {formatNumber(blocksToHalving)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={sharedStyles.label}>Est. Days</Text>
            <Text style={[sharedStyles.value, { marginTop: 4 }]}>
              ~{formatNumber(daysToHalving)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={sharedStyles.sectionHeader}>METRICS</Text>

      <View style={sharedStyles.card}>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>Block Height</Text>
          <Text style={sharedStyles.value}>{formatNumber(height)}</Text>
        </View>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>Block Reward</Text>
          <Text style={sharedStyles.value}>{currentReward} BTC</Text>
        </View>
        <View style={[sharedStyles.row, sharedStyles.rowLast]}>
          <Text style={sharedStyles.label}>Stock-to-Flow</Text>
          <Text style={[sharedStyles.value, { color: COLORS.primary }]}>{s2f.toFixed(1)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}
