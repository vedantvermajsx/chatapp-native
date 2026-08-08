import { StyleSheet } from 'react-native';

export const SHARED_BG = {
  root: { flex: 1, backgroundColor: '#060a04', position: 'relative' },
  background: { ...StyleSheet.absoluteFillObject, backgroundColor: '#060a04', overflow: 'hidden' },
  gradientGlow: {
    position: 'absolute', top: 300, left: -120, width: 500, height: 500, borderRadius: 250,
    backgroundColor: 'rgba(0,128,128,0.28)'
  },
  previewRowTop: { position: 'absolute', bottom: 10, left: 28, right: 28, gap: 8 },
  previewRow: { maxWidth: 320 },
  previewBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, maxWidth: '85%' },
  previewBubbleOther: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start', borderBottomLeftRadius: 4
  },
  previewBubbleMine: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  previewBubbleText: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 10, paddingTop: 2, paddingBottom: 20, alignItems: 'center' },
  topBrand: { alignItems: 'flex-start', alignSelf: 'stretch', marginTop: 4, marginBottom: 20, maxWidth: 420 },
  heroBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: 'rgba(255,255,255,0.82)', lineHeight: 32, letterSpacing: -0.3 },
  card: {
    width: '100%', maxWidth: 420,marginTop:80, backgroundColor: 'transparent', borderRadius: 22, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 10
  }
};

export const SHARED_FORM = {
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 12, gap: 5 },
  backBtnText: { color: '#6b7280', fontSize: 13 },
  title: { fontSize: 24, fontWeight: '700', color: '#cbc4d5ff', marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 14.5, color: '#8a95acff', marginBottom: 22 },
  errorBanner: { backgroundColor: '#1f1f1fff', borderWidth: 1, borderColor: 'transparent', borderRadius: 10, paddingHorizontal: 2, paddingVertical: 8, marginBottom: 16 },
  errorText: { color: '#b71313ff', fontSize: 13, textAlign: 'center' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, marginBottom: 10, paddingHorizontal: 10, paddingVertical: 2 },
  inputIcon: { paddingHorizontal: 6 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2, marginBottom: 8 },
  statusTextChecking: { color: '#6b7280', fontSize: 12 },
  statusTextAvailable: { color: '#059669', fontSize: 12 },
  statusTextError: { color: '#dc2626', fontSize: 12, marginTop: 2, marginBottom: 8 },
  genderInInputRow: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 6, paddingRight: 6 },
  genderChip: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  genderChipSelected: { backgroundColor: 'rgba(0,128,128,0.10)' },
  genderChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8, marginBottom: 20, paddingHorizontal: 4 },
  checkBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#d1d5db', marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  checkBoxChecked: { backgroundColor: '#008080', borderColor: '#008080' },
  termsText: { fontSize: 13, color: '#4b5563', lineHeight: 18, flex: 1 },
  termsLink: { fontWeight: '600' },
  primaryButton: { borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  buttonDisabled: { opacity: 0.55 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  secondaryButton: { borderWidth: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  secondaryButtonText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 10 },
  divider: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { color: '#9ca3af', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  footerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerTextGray: { color: '#aeb0b6ff', fontSize: 14 },
  footerLinkText: { fontSize: 14, fontWeight: '600',color:'#aeb0b6ff' }
};
