import { StyleSheet } from 'react-native';

export const COLORS = {
  background: '#1a1a1a',
  surface: '#2a2a2a',
  primary: '#f7931a',
  primaryDark: '#d67c15',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  border: '#3a3a3a',
  success: '#00c853',
  warning: '#ffa726',
  error: '#ef5350',
};

export function formatNumber(num) {
  if (num == null) return '—';
  return Number(num).toLocaleString('en-US');
}

export function formatPrice(num) {
  if (num == null) return '—';
  return '$' + Number(num).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatPercent(num, decimals = 2) {
  if (num == null) return '—';
  return Number(num).toFixed(decimals) + '%';
}

export function formatCompact(num) {
  if (num == null) return '—';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return String(num);
}

export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  heroValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  label: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  progressBarOuter: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
