import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { authService } from '@/services/authService';
import { User } from '@/domain/models';

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    authService.currentUser().then(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await authService.logout();
        },
      },
    ]);
  };

  const initial = user?.fullName?.charAt(0)?.toUpperCase() ?? '?';

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.header} />

      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.heroLabel}>Mi cuenta</Text>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName ?? 'Usuario'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* Info section */}
        <Text style={styles.sectionLabel}>Información personal</Text>
        <View style={styles.section}>
          <InfoRow icon="person-outline"  label="Nombre completo" value={user?.fullName ?? '—'} />
          <InfoRow icon="mail-outline"    label="Correo electrónico" value={user?.email ?? '—'} last />
        </View>

        <View style={styles.section}>
          <InfoRow icon="call-outline"    label="Teléfono" value={user?.phone ?? '—'} last />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut
            ? <ActivityIndicator color={Colors.error} />
            : <>
                <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, last }: { icon: any; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={17} color={Colors.accent} />
      </View>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: Colors.background },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center' },

  hero:              { backgroundColor: Colors.header, paddingHorizontal: 20, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroLabel:         { fontSize: 12, fontWeight: '600', color: Colors.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  profileRow:        { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar:            { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,107,53,0.3)' },
  avatarText:        { fontSize: 26, fontWeight: '800', color: '#fff' },
  profileInfo:       { flex: 1 },
  profileName:       { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  profileEmail:      { fontSize: 13, color: '#9CA3AF', marginTop: 2 },

  content:           { padding: 20, gap: 8 },
  sectionLabel:      { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4, marginLeft: 4 },
  section:           { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 8 },
  row:               { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 14 },
  rowLast:           { borderBottomWidth: 0 },
  rowIcon:           { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  rowContent:        { flex: 1 },
  rowLabel:          { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  rowValue:          { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },

  logoutBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#FEE2E2', marginTop: 8 },
  logoutBtnDisabled: { opacity: 0.5 },
  logoutText:        { fontSize: 15, color: Colors.error, fontWeight: '700' },
});
