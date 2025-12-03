import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';

export default function PaywallInitialScreen({ navigation }) {
  const handleSubscribe = () => {
    // TODO: Implementar payment com Stripe/RevenueCat
    alert('Payment Coming Soon! Por agora vai para Home.');
    navigation.navigate('MainTabs');
  };

  const handleTrial = () => {
    // Vai para Home em modo trial
    navigation.navigate('MainTabs');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/Logo_THRIV.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>LANÇAMENTO ESPECIAL</Text>
      </View>

      {/* Título */}
      <Text style={styles.title}>Junta-te aos primeiros!</Text>
      <Text style={styles.subtitle}>Oferta exclusiva para os primeiros 500 utilizadores</Text>

      {/* Oferta */}
      <View style={styles.offerCard}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>50% OFF</Text>
        </View>
        
        <Text style={styles.priceOriginal}>€12.99/mês</Text>
        <Text style={styles.priceDiscounted}>€6.50/mês</Text>
        <Text style={styles.priceSubtext}>durante os primeiros 2 meses</Text>
      </View>

      {/* Features */}
      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>Tracking ilimitado com IA</Text>
        </View>
        <View style={styles.feature}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>Acesso a profissionais certificados</Text>
        </View>
        <View style={styles.feature}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>Desafios semanais exclusivos</Text>
        </View>
        <View style={styles.feature}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>Histórico completo de progresso</Text>
        </View>
      </View>

      {/* Social Proof */}
      <Text style={styles.socialProof}>+2,000 pessoas já treinam connosco</Text>

      {/* Primary Button */}
      <TouchableOpacity 
        style={styles.buttonPrimary}
        onPress={handleSubscribe}
      >
        <Text style={styles.buttonPrimaryText}>Começar com 50% Desconto</Text>
        <Text style={styles.buttonPrimarySubtext}>€6.50/mês • Cancela quando quiseres</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Secondary Button - Trial */}
      <TouchableOpacity 
        style={styles.buttonSecondary}
        onPress={handleTrial}
      >
        <Text style={styles.buttonSecondaryText}>Experimentar 7 dias grátis</Text>
        <Text style={styles.buttonSecondarySubtext}>Sem cartão necessário</Text>
      </TouchableOpacity>

      {/* Fine Print */}
      <Text style={styles.finePrint}>
        Após os 2 meses, €12.99/mês. Cancela a qualquer momento.
      </Text>

      <StatusBar style="light" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  contentContainer: {
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  badge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
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
    marginBottom: 30,
  },
  offerCard: {
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  discountBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  priceOriginal: {
    fontSize: 18,
    color: '#666666',
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  priceDiscounted: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FF6B35',
    marginBottom: 4,
  },
  priceSubtext: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  socialProof: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonPrimary: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  buttonPrimarySubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
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
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B35',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  buttonSecondaryText: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  buttonSecondarySubtext: {
    color: '#AAAAAA',
    fontSize: 12,
  },
  finePrint: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
});