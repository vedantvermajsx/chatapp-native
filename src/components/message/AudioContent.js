import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';

const BAR_COUNT = 28;
const POLL_MS = 100; 

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

function formatDuration(totalSeconds) {
  const s = Math.floor(Math.max(0, totalSeconds || 0));
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

export function AudioContent({ msg, isOwn, textColor }) {
  const url = msg.media.url;
  const player = useAudioPlayer(url || '');

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(msg.media.duration || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const d = player.duration || 0;
      const t = player.currentTime || 0;
      const playing = player.playing;
      setDuration((prev) => (Math.abs(prev - d) > 0.1 ? d : prev));
      setCurrentTime(t);
      setIsPlaying(playing);
    };

    intervalRef.current = setInterval(tick, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [player]);

  const durationSec = duration || msg.media.duration || 0;
  const progress = durationSec > 0 ? Math.min(1, currentTime / durationSec) : 0;
  const isFinished = !isPlaying && durationSec > 0 && currentTime >= durationSec - 0.3;
  const filledBars = Math.round(progress * BAR_COUNT);

  const bars =
    resampleWaveform(msg.media.waveform, BAR_COUNT) ||
    seededWaveform(msg.media.url || msg.id || 'voice', BAR_COUNT);

  const togglePlay = () => {
    if (msg.isPending) return;
    if (isPlaying) {
      player.pause();
    } else if (isFinished) {
      player.seekTo(0);
      player.play();
    } else {
      player.play();
    }
  };

  const iconColor = textColor;

  return (
    <View style={styles.audioWrap}>
      <TouchableOpacity
        onPress={togglePlay}
        style={[styles.audioPlayBtn, { backgroundColor: isOwn ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)' }]}
      >
        <Ionicons
          name={isFinished ? 'refresh' : isPlaying ? 'pause' : 'play'}
          size={16}
          color={iconColor}
          style={(!isPlaying && !isFinished) ? { marginLeft: 2 } : null}
        />
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

      <Text style={[styles.audioDuration, { color: iconColor }]}>
        {(isPlaying || (currentTime > 0 && !isFinished))
          ? formatDuration(currentTime)
          : formatDuration(durationSec)}
      </Text>
    </View>
  );
}
