import { View, Text } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

export default function SidebarHeader() {
  const { theme } = useTheme();
  const borderColor = theme.isLight ? '#e5e7eb' : '#374151';

  return (
    <View style={[styles.sidebarHeader, { borderBottomColor: borderColor }]}>
      <View style={styles.sidebarHeaderInner}>
        <Text style={[styles.appName, { color: theme.otherMessageText }]}>GatherUp</Text>
      </View>
    </View>
  );
}
