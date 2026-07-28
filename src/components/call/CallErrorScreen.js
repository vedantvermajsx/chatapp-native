import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCall } from '../../contexts/CallContext';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

export default function CallErrorScreen() {
  const { callError, setCallError } = useCall();
  const { theme } = useTheme();

  if (!callError) return null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={() => setCallError(null)}>
      <View style={styles.errorBackdrop}>
        <View style={[styles.errorCard, { backgroundColor: theme.background, borderColor: theme.isLight ? '#fecaca' : '#7f1d1d' }]}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="call" size={26} color="#f87171" style={{ transform: [{ rotate: '135deg' }] }} />
          </View>
          <Text style={[styles.errorTitle, { color: theme.otherMessageText }]}>Call Failed</Text>
          <Text style={[styles.errorMessage, { color: theme.otherMessageText }]}>{callError}</Text>
          <TouchableOpacity style={styles.errorDismissBtn} onPress={() => setCallError(null)}>
            <Text style={styles.errorDismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
