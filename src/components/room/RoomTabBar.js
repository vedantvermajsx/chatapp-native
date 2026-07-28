import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { styles } from './styles';

const TABS = [
  { id: 'chats', label: 'Chats' },
  { id: 'explore', label: 'Explore' },
];

export default function RoomTabBar({ activeTab, setActiveTab, myChatsUnread }) {
  const { theme } = useTheme();
  const accent = theme.primary || theme.myMessageBubble || '#008080';
  const borderColor = theme.isLight ? '#e5e7eb' : '#374151';

  return (
    <View style={[styles.tabBar, { borderBottomColor: borderColor }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const badge = tab.id === 'chats' && myChatsUnread > 0 ? myChatsUnread : 0;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && { borderBottomColor: accent }]}
            onPress={() => setActiveTab(tab.id)}
          >
            <View style={styles.tabContent}>
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isActive ? accent : theme.otherMessageText,
                    opacity: isActive ? 1 : 0.8,
                  },
                ]}
              >
                {tab.label}
              </Text>
              {badge > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
