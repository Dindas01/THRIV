import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [autoCalculated, setAutoCalculated] = useState(false);
  
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    age: '',
    weight: '',
    height: '',
    sex: 'Masculino',
    activityLevel: 'Moderado',
    goal: 'Manter Peso',
  });

  const [goals, setGoals] = useState({
    caloriesGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 250,
    fatGoal: 65,
  });

  const sexOptions = ['Masculino', 'Feminino'];
  const activityLevels = {
    'Sedentário': 1.2,
    'Leve': 1.375,
    'Moderado': 1.55,
    'Ativo': 1.725,
    'Muito Ativo': 1.9,
  };
  const goalOptions = ['Perder Peso', 'Manter Peso', 'Ganhar Músculo', 'Definição'];

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (editing && userData.age && userData.weight && userData.height) {
      calculateGoalsAuto();
    }
  }, [userData.age, userData.weight, userData.height, userData.sex, userData.activityLevel, userData.goal]);

  const loadProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({
          name: data.name || '',
          email: user.email || '',
          age: data.age?.toString() || '',
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
          sex: data.sex || 'Masculino',
          activityLevel: data.activityLevel || 'Moderado',
          goal: data.goal || 'Manter Peso',
        });
      }

      const goalsDoc = await getDoc(doc(db, 'users', user.uid, 'profile', 'goals'));
      if (goalsDoc.exists()) {
        const goalsData = goalsDoc.data();
        setGoals({
          caloriesGoal: goalsData.caloriesGoal || 2000,
          proteinGoal: goalsData.proteinGoal || 150,
          carbsGoal: goalsData.carbsGoal || 250,
          fatGoal: goalsData.fatGoal || 65,
        });
      }
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGoalsAuto = () => {
    const { age, weight, height, sex, activityLevel, goal } = userData;
    if (!age || !weight || !height) return;

    const ageNum = parseFloat(age);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    let bmr;
    if (sex === 'Masculino') {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
    } else {
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    }

    const activityMultiplier = activityLevels[activityLevel] || 1.55;
    let tdee = bmr * activityMultiplier;
    let calories = tdee;
    let proteinPerKg = 1.8;

    switch (goal) {
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

    setGoals({
      caloriesGoal: Math.round(calories),
      proteinGoal: protein,
      carbsGoal: carbs,
      fatGoal: fat,
    });

    setAutoCalculated(true);
    setTimeout(() => setAutoCalculated(false), 2000);
  };

  const saveProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await setDoc(doc(db, 'users', user.uid), {
        name: userData.name,
        age: parseInt(userData.age) || null,
        weight: parseFloat(userData.weight) || null,
        height: parseFloat(userData.height) || null,
        sex: userData.sex,
        activityLevel: userData.activityLevel,
        goal: userData.goal,
        email: userData.email,
      }, { merge: true });

      await setDoc(doc(db, 'users', user.uid, 'profile', 'goals'), {
        caloriesGoal: parseInt(goals.caloriesGoal),
        proteinGoal: parseInt(goals.proteinGoal),
        carbsGoal: parseInt(goals.carbsGoal),
        fatGoal: parseInt(goals.fatGoal),
      }, { merge: true });

      setEditing(false);
      loadProfile();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Tens a certeza que queres sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const getUserInitials = () => {
    if (!userData.name) return 'U';
    const names = userData.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return userData.name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{getUserInitials()}</Text>
          </View>
          <Text style={styles.nameTitle}>{userData.name || 'Utilizador'}</Text>
          <Text style={styles.email}>{userData.email}</Text>
        </View>

        {/* Edit Toggle */}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => editing ? saveProfile() : setEditing(true)}
        >
          <Ionicons 
            name={editing ? 'checkmark-circle' : 'create'} 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.editButtonText}>
            {editing ? 'Guardar' : 'Editar Perfil'}
          </Text>
        </TouchableOpacity>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados Pessoais</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={[styles.input, !editing && styles.inputDisabled]}
              value={userData.name}
              onChangeText={(text) => setUserData({...userData, name: text})}
              editable={editing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sexo</Text>
            <View style={styles.rowButtons}>
              {sexOptions.map((sex) => (
                <TouchableOpacity
                  key={sex}
                  style={[
                    styles.optionButton,
                    userData.sex === sex && styles.optionButtonActive,
                    !editing && styles.buttonDisabled,
                  ]}
                  onPress={() => editing && setUserData({...userData, sex})}
                  disabled={!editing}
                >
                  <Text style={[
                    styles.optionText,
                    userData.sex === sex && styles.optionTextActive
                  ]}>
                    {sex}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Idade</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={userData.age}
                onChangeText={(text) => setUserData({...userData, age: text})}
                keyboardType="numeric"
                editable={editing}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={userData.weight}
                onChangeText={(text) => setUserData({...userData, weight: text})}
                keyboardType="numeric"
                editable={editing}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Altura (cm)</Text>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={userData.height}
                onChangeText={(text) => setUserData({...userData, height: text})}
                keyboardType="numeric"
                editable={editing}
              />
            </View>
          </View>
        </View>

        {/* Activity & Goal Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Atividade & Objetivo</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nível de Atividade</Text>
            {Object.keys(activityLevels).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.listButton,
                  userData.activityLevel === level && styles.listButtonActive,
                  !editing && styles.buttonDisabled,
                ]}
                onPress={() => editing && setUserData({...userData, activityLevel: level})}
                disabled={!editing}
              >
                <Text style={[
                  styles.listButtonText,
                  userData.activityLevel === level && styles.listButtonTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Objetivo</Text>
            <View style={styles.goalGrid}>
              {goalOptions.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalChip,
                    userData.goal === goal && styles.goalChipActive,
                    !editing && styles.buttonDisabled,
                  ]}
                  onPress={() => editing && setUserData({...userData, goal})}
                  disabled={!editing}
                >
                  <Text style={[
                    styles.goalChipText,
                    userData.goal === goal && styles.goalChipTextActive
                  ]}>
                    {goal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Goals Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Metas Diárias</Text>
            {autoCalculated && (
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
                <Text style={styles.badgeText}>Calculado</Text>
              </View>
            )}
          </View>

          <View style={styles.goalsList}>
            <View style={styles.goalItem}>
              <Ionicons name="flame" size={20} color="#FF6B35" />
              <Text style={styles.goalItemLabel}>Calorias</Text>
              <TextInput
                style={[styles.goalItemInput, !editing && styles.inputDisabled]}
                value={goals.caloriesGoal.toString()}
                onChangeText={(text) => setGoals({...goals, caloriesGoal: text})}
                keyboardType="numeric"
                editable={editing}
              />
              <Text style={styles.goalItemUnit}>kcal</Text>
            </View>

            <View style={styles.goalItem}>
              <Ionicons name="fitness" size={20} color="#FF6B35" />
              <Text style={styles.goalItemLabel}>Proteína</Text>
              <TextInput
                style={[styles.goalItemInput, !editing && styles.inputDisabled]}
                value={goals.proteinGoal.toString()}
                onChangeText={(text) => setGoals({...goals, proteinGoal: text})}
                keyboardType="numeric"
                editable={editing}
              />
              <Text style={styles.goalItemUnit}>g</Text>
            </View>

            <View style={styles.goalItem}>
              <Ionicons name="leaf" size={20} color="#FF6B35" />
              <Text style={styles.goalItemLabel}>Carbs</Text>
              <TextInput
                style={[styles.goalItemInput, !editing && styles.inputDisabled]}
                value={goals.carbsGoal.toString()}
                onChangeText={(text) => setGoals({...goals, carbsGoal: text})}
                keyboardType="numeric"
                editable={editing}
              />
              <Text style={styles.goalItemUnit}>g</Text>
            </View>

            <View style={styles.goalItem}>
              <Ionicons name="water" size={20} color="#FF6B35" />
              <Text style={styles.goalItemLabel}>Gordura</Text>
              <TextInput
                style={[styles.goalItemInput, !editing && styles.inputDisabled]}
                value={goals.fatGoal.toString()}
                onChangeText={(text) => setGoals({...goals, fatGoal: text})}
                keyboardType="numeric"
                editable={editing}
              />
              <Text style={styles.goalItemUnit}>g</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B35" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderWidth: 2,
    borderColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF6B35',
  },
  nameTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#4ADE80',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAAAAA',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  optionText: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  listButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  listButtonActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderColor: '#FF6B35',
  },
  listButtonText: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '600',
  },
  listButtonTextActive: {
    color: '#FF6B35',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  goalChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  goalChipText: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '600',
  },
  goalChipTextActive: {
    color: '#FFFFFF',
  },
  goalsList: {
    gap: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalItemLabel: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  goalItemInput: {
    backgroundColor: 'rgba(13, 13, 13, 0.8)',
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    width: 70,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  goalItemUnit: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600',
    width: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.5)',
    marginTop: 8,
  },
  logoutText: {
    color: '#FF6B35',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 40,
  },
});