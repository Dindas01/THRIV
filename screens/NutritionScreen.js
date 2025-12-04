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

export default function NutritionScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [goals, setGoals] = useState({
    caloriesGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 200,
    fatGoal: 65,
  });
  const [consumed, setConsumed] = useState({
    caloriesConsumed: 0,
    proteinConsumed: 0,
    carbsConsumed: 0,
    fatConsumed: 0,
  });
  const [meals, setMeals] = useState([]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const toastAnim = useRef(new Animated.Value(-100)).current;
  const progressAnims = useRef({
    calories: new Animated.Value(0),
    protein: new Animated.Value(0),
    carbs: new Animated.Value(0),
    fat: new Animated.Value(0),
  }).current;

  useEffect(() => {
    loadNutritionData();
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

  const animateProgress = (percentages) => {
    Animated.parallel([
      Animated.spring(progressAnims.calories, {
        toValue: percentages.calories,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }),
      Animated.spring(progressAnims.protein, {
        toValue: percentages.protein,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }),
      Animated.spring(progressAnims.carbs, {
        toValue: percentages.carbs,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }),
      Animated.spring(progressAnims.fat, {
        toValue: percentages.fat,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }),
    ]).start();
  };

  const loadNutritionData = async (showRefreshToast = false) => {
    try {
      if (!showRefreshToast) {
        setLoading(true);
      }
      
      const userId = auth.currentUser?.uid;
      if (!userId) {
        showToast('Erro: Utilizador não autenticado');
        return;
      }

      // Load goals
      const goalsDoc = await getDocs(collection(db, `users/${userId}/profile`));
      if (!goalsDoc.empty) {
        const goalsData = goalsDoc.docs[0].data();
        setGoals(goalsData);
      }

      // Load today's stats
      const today = new Date().toISOString().split('T')[0];
      const statsQuery = query(
        collection(db, `users/${userId}/dailyStats`),
        where('date', '==', today)
      );
      const statsSnapshot = await getDocs(statsQuery);
      
      if (!statsSnapshot.empty) {
        const statsData = statsSnapshot.docs[0].data();
        const consumedData = {
          caloriesConsumed: statsData.caloriesConsumed || 0,
          proteinConsumed: statsData.proteinConsumed || 0,
          carbsConsumed: statsData.carbsConsumed || 0,
          fatConsumed: statsData.fatConsumed || 0,
        };
        setConsumed(consumedData);

        // Animate progress bars
        const percentages = {
          calories: Math.min((consumedData.caloriesConsumed / goals.caloriesGoal) * 100, 100),
          protein: Math.min((consumedData.proteinConsumed / goals.proteinGoal) * 100, 100),
          carbs: Math.min((consumedData.carbsConsumed / goals.carbsGoal) * 100, 100),
          fat: Math.min((consumedData.fatConsumed / goals.fatGoal) * 100, 100),
        };
        animateProgress(percentages);
      } else {
        setConsumed({
          caloriesConsumed: 0,
          proteinConsumed: 0,
          carbsConsumed: 0,
          fatConsumed: 0,
        });
        animateProgress({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      }

      // Load meals
      const mealsQuery = query(
        collection(db, `users/${userId}/meals`),
        orderBy('timestamp', 'desc')
      );
      const mealsSnapshot = await getDocs(mealsQuery);
      const mealsData = mealsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter meals
      if (selectedTab === 'today') {
        const todayMeals = mealsData.filter((meal) => {
          const mealDate = meal.timestamp?.toDate?.().toISOString().split('T')[0];
          return mealDate === today;
        });
        setMeals(todayMeals);
        if (showRefreshToast) {
          showToast(`${todayMeals.length} refeições carregadas`);
        }
      } else {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekMeals = mealsData.filter((meal) => {
          const mealDate = meal.timestamp?.toDate?.();
          return mealDate >= weekAgo;
        });
        setMeals(weekMeals);
        if (showRefreshToast) {
          showToast(`${weekMeals.length} refeições carregadas`);
        }
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
      showToast('Erro ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNutritionData(true);
  };

  const deleteMeal = async (mealId, mealName) => {
    Alert.alert(
      'Eliminar refeição',
      `Tens a certeza que queres eliminar "${mealName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = auth.currentUser?.uid;
              await deleteDoc(doc(db, `users/${userId}/meals`, mealId));
              showToast('Refeição eliminada');
              loadNutritionData();
            } catch (error) {
              showToast('Erro ao eliminar');
            }
          },
        },
      ]
    );
  };

  const groupMealsByType = () => {
    const grouped = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    meals.forEach((meal) => {
      const type = meal.mealType || 'snack';
      if (grouped[type]) {
        grouped[type].push(meal);
      }
    });

    return grouped;
  };

  const mealTypeLabels = {
    breakfast: 'Pequeno-almoço',
    lunch: 'Almoço',
    dinner: 'Jantar',
    snack: 'Snacks',
  };

  const mealTypeIcons = {
    breakfast: 'sunny-outline',
    lunch: 'restaurant-outline',
    dinner: 'moon-outline',
    snack: 'cafe-outline',
  };

  const renderProgressCard = () => {
    const caloriesPercentage = Math.min(
      (consumed.caloriesConsumed / goals.caloriesGoal) * 100,
      100
    );

    // Animated height for calories circle
    const caloriesHeight = progressAnims.calories.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    return (
      <Animated.View style={[styles.progressCard, { opacity: fadeAnim }]}>
        {/* Main Calories Circle */}
        <View style={styles.mainCaloriesSection}>
          <View style={styles.caloriesCircle}>
            <Animated.View
              style={[
                styles.caloriesCircleProgress,
                { height: caloriesHeight },
              ]}
            />
            <View style={styles.caloriesCircleInner}>
              <Text style={styles.caloriesConsumed}>
                {Math.round(consumed.caloriesConsumed)}
              </Text>
              <Text style={styles.caloriesGoal}>/ {goals.caloriesGoal}</Text>
              <Text style={styles.caloriesLabel}>kcal</Text>
            </View>
          </View>
          {caloriesPercentage >= 100 && (
            <View style={styles.goalBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.goalBadgeText}>Meta atingida</Text>
            </View>
          )}
        </View>

        {/* Macros Row */}
        <View style={styles.macrosRow}>
          <MacroProgress
            label="Proteína"
            consumed={Math.round(consumed.proteinConsumed)}
            goal={Math.round(goals.proteinGoal)}
            animatedValue={progressAnims.protein}
            color="#FF6B35"
            unit="g"
          />
          <MacroProgress
            label="Carbos"
            consumed={Math.round(consumed.carbsConsumed)}
            goal={Math.round(goals.carbsGoal)}
            animatedValue={progressAnims.carbs}
            color="#4ECDC4"
            unit="g"
          />
          <MacroProgress
            label="Gordura"
            consumed={Math.round(consumed.fatConsumed)}
            goal={Math.round(goals.fatGoal)}
            animatedValue={progressAnims.fat}
            color="#FFD93D"
            unit="g"
          />
        </View>
      </Animated.View>
    );
  };

  const MacroProgress = ({ label, consumed, goal, animatedValue, color, unit }) => {
    const width = animatedValue.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.macroItem}>
        <View style={styles.macroProgressBar}>
          <Animated.View
            style={[
              styles.macroProgressFill,
              { width, backgroundColor: color },
            ]}
          />
        </View>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValues}>
          {consumed} / {goal}{unit}
        </Text>
      </View>
    );
  };

  const renderMealSection = (type, meals) => {
    if (meals.length === 0) return null;

    const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
    const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);

    return (
      <Animated.View key={type} style={[styles.mealSection, { opacity: fadeAnim }]}>
        <View style={styles.mealHeader}>
          <View style={styles.mealHeaderLeft}>
            <Ionicons name={mealTypeIcons[type]} size={24} color="#FF6B35" />
            <Text style={styles.mealTypeTitle}>{mealTypeLabels[type]}</Text>
            <View style={styles.mealCountBadge}>
              <Text style={styles.mealCountText}>{meals.length}</Text>
            </View>
          </View>
          <View style={styles.mealHeaderRight}>
            <Text style={styles.mealTotalCalories}>{Math.round(totalCalories)} kcal</Text>
            <Text style={styles.mealTotalProtein}>{Math.round(totalProtein)}g proteína</Text>
          </View>
        </View>

        {meals.map((meal, index) => (
          <Animated.View
            key={meal.id}
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
              style={styles.mealItem}
              onLongPress={() => deleteMeal(meal.id, meal.name)}
              activeOpacity={0.7}
            >
              <View style={styles.mealItemLeft}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealTime}>
                  {meal.timestamp?.toDate?.().toLocaleTimeString('pt-PT', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.mealItemRight}>
                <Text style={styles.mealCalories}>{Math.round(meal.calories || 0)} kcal</Text>
                <View style={styles.mealMacros}>
                  <Text style={styles.mealMacroText}>P: {Math.round(meal.protein || 0)}g</Text>
                  <Text style={styles.mealMacroText}>C: {Math.round(meal.carbs || 0)}g</Text>
                  <Text style={styles.mealMacroText}>G: {Math.round(meal.fat || 0)}g</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>
    );
  };

  const groupedMeals = groupMealsByType();

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
        <Text style={styles.headerTitle}>Nutrição</Text>
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
        {/* Progress Card */}
        {renderProgressCard()}

        {/* Meals List */}
        <View style={styles.mealsContainer}>
          {meals.length === 0 ? (
            <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
              <Ionicons name="restaurant-outline" size={64} color="#666666" />
              <Text style={styles.emptyStateText}>
                Ainda não adicionaste refeições {selectedTab === 'today' ? 'hoje' : 'esta semana'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Toca no botão + para começar
              </Text>
            </Animated.View>
          ) : (
            <>
              {renderMealSection('breakfast', groupedMeals.breakfast)}
              {renderMealSection('lunch', groupedMeals.lunch)}
              {renderMealSection('dinner', groupedMeals.dinner)}
              {renderMealSection('snack', groupedMeals.snack)}
            </>
          )}
        </View>
      </ScrollView>

      {/* FAB Button */}
      <Animated.View style={{ transform: [{ scale: fabScale }] }}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            showToast('A abrir adicionar refeição...');
            navigation.navigate('AddFood');
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
  progressCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    marginBottom: 24,
  },
  mainCaloriesSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  caloriesCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 8,
    borderColor: 'rgba(255, 107, 53, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  caloriesCircleProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
  },
  caloriesCircleInner: {
    alignItems: 'center',
  },
  caloriesConsumed: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  caloriesGoal: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: -4,
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  goalBadgeText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  macroProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    marginBottom: 2,
  },
  macroValues: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mealsContainer: {
    marginTop: 8,
  },
  mealSection: {
    marginBottom: 24,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  mealCountBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  mealCountText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mealHeaderRight: {
    alignItems: 'flex-end',
  },
  mealTotalCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  mealTotalProtein: {
    fontSize: 13,
    color: '#AAAAAA',
    marginTop: 2,
  },
  mealItem: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealItemLeft: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 13,
    color: '#666666',
  },
  mealItemRight: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  mealMacros: {
    flexDirection: 'row',
  },
  mealMacroText: {
    fontSize: 11,
    color: '#AAAAAA',
    marginLeft: 8,
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