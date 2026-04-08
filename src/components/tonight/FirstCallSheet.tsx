import { useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function FirstCallSheet({ visible, onDismiss }: Props) {
  const sheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (visible) sheetRef.current?.expand();
    else sheetRef.current?.close();
  }, [visible]);

  const handleChange = useCallback((index: number) => {
    if (index === -1) onDismiss();
  }, [onDismiss]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['48%']}
      enablePanDownToClose
      onChange={handleChange}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.iconRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="radio-button-on" size={28} color="#3B82F6" />
          </View>
        </View>
        <Text style={styles.title}>Making a call</Text>
        <Text style={styles.body}>
          You get 10 calls per night. When you tap "Call It" on a venue, you're predicting it'll heat up before 2AM.
        </Text>
        <Text style={styles.body}>
          Calls made early — before a venue gets crowded — score 2x points. You're scored at 2AM on heat against historical averages.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onDismiss}>
          <Text style={styles.buttonText}>Got it</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: '#111' },
  handle: { backgroundColor: '#2a2a2a', width: 36 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, gap: 14 },
  iconRow: { alignItems: 'center', marginBottom: 4 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F615',
    borderWidth: 1,
    borderColor: '#3B82F640',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  body: { color: '#777', fontSize: 15, lineHeight: 22 },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
