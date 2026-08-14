import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // ── ChatHeader 
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1 },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', marginRight: 2 },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  name: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  sub: { fontSize: 12.5, marginTop: 1, opacity: 0.8 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // ── ChatInput 
  inputWrap: { borderTopWidth: 0, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8, position: 'relative' },
  replyPreviewBar: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 3, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 6 },
  replyPreviewName: { fontSize: 12.5, fontWeight: '700', marginBottom: 1 },
  replyPreviewText: { fontSize: 12.5, opacity: 0.8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  inputPill: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', borderRadius: 22, paddingHorizontal: 6, paddingVertical: 4 },
  pillIconBtn: { paddingHorizontal: 6, paddingVertical: 8, alignItems: 'center', justifyContent: 'center'},
  textInput: { flex: 1, paddingHorizontal: 6, paddingVertical: 10, fontSize: 15, maxHeight: 110, minHeight: 30, textAlignVertical: 'center' },
  recordingRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 4 },
  recordDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  sendBtn: { width: 42, height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  mentionList: { position: 'absolute', left: 10, right: 10, bottom: '100%', marginBottom: 4, borderRadius: 12, borderWidth: 1, maxHeight: 180, overflow: 'hidden' },
  mentionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  mentionText: { fontSize: 13.5, fontWeight: '600', marginLeft: 10 },

  // ── ChatMediaPreview 
  previewWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 4, marginBottom: 8 },
  previewThumb: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  previewThumbImg: { width: 44, height: 44, borderRadius: 8, marginRight: 8 },
  previewRemoveBtn: { padding: 5, borderRadius: 999 },

  // ── MembersPanel 
  panelBackdrop: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  panel: { width: '72%', maxWidth: 380, height: '100%', maxHeight: 1500, borderRadius: 10, borderLeftWidth: 1 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  panelTitle: { fontSize: 17, fontWeight: '700' },
  panelSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 8, marginTop: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  panelSearchInput: { flex: 1, fontSize: 12.5 },
  panelSectionTitle: { fontSize: 12.5, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14, borderWidth: 1, marginBottom: 8 },
  memberName: { fontSize: 14, fontWeight: '600' },
  memberSub: { fontSize: 11.5, color: '#9ca3af', marginTop: 2 },
  memberMsgBtn: { width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  // ── StickerPicker ───────────────
  stickerWrap: { height: 340, borderWidth: 1, borderRadius: 16, marginBottom: 8, overflow: 'hidden' },
  stickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  stickerHeaderLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  stickerGrid: { flex: 1, paddingHorizontal: 6 },
  stickerCenterFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stickerCell: { flex: 1 / 4, aspectRatio: 1, margin: 3, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  stickerCellImg: { width: '90%', height: '90%' },
  stickerTabs: { flexDirection: 'row', borderBottomWidth: 1 },
  stickerTabBtn: { flex: 1, paddingVertical: 8, paddingHorizontal: 6, marginVertical: 6, marginHorizontal: 4, alignItems: 'center' },
  stickerSearchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 10, marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  stickerSearchInput: { flex: 1, fontSize: 12, paddingVertical: 2 },
  stickerFooter: { alignItems: 'flex-end', paddingHorizontal: 10, paddingVertical: 5 },
});