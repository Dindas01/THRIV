import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Animated,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const { width } = Dimensions.get('window');

export default function WorkoutsScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [workouts, setWorkouts] = useState([]);
  const [weekStats, setWeekStats] = useState({
    totalWorkouts: 0,
    totalDuration: 0,
    totalCalories: 0,
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(-100)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadWorkoutsData();
  }, [selectedTab]);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // FAB pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabScale, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fabScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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

  const animateStats = () => {
    Animated.spring(statsAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  const loadWorkoutsData = async (showRefreshToast = false) => {
    try {
      if (!showRefreshToast) {
        setLoading(true);
      }
      
      const userId = auth.currentUser?.uid;
      if (!userId) {
        showToast('Erro: Utilizador não autenticado');
        return;
      }

      // Load workouts
      const workoutsQuery = query(
        collection(db, `users/${userId}/workouts`),
        orderBy('timestamp', 'desc')
      );
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workoutsData = workoutsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Filter workouts
      let filteredWorkouts;
      if (selectedTab === 'today') {
        filteredWorkouts = workoutsData.filter((workout) => {
          const workoutDate = workout.timestamp?.toDate?.().toISOString().split('T')[0];
          return workoutDate === today;
        });
      } else {
        filteredWorkouts = workoutsData.filter((workout) => {
          const workoutDate = workout.timestamp?.toDate?.();
          return workoutDate >= weekAgo;
        });
      }

      setWorkouts(filteredWorkouts);

      // Calculate week stats
      const weekWorkouts = workoutsData.filter((workout) => {
        const workoutDate = workout.timestamp?.toDate?.();
        return workoutDate >= weekAgo;
      });

      const stats = {
        totalWorkouts: weekWorkouts.length,
        totalDuration: weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
        totalCalories: weekWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
      };
      setWeekStats(stats);
      animateStats();

      if (showRefreshToast) {
        showToast(`${filteredWorkouts.length} treinos carregados`);
      }
    } catch (error) {
      console.error('Error loading workouts data:', error);
      showToast('Erro ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkoutsData(true);
  };

  const deleteWorkout = async (workoutId, workoutType) => {
    Alert.alert(
      'Eliminar treino',
      `Tens a certeza que queres eliminar este treino de ${workoutType}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = auth.currentUser?.uid;
              await deleteDoc(doc(db, `users/${userId}/workouts`, workoutId));
              showToast('Treino eliminado');
              loadWorkoutsData();
            } catch (error) {
              showToast('Erro ao eliminar');
            }
          },
        },
      ]
    );
  };

  const groupWorkoutsByDate = () => {
    const grouped = {};

    workouts.forEach((workout) => {
      const date = workout.timestamp?.toDate?.().toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(workout);
    });

    return grouped;
  };

  const workoutTypeIcons = {
    cardio: 'bicycle-outline',
    strength: 'barbell-outline',
    flexibility: 'body-outline',
    sports: 'football-outline',
    other: 'fitness-outline',
  };

  const workoutTypeLabels = {
    cardio: 'Cardio',
    strength: 'Musculação',
    flexibility: 'Flexibilidade',
    sports: 'Desporto',
    other: 'Outro',
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (dateString === today) return 'Hoje';
    if (dateString === yesterdayString) return 'Ontem';
    
    return date.toLocaleDateString('pt-PT', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const renderStatsCard = () => {
    const scale = statsAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    });

    return (
      <Animated.View 
        style={[
          styles.statsCard, 
          { opacity: fadeAnim, transform: [{ scale }] }
        ]}
      >
        <Text style={styles.statsTitle}>Esta Semana</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="flame-outline" size={28} color="#FF6B35" />
            <Text style={styles.statValue}>{Math.round(weekStats.totalCalories)}</Text>
            <Text style={styles.statLabel}>kcal</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={28} color="#4ECDC4" />
            <Text style={styles.statValue}>{formatDuration(weekStats.totalDuration)}</Text>
            <Text style={styles.statLabel}>duração</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trophy-outline" size={28} color="#FFD93D" />
            <Text style={styles.statValue}>{weekStats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>treinos</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderWorkoutsByDate = () => {
    const groupedWorkouts = groupWorkoutsByDate();
    const dates = Object.keys(groupedWorkouts).sort((a, b) => b.localeCompare(a));

    if (dates.length === 0) {
      return (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
          <Ionicons name="barbell-outline" size={64} color="#666666" />
          <Text style={styles.emptyStateText}>
            Ainda não registaste treinos {selectedTab === 'today' ? 'hoje' : 'esta semana'}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Toca no botão + para começar
          </Text>
        </Animated.View>
      );
    }

    return dates.map((date) => (
      <Animated.View 
        key={date} 
        style={[styles.dateSection, { opacity: fadeAnim }]}
      >
        <View style={styles.dateHeader}>
          <Text style={styles.dateTitle}>{formatDate(date)}</Text>
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{groupedWorkouts[date].length}</Text>
          </View>
        </View>

        {groupedWorkouts[date].map((workout) => (
          <Animated.View
            key={workout.id}
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={styles.workoutItem}
              onLongPress={() => deleteWorkout(workout.id, workout.type)}
              activeOpacity={0.7}
            >
              <View style={styles.workoutIcon}>
                <Ionicons 
                  name={workoutTypeIcons[workout.type] || 'fitness-outline'} 
                  size={24} 
                  color="#FF6B35" 
                />
              </View>
              <View style={styles.workoutDetails}>
                <Text style={styles.workoutType}>
                  {workoutTypeLabels[workout.type] || workout.type}
                </Text>
                <View style={styles.workoutMeta}>
                  <Text style={styles.workoutMetaText}>
                    <Ionicons name="time-outline" size={12} color="#AAAAAA" />
                    {' '}{formatDuration(workout.duration || 0)}
                  </Text>
                  <Text style={styles.workoutMetaText}>
                    <Ionicons name="flame-outline" size={12} color="#AAAAAA" />
                    {' '}{Math.round(workout.caloriesBurned || 0)} kcal
                  </Text>
                  <Text style={styles.workoutMetaText}>
                    {workout.timestamp?.toDate?.().toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>
    ));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>A carregar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Header with Tabs */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Treinos</Text>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'today' && styles.tabActive]}
            onPress={() => setSelectedTab('today')}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabText, selectedTab === 'today' && styles.tabTextActive]}
            >
              Hoje
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'week' && styles.tabActive]}
            onPress={() => setSelectedTab('week')}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabText, selectedTab === 'week' && styles.tabTextActive]}
            >
              Semana
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B35"
            colors={['#FF6B35']}
          />
        }
      >
        {/* Stats Card */}
        {renderStatsCard()}

        {/* Workouts List */}
        <View style={styles.workoutsContainer}>
          {renderWorkoutsByDate()}
        </View>
      </ScrollView>

      {/* FAB Button */}
      <Animated.View style={{ transform: [{ scale: fabScale }] }}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            showToast('A abrir registar treino...');
            navigation.navigate('LogWorkout');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#AAAAAA',
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#AAAAAA',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statsCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 4,
  },
  workoutsContainer: {
    marginTop: 8,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  dateBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  dateBadgeText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: 'bold',
  },
  workoutItem: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutDetails: {
    flex: 1,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutMetaText: {
    fontSize: 13,
    color: '#AAAAAA',
    marginRight: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#AAAAAA',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});