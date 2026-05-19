import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { checkEventService } from '@/services/reservationService';

type ScanMode = 'entry' | 'exit';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('entry');
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);
    try {
      if (mode === 'entry') {
        const result = await checkEventService.validateEntry(data);
        Alert.alert(
          result.success ? 'Entrada permitida' : 'Acceso denegado',
          result.message,
          [{ text: 'OK', onPress: () => setScanned(false) }],
          { cancelable: false }
        );
      } else {
        const result = await checkEventService.validateExit(data);
        Alert.alert(
          result.success ? 'Salida registrada' : 'Error al salir',
          result.message,
          [{ text: 'OK', onPress: () => setScanned(false) }],
          { cancelable: false }
        );
      }
    } catch (e: any) {
      Alert.alert(
        'Error',
        e.message ?? 'Error al procesar QR',
        [{ text: 'OK', onPress: () => setScanned(false) }],
        { cancelable: false }
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.permText}>Cargando cámara...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Escáner QR</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="camera-off-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.permText}>Se requiere acceso a la cámara</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Permitir cámara</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Escáner QR</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.viewfinder}>
          <View style={styles.corner} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <Text style={styles.hint}>
          {processing ? 'Procesando...' : 'Apunta al código QR del usuario'}
        </Text>

        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'entry' && styles.modeBtnActive]}
            onPress={() => { setMode('entry'); setScanned(false); }}
          >
            <Ionicons name="enter-outline" size={18} color={mode === 'entry' ? '#fff' : '#aaa'} />
            <Text style={[styles.modeBtnText, mode === 'entry' && styles.modeBtnTextActive]}>Entrada</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'exit' && styles.modeBtnActive]}
            onPress={() => { setMode('exit'); setScanned(false); }}
          >
            <Ionicons name="exit-outline" size={18} color={mode === 'exit' ? '#fff' : '#aaa'} />
            <Text style={[styles.modeBtnText, mode === 'exit' && styles.modeBtnTextActive]}>Salida</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:             { flex: 1, backgroundColor: '#000' },
  safe:             { flex: 1, backgroundColor: '#000' },
  overlay:          { flex: 1, justifyContent: 'space-between' },
  topBar:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 },
  backBtn:          { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  topTitle:         { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#fff' },
  viewfinder:       { alignSelf: 'center', width: 240, height: 240, position: 'relative' },
  corner:           { position: 'absolute', width: 28, height: 28, top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderColor: Colors.accent, borderTopLeftRadius: 4 },
  cornerTR:         { top: 0, left: undefined, right: 0, borderTopWidth: 3, borderLeftWidth: 0, borderRightWidth: 3, borderTopRightRadius: 4, borderTopLeftRadius: 0 },
  cornerBL:         { top: undefined, bottom: 0, left: 0, borderTopWidth: 0, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 4, borderTopLeftRadius: 0 },
  cornerBR:         { top: undefined, bottom: 0, left: undefined, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 4, borderTopLeftRadius: 0 },
  hint:             { color: '#ddd', textAlign: 'center', fontSize: 14, paddingHorizontal: 32 },
  modeSwitch:       { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingBottom: 32, paddingHorizontal: 32 },
  modeBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
  modeBtnActive:    { backgroundColor: Colors.accent },
  modeBtnText:      { color: '#aaa', fontWeight: '600', fontSize: 14 },
  modeBtnTextActive:{ color: '#fff' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32 },
  permText:         { color: '#fff', fontSize: 15, textAlign: 'center' },
  permBtn:          { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText:      { color: '#fff', fontWeight: '700', fontSize: 15 },
});
