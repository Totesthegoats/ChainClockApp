import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { sharedStyles, COLORS, formatNumber, formatPercent } from './styles';

export default function MiningScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [hashRes, diffRes] = await Promise.all([
        fetch('https://mempool.space/api/v1/mining/hashrate/3d'),
        fetch('https://mempool.space/api/v1/difficulty-adjustment'),
      ]);
      const hashData = await hashRes.json();
      const diffAdj = await diffRes.json();

      const latestHash = hashData.hashrates[hashData.hashrates.length - 1].avgHashrate;
      const latestDiff = hashData.difficulty[hashData.difficulty.length - 1].difficulty;

      const hashrate = (latestHash / 1e18).toFixed(2);
      const difficulty = (latestDiff / 1e12).toFixed(2);
      const blocksInEpoch = 2016;
      const progressPercent = diffAdj.progressPercent;
      const blocksRemaining = Math.round(blocksInEpoch * (1 - progressPercent / 100));
      const estChange = diffAdj.difficultyChange;
      const avgBlockTime = (diffAdj.timeAvg / 1000 / 60).toFixed(1);
      const remainingBlocks = diffAdj.remainingBlocks;
      const remainingTime = diffAdj.remainingTime;
      const daysRemaining = Math.floor(remainingTime / 1000 / 60 / 60 / 24);

      setData({
        hashrate, difficulty, progressPercent, blocksRemaining: remainingBlocks,
        estChange, avgBlockTime, daysRemaining,
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
    hashrate, difficulty, progressPercent, blocksRemaining,
    estChange, avgBlockTime, daysRemaining,
  } = data;

  const changeColor = estChange >= 0 ? COLORS.error : COLORS.success;
  const changeArrow = estChange >= 0 ? '\u2191' : '\u2193';

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
        <Text style={sharedStyles.label}>Network Hash Rate</Text>
        <Text style={[sharedStyles.heroValue, { marginTop: 8 }]}>
          {hashrate} EH/s
        </Text>
      </View>

      <Text style={sharedStyles.sectionHeader}>DIFFICULTY</Text>

      <View style={sharedStyles.card}>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>Current Difficulty</Text>
          <Text style={sharedStyles.value}>{difficulty}T</Text>
        </View>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>Block Reward</Text>
          <Text style={sharedStyles.value}>3.125 BTC</Text>
        </View>
        <View style={sharedStyles.row}>
          <Text style={sharedStyles.label}>Avg Block Time</Text>
          <Text style={sharedStyles.value}>{avgBlockTime} min</Text>
        </View>
        <View style={[sharedStyles.row, sharedStyles.rowLast]}>
          <Text style={sharedStyles.label}>Est. Adjustment</Text>
          <Text style={[sharedStyles.value, { color: changeColor }]}>
            {changeArrow} {estChange >= 0 ? '+' : ''}{estChange.toFixed(2)}%
          </Text>
        </View>
      </View>

      <Text style={sharedStyles.sectionHeader}>EPOCH PROGRESS</Text>

      <View style={sharedStyles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={sharedStyles.label}>Difficulty Epoch</Text>
          <Text style={[sharedStyles.label, { color: COLORS.primary }]}>
            {formatPercent(progressPercent)}
          </Text>
        </View>
        <View style={sharedStyles.progressBarOuter}>
          <View style={[sharedStyles.progressBarInner, { width: `${Math.min(progressPercent, 100)}%` }]} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <View>
            <Text style={sharedStyles.label}>Blocks Remaining</Text>
            <Text style={[sharedStyles.value, { marginTop: 4 }]}>{formatNumber(blocksRemaining)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={sharedStyles.label}>Est. Time</Text>
            <Text style={[sharedStyles.value, { marginTop: 4 }]}>~{daysRemaining}d</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
