import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { checkEventService } from '@/services/reservationService';

type ScanMode = 'entry' | 'exit';

export default function ScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<ScanMode>('entry');
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
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
          result.success ? 'Ingreso registrado correctamente' : (result.reason ?? 'QR inválido'),
          [{ text: 'OK', onPress: () => setScanned(false) }],
          { cancelable: false }
        );
      } else {
        const result = await checkEventService.validateExit(data);
        Alert.alert(
          result.success ? 'Salida registrada' : 'Error al salir',
          result.success ? 'Salida registrada correctamente' : (result.reason ?? 'QR inválido'),
          [{ text: 'OK', onPress: () => setScanned(false) }],
          { cancelable: false }
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Error al procesar QR',
        [{ text: 'OK', onPress: () => setScanned(false) }],
        { cancelable: false }
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.darkRoot}>
        <View style={styles.center}>
          <ActivityIndicatorPlaceholder />
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.darkRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={[styles.permHero, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Escáner QR</Text>
        </View>
        <View style={styles.center}>
          <View style={styles.permIconBox}>
            <Ionicons name="camera-outline" size={36} color={Colors.accent} />
          </View>
          <Text style={styles.permTitle}>Acceso a la cámara</Text>
          <Text style={styles.permText}>Se necesita acceso a la cámara para escanear los códigos QR</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Permitir acceso</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark gradient overlay at top */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCamera}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>Escáner QR</Text>
            <Text style={styles.topSub}>{processing ? 'Procesando...' : 'Apunta al código QR'}</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>
      </View>

      {/* Viewfinder */}
      <View style={styles.viewfinderContainer}>
        <View style={styles.viewfinder}>
          <View style={styles.corner} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {processing && (
            <View style={styles.processingOverlay}>
              <Ionicons name="scan" size={40} color={Colors.accent} />
            </View>
          )}
        </View>
        <Text style={styles.scanHint}>
          {processing ? 'Procesando código...' : mode === 'entry' ? 'Modo entrada — escanea el QR del usuario' : 'Modo salida — escanea el QR del usuario'}
        </Text>
      </View>

      {/* Mode switch at bottom */}
      <View style={[styles.bottomOverlay, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'entry' && styles.modeBtnActive]}
            onPress={() => { setMode('entry'); setScanned(false); }}
          >
            <Ionicons name="enter-outline" size={18} color={mode === 'entry' ? '#fff' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.modeBtnText, mode === 'entry' && styles.modeBtnTextActive]}>Entrada</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'exit' && styles.modeBtnActive]}
            onPress={() => { setMode('exit'); setScanned(false); }}
          >
            <Ionicons name="exit-outline" size={18} color={mode === 'exit' ? '#fff' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.modeBtnText, mode === 'exit' && styles.modeBtnTextActive]}>Salida</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ActivityIndicatorPlaceholder() {
  return <Text style={{ color: '#fff' }}>Cargando cámara...</Text>;
}

const styles = StyleSheet.create({
  flex:               { flex: 1, backgroundColor: '#000' },
  darkRoot:           { flex: 1, backgroundColor: '#0A0A0A' },

  permHero:           { backgroundColor: Colors.header, paddingHorizontal: 20, paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn:            { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle:          { fontSize: 22, fontWeight: '800', color: '#fff' },

  center:             { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  permIconBox:        { width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  permTitle:          { fontSize: 20, fontWeight: '800', color: '#fff' },
  permText:           { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20 },
  permBtn:            { backgroundColor: Colors.accent, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  permBtnText:        { color: '#fff', fontWeight: '700', fontSize: 15 },

  topOverlay:         { position: 'absolute', top: 0, left: 0, right: 0, paddingBottom: 16 },
  topBar:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  backBtnCamera:      { width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  topCenter:          { flex: 1, alignItems: 'center' },
  topTitle:           { fontSize: 16, fontWeight: '800', color: '#fff' },
  topSub:             { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  viewfinderContainer:{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 },
  viewfinder:         { width: 240, height: 240, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  corner:             { position: 'absolute', width: 32, height: 32, top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderColor: Colors.accent, borderTopLeftRadius: 6 },
  cornerTR:           { top: 0, left: undefined, right: 0, borderTopWidth: 3, borderLeftWidth: 0, borderRightWidth: 3, borderTopRightRadius: 6, borderTopLeftRadius: 0 },
  cornerBL:           { top: undefined, bottom: 0, left: 0, borderTopWidth: 0, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 6, borderTopLeftRadius: 0 },
  cornerBR:           { top: undefined, bottom: 0, left: undefined, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 6, borderTopLeftRadius: 0 },
  processingOverlay:  { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 4 },
  scanHint:           { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },

  bottomOverlay:      { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 20 },
  modeSwitch:         { flexDirection: 'row', gap: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, padding: 6 },
  modeBtn:            { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  modeBtnActive:      { backgroundColor: Colors.accent },
  modeBtnText:        { color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 14 },
  modeBtnTextActive:  { color: '#fff' },
});
