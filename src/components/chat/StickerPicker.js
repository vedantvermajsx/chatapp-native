import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const API_KEY = process.env.EXPO_PUBLIC_KLIPY_API_KEY;
const STICKER_BASE = `https://api.klipy.com/api/v1/${API_KEY}/stickers`;
const GIF_BASE = `https://api.klipy.com/api/v1/${API_KEY}/gifs`;

const FORMAT_ORDER = {
  web: ['gif', 'webp', 'png'],
  native: ['webp', 'gif', 'png'],
};

const getMediaUrl = (file, size = 'xs') => {
  if (!file) return null;
  const order = Platform.OS === 'web' ? FORMAT_ORDER.web : FORMAT_ORDER.native;
  const sizesToTry = [size, 'sm', 'md', 'xs', 'hd'].filter((s, i, a) => a.indexOf(s) === i);
  for (const s of sizesToTry) {
    for (const fmt of order) {
      const url = file?.[s]?.[fmt]?.url;
      if (url) return url;
    }
  }
  return null;
};

const TABS = [
  { id: 'stickers', label: 'Stickers' },
  { id: 'gifs', label: 'GIFs' },
];



export default function StickerPicker({ onStickerSelect, onClose }) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('stickers');
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [mode, setMode] = useState('trending');

  const searchTimeoutRef = useRef(null);
  const currentQueryRef = useRef('');
  const loadingRef = useRef(false);

  const base = activeTab === 'stickers' ? STICKER_BASE : GIF_BASE;

  const fetchItems = useCallback(async (q, pg, reset, tabBase) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const url = q
        ? `${tabBase}/search?q=${encodeURIComponent(q)}&page=${pg}&per_page=12`
        : `${tabBase}/trending?page=${pg}&per_page=12`;
      const res = await fetch(url);
      const json = await res.json();
      const list = json?.data?.data || [];
      const next = json?.data?.has_next ?? false;
      setItems((prev) => (reset ? list : [...prev, ...list]));
      setHasNext(next);
      setPage(pg);
    } catch (e) {
      
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasNext(true);
    setSearchQuery('');
    setMode('trending');
    currentQueryRef.current = '';
    fetchItems('', 1, true, activeTab === 'stickers' ? STICKER_BASE : GIF_BASE);
  }, [activeTab]);

  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeoutRef.current);

    if (!q.trim()) {
      currentQueryRef.current = '';
      setMode('trending');
      setItems([]);
      setPage(1);
      setHasNext(true);
      fetchItems('', 1, true, base);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      currentQueryRef.current = q;
      setMode('search');
      setItems([]);
      setPage(1);
      fetchItems(q, 1, true, base);
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    currentQueryRef.current = '';
    setMode('trending');
    setItems([]);
    setPage(1);
    fetchItems('', 1, true, base);
  };

  const handleEndReached = () => {
    if (hasNext && !loadingRef.current) {
      fetchItems(currentQueryRef.current, page + 1, false, base);
    }
  };

  const handleSelect = (item) => {
    const url = getMediaUrl(item.file, 'sm');
    if (!url) return;
    onStickerSelect({ type: activeTab === 'stickers' ? 'sticker' : 'gif', url });
  };

  const border = theme.isLight ? '#e2e8f0' : '#374151';
  const inputBg = theme.isLight ? '#f1f5f9' : '#1f2937';
  const cardBg = theme.isLight ? '#f8fafc' : '#1f2937';
  const subText = theme.otherUsernameColor;
  const accent = theme.myMessageBubble || '#6366f1';

  return (
    <View style={[styles.wrap, { backgroundColor: theme.background, borderColor: border }]}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Text style={[styles.headerLabel, { color: subText }]}>
          {mode === 'trending' ? 'Trending' : `Results for "${searchQuery}"`}
        </Text>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
          <Ionicons name="close" size={16} color={subText} />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {items.length === 0 && loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="small" color={subText} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerFill}>
            <Text style={{ fontSize: 12, color: subText }}>No {activeTab} found</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item, i) => String(item.id || i)}
            numColumns={4}
            onEndReachedThreshold={0.4}
            onEndReached={handleEndReached}
            renderItem={({ item }) => {
              const url = getMediaUrl(item.file, 'xs');
              if (!url) return null;
              return (
                <TouchableOpacity
                  style={[styles.cell, { backgroundColor: cardBg }]}
                  onPress={() => handleSelect(item)}
                >
                  {item.blur_preview ? (
                    <Image
                      source={{ uri: item.blur_preview }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                  ) : null}
                  <Image source={{ uri: url }} style={styles.cellImg} resizeMode="contain" />
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              items.length > 0 && loading ? (
                <View style={{ paddingVertical: 10 }}>
                  <ActivityIndicator size="small" color={subText} />
                </View>
              ) : null
            }
          />
        )}
      </View>

      <View style={[styles.tabs, { borderBottomColor: border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tabBtn, activeTab === tab.id && { borderBottomColor: accent, borderBottomWidth: 2 }]}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: activeTab === tab.id ? accent : subText }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.searchRow, { backgroundColor: inputBg }]}>
        <Ionicons name="search" size={14} color={subText} />
        <TextInput
          placeholder={`Search ${activeTab}...`}
          placeholderTextColor={subText}
          value={searchQuery}
          onChangeText={handleSearch}
          style={[styles.searchInput, { color: theme.otherMessageText }]}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={handleClearSearch}>
            <Ionicons name="close" size={13} color={subText} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={{ fontSize: 9, fontWeight: '500', color: subText, opacity: 0.6 }}>Powered by KLIPY</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 340, borderWidth: 1, borderRadius: 16, marginBottom: 8, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  headerLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  grid: { flex: 1, paddingHorizontal: 6 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cell: { flex: 1 / 4, aspectRatio: 1, margin: 3, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cellImg: { width: '90%', height: '90%' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 10, marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  searchInput: { flex: 1, fontSize: 12, paddingVertical: 2 },
  footer: { alignItems: 'flex-end', paddingHorizontal: 10, paddingVertical: 5 },
});
