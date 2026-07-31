import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  // ── Shared modal styles
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 0 },
  title: { fontSize: 17, fontWeight: '700' },
  body: { padding: 18 },
  label: { fontSize: 12.5, fontWeight: '700' },
  input: { marginTop: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  footer: { padding: 18, borderTopWidth: 1 },
  saveBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── UserSettingsModal
  statusText: { fontSize: 12, fontWeight: '600', marginTop: 6 },

  // ── ImageZoomModal
  zoomBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  zoomCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999 },
  qualityRow: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 46 : 28,
    flexDirection: 'row',
    gap: 10,
  },
  qualityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  qualityText: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
});
