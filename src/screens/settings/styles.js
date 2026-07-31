import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
  },
  profileSub: {
    fontSize: 12,
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 18,
    paddingHorizontal: 2,
  },
  sectionGroup: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 22,
  },
  dangerBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },

  footnote: {
    fontSize: 11,
    marginTop: 18,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  paragraphBlock: {
    marginBottom: 18,
  },
  paragraphTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  paragraphText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
