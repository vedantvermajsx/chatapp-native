import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // ── MessageBubble 
  row: { flexDirection: 'row', alignItems: 'flex-end', width: '100%', paddingHorizontal: 14, marginTop: 6 },
  rowStart: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, marginTop: 6 },
  bubble: { overflow: 'hidden' },
  bubblePad: { paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMediaHeader: { paddingHorizontal: 14, paddingTop: 9, paddingBottom: 4 },
  bubbleCaption: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 9 },
  senderName: { fontSize: 11.5, fontWeight: '700', marginBottom: 2 },
  msgText: { fontSize: 14.5, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, marginHorizontal: 4 },
  timeText: { fontSize: 10.5, color: '#9ca3af', fontWeight: '500' },
  seenText: { fontSize: 10, color: '#9ca3af', alignSelf: 'flex-end', marginTop: 2, marginHorizontal: 4 },
  sticker: { width: 110, height: 110 },
  mediaImage: { width: 200, height: 150 },

  // ── VideoContent 
  videoThumb: { backgroundColor: '#1f2937', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  playBadge: { width: 46, height: 46, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  videoPlayer: { backgroundColor: '#000', position: 'relative', overflow: 'hidden' },
  videoOverlayDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', gap: 6 },
  videoErrorText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  videoRetryBtn: { marginTop: 2, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.2)' },
  videoRetryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  videoExpandBtn: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },

  // ── TypingIndicator 
  typingBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderBottomLeftRadius: 4 },
  typingDot: { width: 6, height: 6, borderRadius: 999 },

  // ── SystemMessage
  systemWrap: { alignItems: 'center', marginVertical: 14 },
  systemPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  systemText: { fontSize: 12, fontWeight: '600' },

  // ── AudioContent
  audioWrap: { flexDirection: 'row', alignItems: 'center', width: 190, paddingVertical: 2 },
  audioPlayBtn: { width: 30, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  audioBarsRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 24 },
  audioBar: { width: 2.5, borderRadius: 2 },
  audioDuration: { fontSize: 10, marginLeft: 6, opacity: 0.85, fontVariant: ['tabular-nums'] },

  // ── UploadOverlay
  uploadDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  uploadCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  uploadPct: { color: '#fff', fontSize: 11, fontWeight: '700' },
});