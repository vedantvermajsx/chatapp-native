import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', width: '100%', paddingHorizontal: 14, marginTop: 6 },
  rowStart: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, marginTop: 6 },
  bubble: { paddingHorizontal: 14, paddingVertical: 9 },
  senderName: { fontSize: 11.5, fontWeight: '700', marginBottom: 2 },
  msgText: { fontSize: 14.5, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, marginHorizontal: 4 },
  timeText: { fontSize: 10.5, color: '#9ca3af', fontWeight: '500' },
  sticker: { width: 110, height: 110 },
  mediaImage: { width: 200, height: 150, borderRadius: 10, marginBottom: 6 },
  videoThumb: { backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  playBadge: { width: 46, height: 46, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  typingBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderBottomLeftRadius: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 999 },
  systemWrap: { alignItems: 'center', marginVertical: 14 },
  systemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  systemText: { fontSize: 12, fontWeight: '600' },
  seenText: { fontSize: 10, color: '#9ca3af', alignSelf: 'flex-end', marginTop: 2, marginHorizontal: 4 },
});
