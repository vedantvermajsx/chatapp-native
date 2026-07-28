import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

const BAR_COUNT = 28;

function seededWaveform(seedStr, count) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  const bars = [];
  for (let i = 0; i < count; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const rand = (seed % 1000) / 1000;
    bars.push(0.25 + rand * 0.7);
  }
  return bars;
}

function resampleWaveform(waveform, count) {
  if (!waveform || waveform.length === 0) return null;
  if (waveform.length === count) return waveform;
  const out = [];
  for (let i = 0; i < count; i++) {
    const srcIdx = Math.floor((i / count) * waveform.length);
    out.push(waveform[srcIdx]);
  }
  return out;
}

export function AudioContent({ msg, isOwn, textColor }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [durationSec, setDurationSec] = useState(msg.media.duration || 0);
  const soundRef = useRef(null);

  const bars =
    resampleWaveform(msg.media.waveform, BAR_COUNT) ||
    seededWaveform(msg.media.url || msg.id || 'voice', BAR_COUNT);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const onPlaybackStatus = (status) => {
    if (!status.isLoaded) return;
    if (status.durationMillis) setDurationSec(Math.round(status.durationMillis / 1000));
    if (status.durationMillis) setProgress(status.positionMillis / status.durationMillis);
    if (status.didJustFinish) {
      setIsPlaying(false);
      setProgress(0);
      soundRef.current?.setPositionAsync(0).catch(() => {});
    }
  };

  const togglePlay = async () => {
    if (msg.isPending) return;
    try {
      if (!soundRef.current) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: msg.media.url },
          { shouldPlay: true },
          onPlaybackStatus
        );
        soundRef.current = newSound;
        setIsPlaying(true);
        return;
      }
      const status = await soundRef.current.getStatusAsync();
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      setIsPlaying(false);
    }
  };

  const iconColor = textColor;
  const filledBars = Math.round(progress * BAR_COUNT);

  const durationLabel = () => {
    const s = Math.max(0, durationSec || 0);
    const m = Math.floor(s / 60);
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <View style={styles.audioWrap}>
      <TouchableOpacity onPress={togglePlay} style={[styles.audioPlayBtn, { backgroundColor: isOwn ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)' }]}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={iconColor} style={!isPlaying ? { marginLeft: 2 } : null} />
      </TouchableOpacity>

      <View style={styles.audioBarsRow}>
        {bars.map((h, i) => (
          <View
            key={i}
            style={[
              styles.audioBar,
              {
                height: 4 + h * 20,
                backgroundColor: iconColor,
                opacity: i < filledBars ? 1 : 0.35,
              },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.audioDuration, { color: iconColor }]}>{durationLabel()}</Text>
    </View>
  );
}
