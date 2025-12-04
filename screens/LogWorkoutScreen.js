import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function LogWorkoutScreen({ navigation }) {
  const [selectedType, setSelectedType] = useState('');
  const [duration, setDuration] = useState('');
  const [estimatedCalories, setEstimatedCalories] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(-100)).current;
  const caloriesAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Auto-calculate calories when duration or type changes
    if (duration && selectedType) {
      const mins = parseInt(duration);
      if (!isNaN(mins) && mins > 0) {
        const calories = calculateCalories(selectedType, mins);
        setEstimatedCalories(calories);
        
        // Animate calories number
        Animated.spring(caloriesAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }).start(() => {
          caloriesAnim.setValue(0);
        });
      }
    } else {
      setEstimatedCalories(0);
    }
  }, [duration, selectedType]);

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 60,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  };

  // Calories estimation based on workout type and duration
  // Values are approximate kcal/min for average adult
  const calculateCalories = (type, minutes) => {
    const caloriesPerMin = {
      cardio: 10, // Running, cycling
      strength: 6, // Weight training
      flexibility: 3, // Yoga, stretching
      sports: 8, // Football, basketball
      other: 5, // General activity
    };

    return Math.round((caloriesPerMin[type] || 5) * minutes);
  };

  const workoutTypes = [
    { id: 'cardio', label: 'Cardio', icon: 'bicycle-outline', color: '#FF6B35' },
    { id: 'strength', label: 'Musculação', icon: 'barbell-outline', color: '#4ECDC4' },
    { id: 'flexibility', label: 'Flexibilidade', icon: 'body-outline', color: '#FFD93D' },
    { id: 'sports', label: 'Desporto', icon: 'football-outline', color: '#9B59B6' },
    { id: 'other', label: 'Outro', icon: 'fitness-outline', color: '#AAAAAA' },
  ];

  const handleSaveWorkout = async () => {
    if (!selectedType) {
      showToast('Seleciona o tipo de treino');
      return;
    }

    if (!duration || parseInt(duration) <= 0) {
      showToast('Insere a duração do treino');
      return;
    }

    try {
      setSaving(true);
      const userId = auth.currentUser?.uid;
      
      const workoutData = {
        type: selectedType,
        duration: parseInt(duration),
        caloriesBurned: estimatedCalories,
        timestamp: new Date(),
      };

      // Save workout
      await addDoc(collection(db, `users/${userId}/workouts`), workoutData);

      showToast('Treino registado com sucesso');
      
      // Navigate back after short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1000);

    } catch (error) {
      console.error('Error saving workout:', error);
      showToast('Erro ao guardar treino');
      setSaving(false);
    }
  };

  const caloriesScale = caloriesAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Toast Notification */}
        {toastVisible && (
          <Animated.View
            style={[
              styles.toast,
              {
                transform: [{ translateY: toastAnim }],
              },
            ]}
          >
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registar Treino</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Workout Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de Treino</Text>
              <View style={styles.typeGrid}>
                {workoutTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeCard,
                      selectedType === type.id && styles.typeCardActive,
                      selectedType === type.id && { borderColor: type.color },
                    ]}
                    onPress={() => setSelectedType(type.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.typeIcon,
                        selectedType === type.id && { backgroundColor: `${type.color}20` },
                      ]}
                    >
                      <Ionicons
                        name={type.icon}
                        size={28}
                        color={selectedType === type.id ? type.color : '#666666'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.typeLabel,
                        selectedType === type.id && styles.typeLabelActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Duração</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="time-outline" size={24} color="#FF6B35" />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 45"
                  placeholderTextColor="#666666"
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={styles.inputUnit}>minutos</Text>
              </View>
            </View>

            {/* Estimated Calories */}
            {estimatedCalories > 0 && (
              <Animated.View
                style={[
                  styles.caloriesCard,
                  { transform: [{ scale: caloriesScale }] },
                ]}
              >
                <Ionicons name="flame" size={32} color="#FF6B35" />
                <View style={styles.caloriesContent}>
                  <Text style={styles.caloriesLabel}>Calorias estimadas</Text>
                  <Text style={styles.caloriesValue}>{estimatedCalories} kcal</Text>
                </View>
              </Animated.View>
            )}

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#4ECDC4" />
              <Text style={styles.infoText}>
                As calorias são calculadas automaticamente com base no tipo e duração do treino
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!selectedType || !duration || saving) && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveWorkout}
            disabled={!selectedType || !duration || saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <Text style={styles.saveButtonText}>A guardar...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Guardar Treino</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardAvoid: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    zIndex: 1000,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  typeCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    margin: '1.16%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeCardActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 2,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAAAAA',
    textAlign: 'center',
  },
  typeLabelActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  inputUnit: {
    fontSize: 16,
    color: '#AAAAAA',
    marginLeft: 8,
  },
  caloriesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    padding: 20,
    marginBottom: 24,
  },
  caloriesContent: {
    marginLeft: 16,
    flex: 1,
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.2)',
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#AAAAAA',
    marginLeft: 12,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#333333',
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});