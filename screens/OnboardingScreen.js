import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useState, useRef } from 'react';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    title: 'Track',
    subtitle: 'Inteligente e Simples',
    description: 'Scanneia a tua comida com IA. Regista treinos em segundos. Vê o teu progresso em tempo real.',
    image: require('../assets/growth.png')
  },
  {
    id: 2,
    title: 'Connect',
    subtitle: 'Profissionais Certificados',
    description: 'Acesso direto a nutricionistas e personal trainers portugueses. Consultas online quando precisas.',
    image: require('../assets/conference.png')
  },
  {
    id: 3,
    title: 'Transform',
    subtitle: 'Resultados Reais',
    description: 'Junta-te a desafios motivadores. Comunidade ativa que te mantém focado nos objetivos.',
    image: require('../assets/award.png')
  }
];

export default function OnboardingScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef(null);

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(slideIndex);
  };

  const goToNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentSlide + 1),
        animated: true
      });
    }
  };

  const handleGetStarted = () => {
    navigation.navigate('Signup');
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <View style={styles.backgroundGradient}>
        <View style={styles.gradientCircle1} />
        <View style={styles.gradientCircle2} />
        <View style={styles.gradientCircle3} />
      </View>

      {/* Logo pequeno top */}
      <View style={styles.headerLogo}>
        <Image 
          source={require('../assets/Logo_THRIV.png')} 
          style={styles.logoSmall}
          resizeMode="contain"
        />
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            {/* Glass Card for Image */}
            <View style={styles.imageContainer}>
              <View style={styles.glassCard}>
                <Image 
                  source={slide.image}
                  style={styles.slideImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Content Card */}
            <View style={styles.contentCard}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots indicator */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentSlide === index && styles.dotActive
            ]}
          />
        ))}
      </View>

      {/* Button */}
      <View style={styles.buttonContainer}>
        {currentSlide === slides.length - 1 ? (
          <TouchableOpacity 
            style={styles.buttonPrimary}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <View style={styles.buttonGradient}>
              <Text style={styles.buttonPrimaryText}>Começar</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.buttonSecondary}
            onPress={goToNextSlide}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonSecondaryText}>Seguinte →</Text>
          </TouchableOpacity>
        )}
      </View>

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
    top: 100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF6B35',
    opacity: 0.15,
  },
  gradientCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#FF6B35',
    opacity: 0.1,
  },
  gradientCircle3: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -150,
    marginTop: -150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FF6B35',
    opacity: 0.05,
  },
  headerLogo: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoSmall: {
    width: 80,
    height: 80,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  imageContainer: {
    marginBottom: 40,
  },
  glassCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.4)',
    borderRadius: 32,
    padding: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  slideImage: {
    width: 140,
    height: 140,
  },
  contentCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.4)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FF6B35',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  buttonPrimary: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 16,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  buttonSecondaryText: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});