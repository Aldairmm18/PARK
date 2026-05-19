import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/colors';
import { ErrorMessage } from '@/components/ErrorMessage';
import { authService } from '@/services/authService';
import { ScreenState } from '@/domain/models';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<ScreenState<null>>({ status: 'idle' });

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setState({ status: 'error', error: 'Completa todos los campos' });
      return;
    }
    setState({ status: 'loading' });
    try {
      await authService.login(email.trim(), password);
      // La redirección la maneja el RootLayout
    } catch (e: any) {
      setState({ status: 'error', error: e.message ?? 'Credenciales incorrectas' });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>ParkNow</Text>
          <Text style={styles.subtitle}>Estaciona sin perder tiempo</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="tu@email.com"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
          />

          {state.status === 'error' && (
            <ErrorMessage
              message={state.error!}
              onDismiss={() => setState({ status: 'idle' })}
            />
          )}

          <TouchableOpacity
            style={[styles.btn, state.status === 'loading' && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={state.status === 'loading'}
          >
            {state.status === 'loading'
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Iniciar sesión</Text>
            }
          </TouchableOpacity>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.linkBtn}>
              <Text style={styles.linkText}>¿No tienes cuenta? <Text style={styles.linkAccent}>Regístrate</Text></Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: Colors.header },
  container:  { flexGrow: 1 },
  header:     { paddingTop: 80, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center' },
  logo:       { fontSize: 40, fontWeight: '800', color: Colors.accent, letterSpacing: -1 },
  subtitle:   { fontSize: 14, color: '#9CA3AF', marginTop: 6 },
  form:       { flex: 1, backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, gap: 8 },
  label:      { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginTop: 8 },
  input:      { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary, marginBottom: 4 },
  btn:        { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn:    { alignItems: 'center', paddingVertical: 12 },
  linkText:   { fontSize: 14, color: Colors.textSecondary },
  linkAccent: { color: Colors.accent, fontWeight: '600' },
});
