import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, insere o teu nome completo.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, insere o teu email.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Erro', 'Por favor, insere o teu telemóvel.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Erro', 'A password deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email.trim(),
        name: name.trim(),
        phone: phone.trim(),
        createdAt: serverTimestamp(),
      });

      // Navigate to PaywallInitial on success
      navigation.navigate('PaywallInitial');
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Ocorreu um erro ao criar a conta. Tenta novamente.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso. Tenta fazer login ou usa outro email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'O email inserido não é válido.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A password é muito fraca. Usa uma password mais forte.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Erro de ligação. Verifica a tua ligação à internet.';
      }
      
      Alert.alert('Erro ao Criar Conta', errorMessage);
    }
  };

  const handleAppleSignIn = async () => {
    Alert.alert('Em Breve', 'O login com Apple estará disponível em breve.');
  };

  const handleGoogleSignIn = () => {
    Alert.alert('Em Breve', 'O login com Google estará disponível em breve.');
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <View style={styles.backgroundGradient}>
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <View style={styles.backButtonWrapper}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonIcon}>←</Text>
              <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/Logo_THRIV.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Header */}
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Junta-te aos primeiros 500</Text>

          {/* Glass Card */}
          <View style={styles.glassCard}>
            {/* Form */}
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor="#888888"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Telemóvel (+351)"
              placeholderTextColor="#888888"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {/* Signup Button with Gradient */}
            <TouchableOpacity 
              style={styles.buttonContainer}
              onPress={handleSignup}
              activeOpacity={0.8}
            >
              <View style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Criar Conta</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou continuar com</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialButtonsContainer}>
            {/* Apple Sign In */}
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleAppleSignIn}
              activeOpacity={0.7}
            >
              <View style={styles.socialButtonContent}>
                <Text style={styles.appleIcon}></Text>
                <Text style={styles.socialButtonText}>Apple</Text>
              </View>
            </TouchableOpacity>

            {/* Google Sign In */}
            <TouchableOpacity 
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.7}
            >
              <View style={styles.socialButtonContent}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.socialButtonText}>Google</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              Já tens conta? <Text style={styles.loginLinkBold}>Entrar</Text>
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.terms}>
            Ao criar conta, aceitas os{' '}
            <Text style={styles.termsLink}>Termos de Serviço</Text>
            {' '}e{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text>
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradientCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF6B35',
    opacity: 0.15,
    blur: 60,
  },
  gradientCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#FF6B35',
    opacity: 0.1,
    blur: 80,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButtonWrapper: {
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(26, 26, 26, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButtonIcon: {
    color: '#FF6B35',
    fontSize: 16,
    marginRight: 6,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  glassCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#888888',
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '500',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appleIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  googleIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginBottom: 16,
  },
  loginLinkText: {
    color: '#AAAAAA',
    fontSize: 15,
    fontWeight: '500',
  },
  loginLinkBold: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  terms: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  termsLink: {
    color: '#FF6B35',
    fontWeight: '600',
  },
});