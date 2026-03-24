import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useAuthStore } from '@/src/store/authStore';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const { loginWithBackend, registerWithBackend } = useAuthStore();

  const handleAuth = async () => {
    if (!login || !password || (!isLogin && !fullName)) {
      Alert.alert("Xatolik", "Barcha maydonlarni to'ldiring");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await loginWithBackend(login, password);
      } else {
        await registerWithBackend(fullName, login, password);
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert("Auth xatoligi", error?.message || "Xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.logoWrap}>
              <View style={styles.logo}>
                <Text style={styles.logoLetter}>G</Text>
              </View>
              <View style={styles.logoAccent} />
            </View>
            <Text style={styles.title}>GoBron Admin</Text>
            <Text style={styles.subtitle}>Maydon egasi paneli</Text>

            <View style={styles.form}>
              {!isLogin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>To'liq ism</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ismingizni kiriting"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Login</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Loginingizni kiriting"
                  value={login}
                  onChangeText={setLogin}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Parol</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Parolingizni kiriting"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <Pressable
                style={({ pressed }) => [styles.authBtn, pressed && { opacity: 0.85 }]}
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.authText}>
                    {isLogin ? "Kirish" : "Ro'yxatdan o'tish"}
                  </Text>
                )}
              </Pressable>

              <Pressable 
                onPress={() => setIsLogin(!isLogin)}
                style={styles.toggleBtn}
              >
                <Text style={styles.toggleText}>
                  {isLogin ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting" : "Hisobingiz bormi? Kiring"}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.hint}>Faqat ro'yxatdan o'tgan maydon egalari uchun</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  logoWrap: {
    position: 'relative',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  logoLetter: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
  },
  logoAccent: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.pending,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  form: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 48,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
  },
  authBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...shadow.md,
  },
  authText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleBtn: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
