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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<ScreenState<null>>({ status: 'idle' });

  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim() || !password) {
      setState({ status: 'error', error: 'Completa todos los campos' });
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      setState({ status: 'error', error: 'Formato de correo inválido' });
      return;
    }
    if (password.length < 6) {
      setState({ status: 'error', error: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    setState({ status: 'loading' });
    try {
      await authService.register({ fullName: fullName.trim(), phone: phone.trim(), email: email.trim(), password });
    } catch (e: any) {
      setState({ status: 'error', error: e.message ?? 'Error al registrarse' });
    }
  };

  const fieldColors = { borderBottomWidth: 1, borderBottomColor: Colors.border };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>ParkNow</Text>
          <Text style={styles.subtitle}>Crea tu cuenta gratis</Text>
        </View>

        <View style={styles.form}>
          {([
            ['Nombre completo', fullName, setFullName, 'words', 'off', false],
            ['Teléfono', phone, setPhone, 'phone-pad', 'off', false],
            ['Correo electrónico', email, setEmail, 'email-address', 'none', false],
            ['Contraseña', password, setPassword, 'default', 'off', true],
          ] as const).map(([label, val, setter, kbType, autoComplete, secure]) => (
            <View key={label}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={val}
                onChangeText={setter as any}
                keyboardType={kbType as any}
                autoCapitalize={kbType === 'email-address' ? 'none' : 'sentences'}
                autoComplete={autoComplete as any}
                secureTextEntry={secure}
                placeholder={label}
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          ))}

          {state.status === 'error' && (
            <ErrorMessage message={state.error!} onDismiss={() => setState({ status: 'idle' })} />
          )}

          <TouchableOpacity
            style={[styles.btn, state.status === 'loading' && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={state.status === 'loading'}
          >
            {state.status === 'loading'
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Crear cuenta</Text>
            }
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.linkBtn}>
              <Text style={styles.linkText}>¿Ya tienes cuenta? <Text style={styles.linkAccent}>Inicia sesión</Text></Text>
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
  header:     { paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24, alignItems: 'center' },
  logo:       { fontSize: 36, fontWeight: '800', color: Colors.accent, letterSpacing: -1 },
  subtitle:   { fontSize: 14, color: '#9CA3AF', marginTop: 6 },
  form:       { flex: 1, backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, gap: 4 },
  label:      { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginTop: 12 },
  input:      { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary, marginBottom: 4 },
  btn:        { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn:    { alignItems: 'center', paddingVertical: 12 },
  linkText:   { fontSize: 14, color: Colors.textSecondary },
  linkAccent: { color: Colors.accent, fontWeight: '600' },
});
