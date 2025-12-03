import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, insere o teu email.');
      return;
    }
    if (!password) {
      Alert.alert('Erro', 'Por favor, insere a tua password.');
      return;
    }

    try {
      // Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, email.trim(), password);
      
      // Navigate to MainTabs on successful login
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Ocorreu um erro ao fazer login. Tenta novamente.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Não existe nenhuma conta com este email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Password incorreta. Tenta novamente.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'O email inserido não é válido.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email ou password incorretos.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Erro de ligação. Verifica a tua ligação à internet.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas falhadas. Tenta novamente mais tarde.';
      }
      
      Alert.alert('Erro ao Fazer Login', errorMessage);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert('Em Breve', 'O login com Google estará disponível em breve.');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/Logo_THRIV.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Título */}
        <Text style={styles.title}>Bem-vindo de volta!</Text>
        <Text style={styles.subtitle}>Login na tua conta THRIV</Text>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Forgot Password */}
          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => alert('Esqueci password - Coming Soon')}
          >
            <Text style={styles.forgotPasswordText}>Esqueci a password</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity 
            style={styles.button}
            onPress={handleLogin}
          >
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
          >
            <Text style={styles.googleButtonText}>🔐 Continuar com Google</Text>
          </TouchableOpacity>

          {/* Signup Link */}
          <TouchableOpacity 
            style={styles.signupLink}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.signupLinkText}>
              Não tens conta? <Text style={styles.signupLinkBold}>Criar conta</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <StatusBar style="light" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333333',
  },
  dividerText: {
    color: '#666666',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  signupLinkText: {
    color: '#AAAAAA',
    fontSize: 14,
  },
  signupLinkBold: {
    color: '#FF6B35',
    fontWeight: '700',
  },
});