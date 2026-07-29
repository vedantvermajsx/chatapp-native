import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

export default function RoomSearch({ searchQuery, setSearchQuery, placeholder = 'Search...' }) {
  const { theme } = useTheme();

  return (
    <View style={styles.searchWrapper}>
      <View style={[styles.searchInputRow, { backgroundColor: theme.isLight ? '#f3f4f6' : '#1f2937' }]}>
        <Ionicons name="search" size={16} color={theme.otherUsernameColor} style={{ opacity: 0.7 }} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={theme.otherUsernameColor}
          style={[styles.searchInput, { color: theme.otherMessageText }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery?.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={theme.otherUsernameColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
