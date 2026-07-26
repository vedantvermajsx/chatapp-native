import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '../common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import roomService from '../../services/room.service';
import StickerPicker from './StickerPicker';
import ChatVoiceRecorder from './ChatVoiceRecorder';
import ChatMediaPreview from './ChatMediaPreview';

export default function ChatInput({
  user,
  inputMessage,
  setInputMessage,
  onSend,
  disabled,
  currentRoom,
  currentPrivateChat,
  onTypingActivity,
  onStopTyping,
  pendingMedia,
  onRemoveMedia,
  onFileSelect,
  onStickerSend,
}) {
  const { theme } = useTheme();
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const mentionDebounce = useRef(null);
  const MAX_CHARS = 1000;

  const isTyping = inputMessage.trim().length > 0;
  const hasContent = isTyping || !!pendingMedia;

  useEffect(() => {
    if (!currentRoom?._id || mentionQuery === null) {
      setMentionSuggestions([]);
      return;
    }
    clearTimeout(mentionDebounce.current);
    mentionDebounce.current = setTimeout(async () => {
      try {
        let results = await roomService.searchRoomMembers(currentRoom._id, mentionQuery, 6);
        const myId = user?._id || user?.id;
        results = (results || []).filter((m) => m._id !== myId && m.id !== myId);
        setMentionSuggestions(results);
      } catch {
        setMentionSuggestions([]);
      }
    }, 200);
  }, [mentionQuery, currentRoom?._id]);

  const handleChangeText = (val) => {
    if (val.length > MAX_CHARS) val = val.slice(0, MAX_CHARS);
    setInputMessage(val);

    if (currentRoom) {
      const match = val.match(/@(\S*)$/);
      setMentionQuery(match ? match[1] : null);
    } else {
      setMentionQuery(null);
    }

    if (val.trim()) onTypingActivity?.(val.length);
    else onStopTyping?.();
  };

  const insertMention = (username) => {
    const replaced = inputMessage.replace(/@(\S*)$/, `@${username} `);
    setInputMessage(replaced);
    setMentionQuery(null);
    setMentionSuggestions([]);
  };

  const handleSend = () => {
    if (!hasContent || disabled) return;
    onStopTyping?.();
    onSend();
  };

  const handleAttach = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to attach media.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const type = asset.mimeType?.startsWith('video/') ? 'video' : 'image';
      onFileSelect?.({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
        type,
      });
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not attach media');
    }
  };

  const handleVoiceReady = (audioAsset) => {
    onFileSelect?.({ ...audioAsset, type: 'audio' });
  };

  const handleStickerSelect = (sticker) => {
    setShowStickerPicker(false);
    onStickerSend?.(sticker);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: theme.background, borderTopColor: theme.isLight ? '#cbd5e0' : '#4a5568' }]}>
      {disabled && <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, opacity: 0.6, zIndex: 5 }]} />}

      <ChatMediaPreview media={pendingMedia} onRemove={onRemoveMedia} theme={theme} />

      {showStickerPicker && (
        <StickerPicker onStickerSelect={handleStickerSelect} onClose={() => setShowStickerPicker(false)} />
      )}

      {mentionQuery !== null && mentionSuggestions.length > 0 && (
        <View style={[styles.mentionList, { backgroundColor: theme.background, borderColor: theme.isLight ? '#e2e8f0' : '#374151' }]}>
          {mentionSuggestions.map((m) => (
            <TouchableOpacity key={m._id || m.id} style={styles.mentionItem} onPress={() => insertMention(m.username)}>
              <Avatar url={m.avatar} name={m.username} size={26} />
              <Text style={[styles.mentionText, { color: theme.otherMessageText }]}>@{m.username}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.row}>
         <View style={[styles.inputPill, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937' }]}>
          <TouchableOpacity style={styles.pillIconBtn} onPress={handleAttach} disabled={disabled || !!pendingMedia || isRecording}>
            <Ionicons name="attach-outline" size={22} color={theme.otherUsernameColor} />
          </TouchableOpacity>

          {isRecording ? (
            <View style={styles.recordingRow}>
              <View style={styles.recordDot} />
              <Text style={{ color: theme.otherMessageText, fontWeight: '600', fontSize: 13 }}>Recording...</Text>
            </View>
          ) : (
            <TextInput
              value={inputMessage}
              onChangeText={handleChangeText}
              placeholder="Type your message..."
              placeholderTextColor={theme.otherUsernameColor}
              multiline
              editable={!disabled}
              style={[styles.textInput, { color: theme.otherMessageText }]}
            />
          )}

          {!isTyping && (
            <TouchableOpacity
              style={styles.pillIconBtn}
              onPress={() => setShowStickerPicker((v) => !v)}
              disabled={disabled || isRecording}
            >
              <Ionicons name={showStickerPicker ? 'happy' : 'happy-outline'} size={22} color={theme.otherUsernameColor} />
            </TouchableOpacity>
          )}

          {!isTyping && (
            <ChatVoiceRecorder
              theme={theme}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              onAudioReady={handleVoiceReady}
            />
          )}
        </View>

        {hasContent && (
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: theme.myMessageBubble }]}
            onPress={handleSend}
            disabled={disabled}
          >
            <Ionicons name="send" size={18} color={theme.myMessageText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: 0, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8, position: 'relative' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  inputPill: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', borderRadius: 22, paddingHorizontal: 6, paddingVertical: 4 },
  pillIconBtn: { paddingHorizontal: 6, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  textInput: { flex: 1, paddingHorizontal: 4, paddingVertical: 6, fontSize: 15, maxHeight: 110, minHeight: 30, textAlignVertical: 'center' },
  recordingRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 4 },
  recordDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  sendBtn: { width: 42, height: 42, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  mentionList: { position: 'absolute', left: 10, right: 10, bottom: '100%', marginBottom: 4, borderRadius: 12, borderWidth: 1, maxHeight: 180, overflow: 'hidden' },
  mentionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  mentionText: { fontSize: 13.5, fontWeight: '600', marginLeft: 10 },
});
