import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { authService } from '@/services/authService';
import { User } from '@/domain/models';

export default function PerfilScreen() {
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
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await authService.logout();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {user?.fullName?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.fullName ?? 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      <View style={styles.section}>
        <InfoRow icon="call-outline" label="Teléfono" value={user?.phone ?? '—'} />
        <InfoRow icon="mail-outline" label="Correo" value={user?.email ?? '—'} />
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut
            ? <ActivityIndicator color={Colors.error} />
            : (
              <>
                <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </>
            )
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={Colors.accent} />
      </View>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: Colors.background },
  header:            { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:             { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  avatarSection:     { alignItems: 'center', paddingVertical: 32 },
  avatar:            { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarInitial:     { fontSize: 32, fontWeight: '800', color: '#fff' },
  name:              { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  email:             { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  section:           { marginHorizontal: 16, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 16, overflow: 'hidden' },
  row:               { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon:           { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowLabel:          { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  rowValue:          { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  logoutBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  logoutBtnDisabled: { opacity: 0.5 },
  logoutText:        { fontSize: 16, color: Colors.error, fontWeight: '600' },
  center:            { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
