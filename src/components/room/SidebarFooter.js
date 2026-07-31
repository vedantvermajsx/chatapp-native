import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

export default function SidebarFooter({ navigation }) {
  const { user } = useAuth();
  const { theme } = useTheme();

  return (
    <View style={[styles.sidebarFooter]}>
      <TouchableOpacity
        style={styles.profileBtn}
        onPress={() => navigation?.navigate('Settings')}
      >
        <Avatar url={user?.avatar} name={user?.username} size={32} />
        <Text style={[styles.footerUsername, { color: theme.otherMessageText }]} numberOfLines={1}>
          {user?.username || 'Guest'}
        </Text>
      </TouchableOpacity>
      <View style={styles.footerActionsRow}>
        <TouchableOpacity style={styles.footerIconBtn} onPress={() => navigation?.navigate('Settings')}>
          <Ionicons name="settings-outline" size={22} color={theme.otherUsernameColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
