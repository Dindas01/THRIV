import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Animated,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';

const { width } = Dimensions.get('window');

export default function ProgressScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('weight'); // weight, calories, macros
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [weightData, setWeightData] = useState([]);
  const [caloriesData, setCaloriesData] = useState([]);
  const [stats, setStats] = useState({
    currentWeight: 0,
    weightChange: 0,
    avgCalories: 0,
    streak: 0,
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(-100)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadProgressData();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Animate chart when tab changes
    chartAnim.setValue(0);
    Animated.timing(chartAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [selectedTab]);

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

  const loadProgressData = async (showRefreshToast = false) => {
    try {
      if (!showRefreshToast) {
        setLoading(true);
      }
      
      const userId = auth.currentUser?.uid;
      if (!userId) {
        showToast('Erro: Utilizador não autenticado');
        return;
      }

      // Get user's current weight from profile
      const userDoc = await getDocs(collection(db, 'users'));
      const currentUser = userDoc.docs.find(doc => doc.id === userId);
      const currentWeight = currentUser?.data()?.weight || 0;

      // Load last 30 days of stats
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0];

      const statsQuery = query(
        collection(db, `users/${userId}/dailyStats`),
        orderBy('date', 'desc'),
        limit(30)
      );
      const statsSnapshot = await getDocs(statsQuery);
      const statsData = statsSnapshot.docs.map(doc => ({
        date: doc.data().date,
        caloriesConsumed: doc.data().caloriesConsumed || 0,
        proteinConsumed: doc.data().proteinConsumed || 0,
        carbsConsumed: doc.data().carbsConsumed || 0,
        fatConsumed: doc.data().fatConsumed || 0,
      })).reverse();

      // Calculate streak (consecutive days with logged meals)
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      let checkDate = new Date();
      
      for (let i = 0; i < 30; i++) {
        const dateString = checkDate.toISOString().split('T')[0];
        const dayData = statsData.find(d => d.date === dateString);
        
        if (dayData && dayData.caloriesConsumed > 0) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate average calories
      const validDays = statsData.filter(d => d.caloriesConsumed > 0);
      const avgCalories = validDays.length > 0
        ? Math.round(validDays.reduce((sum, d) => sum + d.caloriesConsumed, 0) / validDays.length)
        : 0;

      setCaloriesData(statsData);
      setStats({
        currentWeight,
        weightChange: 0, // TODO: Calculate from weight history
        avgCalories,
        streak,
      });

      if (showRefreshToast) {
        showToast('Dados actualizados');
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
      showToast('Erro ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProgressData(true);
  };

  const getChartData = () => {
    if (selectedTab === 'calories') {
      // Last 7 days of calories
      const last7Days = caloriesData.slice(-7);
      
      if (last7Days.length === 0) {
        return {
          labels: ['Sem dados'],
          datasets: [{ data: [0] }],
        };
      }

      return {
        labels: last7Days.map(d => {
          const date = new Date(d.date);
          return date.toLocaleDateString('pt-PT', { weekday: 'short' });
        }),
        datasets: [{
          data: last7Days.map(d => d.caloriesConsumed || 0),
        }],
      };
    }

    if (selectedTab === 'macros') {
      // Last 7 days of macros (protein)
      const last7Days = caloriesData.slice(-7);
      
      if (last7Days.length === 0) {
        return {
          labels: ['Sem dados'],
          datasets: [
            { data: [0], color: () => '#FF6B35' },
            { data: [0], color: () => '#4ECDC4' },
            { data: [0], color: () => '#FFD93D' },
          ],
        };
      }

      return {
        labels: last7Days.map(d => {
          const date = new Date(d.date);
          return date.toLocaleDateString('pt-PT', { weekday: 'short' });
        }),
        datasets: [
          {
            data: last7Days.map(d => d.proteinConsumed || 0),
            color: () => '#FF6B35',
            strokeWidth: 2,
          },
          {
            data: last7Days.map(d => d.carbsConsumed || 0),
            color: () => '#4ECDC4',
            strokeWidth: 2,
          },
          {
            data: last7Days.map(d => d.fatConsumed || 0),
            color: () => '#FFD93D',
            strokeWidth: 2,
          },
        ],
        legend: ['Proteína', 'Carbos', 'Gordura'],
      };
    }

    // Weight placeholder (would need weight history collection)
    return {
      labels: ['Sem dados'],
      datasets: [{ data: [stats.currentWeight] }],
    };
  };

  const renderStatsCards = () => {
    return (
      <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
        <View style={styles.statCard}>
          <Ionicons name="scale-outline" size={28} color="#FF6B35" />
          <Text style={styles.statValue}>{stats.currentWeight}kg</Text>
          <Text style={styles.statLabel}>Peso actual</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flame-outline" size={28} color="#4ECDC4" />
          <Text style={styles.statValue}>{stats.avgCalories}</Text>
          <Text style={styles.statLabel}>Média kcal</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trophy-outline" size={28} color="#FFD93D" />
          <Text style={styles.statValue}>{stats.streak}d</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </Animated.View>
    );
  };

  const renderChart = () => {
    const chartData = getChartData();
    const hasData = chartData.datasets[0].data.some(val => val > 0);

    if (!hasData) {
      return (
        <Animated.View style={[styles.emptyChart, { opacity: fadeAnim }]}>
          <Ionicons name="bar-chart-outline" size={64} color="#666666" />
          <Text style={styles.emptyChartText}>Sem dados suficientes</Text>
          <Text style={styles.emptyChartSubtext}>
            Começa a registar para ver o teu progresso
          </Text>
        </Animated.View>
      );
    }

    const chartOpacity = chartAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const chartTranslate = chartAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    });

    return (
      <Animated.View
        style={{
          opacity: chartOpacity,
          transform: [{ translateY: chartTranslate }],
        }}
      >
        <LineChart
          data={chartData}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: 'rgba(26, 26, 26, 0.6)',
            backgroundGradientFrom: 'rgba(26, 26, 26, 0.6)',
            backgroundGradientTo: 'rgba(26, 26, 26, 0.6)',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(170, 170, 170, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#FF6B35',
            },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: 'rgba(255, 255, 255, 0.1)',
            },
          }}
          bezier
          style={styles.chart}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          withVerticalLines={false}
          withHorizontalLines={true}
        />
      </Animated.View>
    );
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progresso</Text>
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
        {/* Stats Cards */}
        {renderStatsCards()}

        {/* Chart Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'weight' && styles.tabActive]}
            onPress={() => setSelectedTab('weight')}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabText, selectedTab === 'weight' && styles.tabTextActive]}
            >
              Peso
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'calories' && styles.tabActive]}
            onPress={() => setSelectedTab('calories')}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabText, selectedTab === 'calories' && styles.tabTextActive]}
            >
              Calorias
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'macros' && styles.tabActive]}
            onPress={() => setSelectedTab('macros')}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabText, selectedTab === 'macros' && styles.tabTextActive]}
            >
              Macros
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          {renderChart()}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#4ECDC4" />
          <Text style={styles.infoText}>
            {selectedTab === 'weight' && 'Regista o teu peso regularmente para ver a evolução'}
            {selectedTab === 'calories' && 'Gráfico dos últimos 7 dias de consumo calórico'}
            {selectedTab === 'macros' && 'Evolução das proteínas, carboidratos e gorduras'}
          </Text>
        </View>
      </ScrollView>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginHorizontal: 4,
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
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#AAAAAA',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    marginBottom: 24,
  },
  chart: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyChart: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 40,
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#AAAAAA',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
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
});