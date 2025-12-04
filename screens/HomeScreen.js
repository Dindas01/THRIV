import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('Utilizador');
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState({
    caloriesConsumed: 0,
    caloriesGoal: 2000,
    proteinConsumed: 0,
    proteinGoal: 150,
    waterGlasses: 0,
    workoutMinutes: 0,
  });

  // Format date manually
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const today = new Date();
  const formattedDate = `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]}`;

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserName(userDoc.data().name || 'Utilizador');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementWater = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const statsRef = doc(db, 'users', user.uid, 'dailyStats', today);
      
      await setDoc(statsRef, {
        waterGlasses: increment(1),
      }, { merge: true });

      setDailyStats(prev => ({
        ...prev,
        waterGlasses: Math.min(prev.waterGlasses + 1, 8),
      }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getUserInitials = () => {
    if (!userName) return 'U';
    const names = userName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  const caloriesProgress = Math.min((dailyStats.caloriesConsumed / dailyStats.caloriesGoal) * 100, 100);
  const proteinProgress = Math.min((dailyStats.proteinConsumed / dailyStats.proteinGoal) * 100, 100);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Olá, {userName.split(' ')[0]}!</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>{getUserInitials()}</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Stats - 2x2 Grid */}
        <View style={styles.statsGrid}>
          {/* Calories */}
          <TouchableOpacity 
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AddFood')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="flame-outline" size={24} color="#FF6B35" />
            </View>
            <Text style={styles.statLabel}>Calorias</Text>
            <Text style={styles.statValue}>
              {dailyStats.caloriesConsumed}/{dailyStats.caloriesGoal}
            </Text>
            <Text style={styles.statUnit}>kcal</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${caloriesProgress}%` }]} />
            </View>
          </TouchableOpacity>

          {/* Protein */}
          <TouchableOpacity 
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AddFood')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="fitness-outline" size={24} color="#FF6B35" />
            </View>
            <Text style={styles.statLabel}>Proteína</Text>
            <Text style={styles.statValue}>
              {dailyStats.proteinConsumed}/{dailyStats.proteinGoal}
            </Text>
            <Text style={styles.statUnit}>g</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${proteinProgress}%` }]} />
            </View>
          </TouchableOpacity>

          {/* Workout */}
          <TouchableOpacity 
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('LogWorkout')}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="barbell-outline" size={24} color="#FF6B35" />
            </View>
            <Text style={styles.statLabel}>Treino Hoje</Text>
            <Text style={styles.statValue}>{dailyStats.workoutMinutes}</Text>
            <Text style={styles.statUnit}>minutos</Text>
            <TouchableOpacity 
              style={styles.miniButton}
              onPress={() => navigation.navigate('LogWorkout')}
            >
              <Text style={styles.miniButtonText}>Registar</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Water */}
          <TouchableOpacity 
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={incrementWater}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="water-outline" size={24} color="#FF6B35" />
            </View>
            <Text style={styles.statLabel}>Água</Text>
            <Text style={styles.statValue}>
              {dailyStats.waterGlasses}/8
            </Text>
            <Text style={styles.statUnit}>copos</Text>
            <View style={styles.waterDots}>
              {[...Array(8)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.waterDot,
                    i < dailyStats.waterGlasses && styles.waterDotFilled,
                  ]}
                />
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ScanFood')}
          >
            <Ionicons name="camera-outline" size={32} color="#FF6B35" />
            <Text style={styles.actionText}>Digitalizar Alimento</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AddFood')}
          >
            <Ionicons name="add-circle-outline" size={32} color="#FF6B35" />
            <Text style={styles.actionText}>Adicionar Comida</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('LogWorkout')}
          >
            <Ionicons name="fitness-outline" size={32} color="#FF6B35" />
            <Text style={styles.actionText}>Registar Treino</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Progress')}
          >
            <Ionicons name="trending-up-outline" size={32} color="#FF6B35" />
            <Text style={styles.actionText}>Ver Progresso</Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        <View style={styles.emptyCard}>
          <Ionicons name="nutrition-outline" size={48} color="#666666" />
          <Text style={styles.emptyTitle}>Ainda sem atividade hoje</Text>
          <Text style={styles.emptySubtext}>Começa a registar as tuas refeições</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 16,
    color: '#AAAAAA',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderWidth: 2,
    borderColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 3,
  },
  miniButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  miniButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  waterDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  waterDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  waterDotFilled: {
    backgroundColor: '#FF6B35',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
  },
});