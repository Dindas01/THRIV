import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Import screens
import OnboardingScreen from './screens/OnboardingScreen';
import SignupScreen from './screens/SignupScreen';
import LoginScreen from './screens/LoginScreen';
import SetupGoalsScreen from './screens/SetupGoalsScreen';
import PaywallInitialScreen from './screens/PaywallInitialScreen';
import HomeScreen from './screens/HomeScreen';
import NutritionScreen from './screens/NutritionScreen';
import WorkoutsScreen from './screens/WorkoutsScreen';
import ProfessionalsScreen from './screens/ProfessionalsScreen';
import ProfileScreen from './screens/ProfileScreen';
import ScanFoodScreen from './screens/ScanFoodScreen';
import AddFoodScreen from './screens/AddFoodScreen';
import LogWorkoutScreen from './screens/LogWorkoutScreen';
import ProgressScreen from './screens/ProgressScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator (shown after login)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 1,
          borderTopColor: '#1A1A1A',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'NutritionTab') {
            iconName = focused ? 'nutrition' : 'nutrition-outline';
          } else if (route.name === 'WorkoutsTab') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'ProfessionalsTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
        }}
      />
      <Tab.Screen 
        name="NutritionTab" 
        component={NutritionScreen}
        options={{
          tabBarLabel: 'Nutrição',
        }}
      />
      <Tab.Screen 
        name="WorkoutsTab" 
        component={WorkoutsScreen}
        options={{
          tabBarLabel: 'Treinos',
        }}
      />
      <Tab.Screen 
        name="ProfessionalsTab" 
        component={ProfessionalsScreen}
        options={{
          tabBarLabel: 'Profissionais',
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [initializing]);

  // Show loading screen while checking auth state
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? "MainTabs" : "Onboarding"}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
          animation: 'slide_from_right',
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
        />
        
        {/* Onboarding Flow */}
        <Stack.Screen 
          name="SetupGoals" 
          component={SetupGoalsScreen}
        />
        <Stack.Screen 
          name="PaywallInitial" 
          component={PaywallInitialScreen}
        />
        
        {/* Main App */}
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs}
        />
        
        {/* Modal screens */}
        <Stack.Screen 
          name="ScanFood" 
          component={ScanFoodScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen 
          name="AddFood" 
          component={AddFoodScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen 
          name="LogWorkout" 
          component={LogWorkoutScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen 
          name="Progress" 
          component={ProgressScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});