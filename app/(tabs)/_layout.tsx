import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#1a1a1a' },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#444',
      }}
    >
      <Tabs.Screen
        name="tonight"
        options={{ title: 'Tonight', tabBarIcon: ({ color }) => <Ionicons name="flame" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="index"
        options={{ title: 'Map', tabBarIcon: ({ color }) => <Ionicons name="map" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} /> }}
      />
    </Tabs>
  );
}
