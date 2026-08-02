import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { showToast, showApiError } from '../../utils/toast';
import Avatar from '../common/Avatar';
import { useTheme } from '../../contexts/ThemeContext';
import roomService from '../../services/room.service';
import StickerPicker from './StickerPicker';
import ChatVoiceRecorder from './ChatVoiceRecorder';
import ChatMediaPreview from './ChatMediaPreview';
import { styles } from './styles';

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
  replyingTo,
  onCancelReply,
}) {
  const { theme } = useTheme();
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mentionDebounce = useRef(null);
  const MAX_CHARS = 1000;

  const formatRecordingTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

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
      let perm = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access to attach media.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
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
      showApiError(e, 'Could not attach media');
    }
  };

  const handleCamera = async () => {
    try {
      let camPerm = await ImagePicker.getCameraPermissionsAsync();
      if (!camPerm.granted) {
        camPerm = await ImagePicker.requestCameraPermissionsAsync();
      }
      if (!camPerm.granted) {
        Alert.alert('Permission needed', 'Please allow camera access to take a photo or video.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        videoMaxDuration: 60,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      const type = asset.mimeType?.startsWith('video/') || asset.type === 'video' ? 'video' : 'image';
      onFileSelect?.({
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
        type,
      });
    } catch (e) {
      showApiError(e, 'Could not use camera');
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
    <View style={[styles.inputWrap, { backgroundColor: theme.background, borderTopColor: theme.isLight ? '#cbd5e0' : '#4a5568' }]}>
      {disabled && <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, opacity: 0.6, zIndex: 5 }]} />}

      <ChatMediaPreview media={pendingMedia} onRemove={onRemoveMedia} theme={theme} />


      {replyingTo && (
        <View
          style={[
            styles.replyPreviewBar,
            { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937', borderLeftColor: theme.myMessageBubble || theme.primary || '#008080' },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.replyPreviewName, { color: theme.myMessageBubble || theme.primary || '#008080' }]} numberOfLines={1}>
              Replying to {replyingTo.username || 'message'}
            </Text>
            <Text style={[styles.replyPreviewText, { color: theme.otherMessageText }]} numberOfLines={1}>
              {replyingTo.media
                ? { image: 'Photo', video: 'Video', audio: 'Voice message', sticker: 'Sticker', gif: 'GIF' }[replyingTo.media.type] || 'Attachment'
                : replyingTo.text || 'Message'}
            </Text>
          </View>
          <TouchableOpacity onPress={onCancelReply} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name="close" size={18} color={theme.otherUsernameColor} />
          </TouchableOpacity>
        </View>
      )}

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

      <View style={styles.inputRow}>
         <View style={[styles.inputPill, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937' }]}>
          {!pendingMedia && (
            <TouchableOpacity style={styles.pillIconBtn} onPress={handleAttach} disabled={disabled || isRecording}>
              <Ionicons name="attach-outline" size={24} color={theme.otherUsernameColor} />
            </TouchableOpacity>
          )}

          {!pendingMedia && (
            <TouchableOpacity style={styles.pillIconBtn} onPress={handleCamera} disabled={disabled || isRecording}>
              <Ionicons name="camera-outline" size={22} color={theme.otherUsernameColor} />
            </TouchableOpacity>
          )}

          {isRecording ? (
            <View style={styles.recordingRow}>
              <View style={styles.recordDot} />
              <Text style={{ color: theme.otherMessageText, fontWeight: '600', fontSize: 13 }}>
                Recording ({formatRecordingTime(recordingDuration)})...
              </Text>
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
              <MaterialCommunityIcons
                name={'sticker-emoji'}
                size={22}
                color={theme.otherUsernameColor}
              />
            </TouchableOpacity>
          )}

          {!isTyping && (
            <ChatVoiceRecorder
              theme={theme}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              onAudioReady={handleVoiceReady}
              onDurationChange={setRecordingDuration}
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