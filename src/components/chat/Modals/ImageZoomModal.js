import React from 'react';
import { View, TouchableOpacity, Modal, Image, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toDisplayUrl } from '../../../utils/imageUrl';

export default function ImageZoomModal({ visible, url, onClose }) {
  const { width, height } = Dimensions.get('window');
  if (!url) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Image
          source={{ uri: toDisplayUrl(url) }}
          style={{ width: width * 0.92, height: height * 0.7 }}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999 },
});
