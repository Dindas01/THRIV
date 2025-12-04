import { 
    StyleSheet, 
    Text, 
    View, 
    TextInput, 
    TouchableOpacity, 
    ScrollView,
    KeyboardAvoidingView,
    Platform
  } from 'react-native';
  import { useState } from 'react';
  import { Ionicons } from '@expo/vector-icons';
  import { auth, db } from '../firebase';
  import { doc, setDoc } from 'firebase/firestore';
  
  export default function SetupGoalsScreen({ navigation }) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({
      sex: 'Masculino',
      age: '',
      weight: '',
      height: '',
      activityLevel: 'Moderado',
      goal: 'Manter Peso',
    });
  
    const sexOptions = ['Masculino', 'Feminino'];
    const activityOptions = [
      { name: 'Sedentário', desc: 'Pouco ou nenhum exercício' },
      { name: 'Leve', desc: '1-3 dias/semana' },
      { name: 'Moderado', desc: '3-5 dias/semana' },
      { name: 'Ativo', desc: '6-7 dias/semana' },
      { name: 'Muito Ativo', desc: 'Atleta/Treino 2x dia' },
    ];
    const goalOptions = ['Perder Peso', 'Manter Peso', 'Ganhar Músculo', 'Definição'];
  
    const activityLevels = {
      'Sedentário': 1.2,
      'Leve': 1.375,
      'Moderado': 1.55,
      'Ativo': 1.725,
      'Muito Ativo': 1.9,
    };
  
    const canProceed = () => {
      switch(step) {
        case 1: return data.sex;
        case 2: return data.age && data.weight && data.height;
        case 3: return data.activityLevel;
        case 4: return data.goal;
        default: return false;
      }
    };
  
    const calculateAndSave = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
  
        const ageNum = parseFloat(data.age);
        const weightNum = parseFloat(data.weight);
        const heightNum = parseFloat(data.height);
  
        // Mifflin-St Jeor Formula
        let bmr;
        if (data.sex === 'Masculino') {
          bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
        } else {
          bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
        }
  
        const activityMultiplier = activityLevels[data.activityLevel];
        let tdee = bmr * activityMultiplier;
        let calories = tdee;
        let proteinPerKg = 1.8;
  
        switch (data.goal) {
          case 'Perder Peso':
            calories = tdee * 0.8;
            proteinPerKg = 2.0;
            break;
          case 'Manter Peso':
            calories = tdee;
            proteinPerKg = 1.6;
            break;
          case 'Ganhar Músculo':
            calories = tdee * 1.15;
            proteinPerKg = 2.2;
            break;
          case 'Definição':
            calories = tdee * 0.85;
            proteinPerKg = 2.2;
            break;
        }
  
        const protein = Math.round(weightNum * proteinPerKg);
        const fat = Math.round((calories * 0.25) / 9);
        const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  
        // Save user data
        await setDoc(doc(db, 'users', user.uid), {
          age: ageNum,
          weight: weightNum,
          height: heightNum,
          sex: data.sex,
          activityLevel: data.activityLevel,
          goal: data.goal,
          setupCompleted: true,
        }, { merge: true });
  
        // Save goals
        await setDoc(doc(db, 'users', user.uid, 'profile', 'goals'), {
          caloriesGoal: Math.round(calories),
          proteinGoal: protein,
          carbsGoal: carbs,
          fatGoal: fat,
        });
  
        // Navigate to paywall
        navigation.replace('PaywallInitial');
      } catch (error) {
        console.error('Save error:', error);
      }
    };
  
    const handleNext = () => {
      if (step < 4) {
        setStep(step + 1);
      } else {
        calculateAndSave();
      }
    };
  
    const handleBack = () => {
      if (step > 1) {
        setStep(step - 1);
      }
    };
  
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          {step > 1 && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  s <= step && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>
  
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: Sex */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Qual é o teu sexo?</Text>
              <Text style={styles.stepSubtitle}>
                Isto ajuda a calcular as tuas necessidades calóricas
              </Text>
              <View style={styles.optionsGrid}>
                {sexOptions.map((sex) => (
                  <TouchableOpacity
                    key={sex}
                    style={[
                      styles.optionCard,
                      data.sex === sex && styles.optionCardActive,
                    ]}
                    onPress={() => setData({...data, sex})}
                  >
                    <Ionicons 
                      name={sex === 'Masculino' ? 'male' : 'female'} 
                      size={48} 
                      color={data.sex === sex ? '#FF6B35' : '#666666'} 
                    />
                    <Text style={[
                      styles.optionText,
                      data.sex === sex && styles.optionTextActive
                    ]}>
                      {sex}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
  
          {/* Step 2: Physical Stats */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Os teus dados físicos</Text>
              <Text style={styles.stepSubtitle}>
                Precisamos destes dados para calcular as tuas metas
              </Text>
  
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Idade</Text>
                <TextInput
                  style={styles.input}
                  value={data.age}
                  onChangeText={(text) => setData({...data, age: text})}
                  keyboardType="numeric"
                  placeholder="Ex: 25"
                  placeholderTextColor="#666666"
                />
              </View>
  
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Peso (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={data.weight}
                  onChangeText={(text) => setData({...data, weight: text})}
                  keyboardType="numeric"
                  placeholder="Ex: 70"
                  placeholderTextColor="#666666"
                />
              </View>
  
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Altura (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={data.height}
                  onChangeText={(text) => setData({...data, height: text})}
                  keyboardType="numeric"
                  placeholder="Ex: 175"
                  placeholderTextColor="#666666"
                />
              </View>
            </View>
          )}
  
          {/* Step 3: Activity Level */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Nível de atividade</Text>
              <Text style={styles.stepSubtitle}>
                Qual descreve melhor a tua rotina semanal?
              </Text>
              <View style={styles.listOptions}>
                {activityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.name}
                    style={[
                      styles.listOption,
                      data.activityLevel === option.name && styles.listOptionActive,
                    ]}
                    onPress={() => setData({...data, activityLevel: option.name})}
                  >
                    <View style={styles.listOptionContent}>
                      <Text style={[
                        styles.listOptionTitle,
                        data.activityLevel === option.name && styles.listOptionTitleActive
                      ]}>
                        {option.name}
                      </Text>
                      <Text style={[
                        styles.listOptionDesc,
                        data.activityLevel === option.name && styles.listOptionDescActive
                      ]}>
                        {option.desc}
                      </Text>
                    </View>
                    <Ionicons 
                      name={data.activityLevel === option.name ? 'checkmark-circle' : 'ellipse-outline'} 
                      size={24} 
                      color={data.activityLevel === option.name ? '#FF6B35' : '#666666'} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
  
          {/* Step 4: Goal */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Qual é o teu objetivo?</Text>
              <Text style={styles.stepSubtitle}>
                Vamos ajustar as tuas metas com base nisto
              </Text>
              <View style={styles.goalGrid}>
                {goalOptions.map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[
                      styles.goalCard,
                      data.goal === goal && styles.goalCardActive,
                    ]}
                    onPress={() => setData({...data, goal})}
                  >
                    <Ionicons 
                      name={
                        goal === 'Perder Peso' ? 'trending-down' :
                        goal === 'Manter Peso' ? 'remove' :
                        goal === 'Ganhar Músculo' ? 'trending-up' :
                        'flash'
                      }
                      size={32} 
                      color={data.goal === goal ? '#FF6B35' : '#666666'} 
                    />
                    <Text style={[
                      styles.goalCardText,
                      data.goal === goal && styles.goalCardTextActive
                    ]}>
                      {goal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
  
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>
              {step === 4 ? 'Calcular Metas' : 'Continuar'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 24,
      paddingBottom: 16,
    },
    backButton: {
      marginBottom: 16,
    },
    progressContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    progressDot: {
      flex: 1,
      height: 4,
      backgroundColor: '#1A1A1A',
      borderRadius: 2,
    },
    progressDotActive: {
      backgroundColor: '#FF6B35',
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 100,
    },
    stepContainer: {
      paddingTop: 24,
    },
    stepTitle: {
      fontSize: 28,
      fontWeight: '900',
      color: '#FFFFFF',
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    stepSubtitle: {
      fontSize: 16,
      color: '#AAAAAA',
      marginBottom: 32,
      lineHeight: 24,
    },
    optionsGrid: {
      flexDirection: 'row',
      gap: 16,
    },
    optionCard: {
      flex: 1,
      aspectRatio: 1,
      backgroundColor: 'rgba(26, 26, 26, 0.6)',
      borderRadius: 20,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    optionCardActive: {
      backgroundColor: 'rgba(255, 107, 53, 0.15)',
      borderColor: '#FF6B35',
    },
    optionText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#666666',
    },
    optionTextActive: {
      color: '#FF6B35',
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 10,
    },
    input: {
      backgroundColor: 'rgba(26, 26, 26, 0.6)',
      borderRadius: 16,
      padding: 18,
      fontSize: 18,
      color: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      fontWeight: '600',
    },
    listOptions: {
      gap: 12,
    },
    listOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(26, 26, 26, 0.6)',
      borderRadius: 16,
      padding: 16,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    listOptionActive: {
      backgroundColor: 'rgba(255, 107, 53, 0.15)',
      borderColor: '#FF6B35',
    },
    listOptionContent: {
      flex: 1,
    },
    listOptionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    listOptionTitleActive: {
      color: '#FF6B35',
    },
    listOptionDesc: {
      fontSize: 13,
      color: '#666666',
    },
    listOptionDescActive: {
      color: '#AAAAAA',
    },
    goalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    goalCard: {
      width: '48%',
      aspectRatio: 1.2,
      backgroundColor: 'rgba(26, 26, 26, 0.6)',
      borderRadius: 20,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    goalCardActive: {
      backgroundColor: 'rgba(255, 107, 53, 0.15)',
      borderColor: '#FF6B35',
    },
    goalCardText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#666666',
      textAlign: 'center',
    },
    goalCardTextActive: {
      color: '#FF6B35',
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 24,
      paddingBottom: 40,
      backgroundColor: '#000000',
    },
    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF6B35',
      paddingVertical: 18,
      borderRadius: 16,
      gap: 8,
    },
    nextButtonDisabled: {
      opacity: 0.4,
    },
    nextButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '900',
    },
  });