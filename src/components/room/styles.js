import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // ── RoomRow / PrivateChatRow (shared)
  roomItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, gap: 12,},
  roomInfo: { flex: 1, minWidth: 0 },
  roomName: { fontSize: 14, fontWeight: '600' },
  roomDesc: { fontSize: 12.5, marginTop: 2 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 999, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  memberCountText: { fontSize: 12, fontWeight: '700', marginLeft: 8 },

  // ── PrivateChatRow
  deleteBtn: { padding: 6 },

  // ── RoomSearch
  searchWrapper: { paddingHorizontal: 16, paddingVertical: 12 },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 2 },
  searchInput: { flex: 1, fontSize: 12, paddingVertical: 8 },

  // ── RoomTabBar
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  tabBadge: { minWidth: 20, height: 20, borderRadius: 999, backgroundColor: '#ef4444', paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // ── SidebarHeader
  sidebarHeader: { alignItems: 'center', justifyContent: 'center', paddingTop: 12, paddingBottom: 12, borderBottomWidth: 0 },
  sidebarHeaderInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appName: { fontSize: 20, fontWeight: '700', letterSpacing: 0.8 },

  // ── SidebarFooter
  sidebarFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 0, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  profileBtn: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  footerUsername: { fontSize: 13, fontWeight: '600', marginLeft: 8, flexShrink: 1 },
  footerActionsRow: { flexDirection: 'row', gap: 12 },
  footerIconBtn: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  // ── CreateRoomModal
  createModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  createModalCard: { width: '100%', maxWidth: 380, borderRadius: 18, padding: 20, borderWidth: 1, gap: 14 },
  createModalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  createModalInput: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1 },
  createModalInputText: { flex: 1, fontSize: 14, paddingVertical: 0 },
  createModalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  createModalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  createModalBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1 },
  createModalBtnPrimary: {},
  createModalBtnTextSecondary: { fontWeight: '600', fontSize: 14 },
  createModalBtnTextPrimary: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── ThemePickerModal
  themeModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.0)', alignItems: 'center', justifyContent: 'flex-end' },
  dragHandle: { width: 36, height: 5, borderRadius: 999, alignSelf: 'center', marginBottom: 10 },
  themeModalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4, textAlign: 'center', flex: 1 },
  themeCard: { width: '100%', borderRadius: 20, padding: 15, borderWidth: 1 },
  themeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  themeCloseBtn: { padding: 8, borderRadius: 20, backgroundColor: 'transparent' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  themeCardItem: { width: '30%', aspectRatio: 1, borderRadius: 14, padding: 10, borderWidth: 1, alignItems: 'center', position: 'relative' },
  themePreviewRow: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  bubblePreview: { minWidth: 26, maxWidth: 34, height: 18, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bubbleOther: { borderTopLeftRadius: 2, alignSelf: 'flex-start' },
  bubbleMine: { borderTopRightRadius: 2, alignSelf: 'flex-end' },
  themeName: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  themeSelectedBadge: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  // ── ThemePickerModal: chat background (registered users only)
  bgSection: { marginBottom: 14, padding: 12, borderRadius: 14, borderWidth: 1.5 },
  bgSectionHighlight: { backgroundColor: 'rgba(0,128,128,0.08)' },
  bgSectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  bgSectionTitle: { fontSize: 12.5, fontWeight: '700', marginBottom: 3 },
  bgSectionSub: { fontSize: 11, marginBottom: 12 },
  bgRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bgPreview: { width: 52, height: 52, borderRadius: 12, borderWidth: 1 },
  bgPreviewEmpty: { alignItems: 'center', justifyContent: 'center' },
  bgActions: { flex: 1, flexDirection: 'row', gap: 8 },
  bgBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  bgBtnText: { fontSize: 12.5, fontWeight: '700' },
});
