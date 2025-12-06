import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export default function AddFoodScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [portion, setPortion] = useState('100');
  const [mealType, setMealType] = useState('Almoço');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success', 'error', 'warning'

  const toastAnim = useRef(new Animated.Value(-100)).current;

  const mealTypes = ['Pequeno-almoço', 'Almoço', 'Jantar', 'Snack'];

  // Mapping Portuguese to English for database storage
  const mealTypeToEnglish = {
    'Pequeno-almoço': 'breakfast',
    'Almoço': 'lunch',
    'Jantar': 'dinner',
    'Snack': 'snack',
  };

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 60,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(type === 'success' ? 2000 : 3000),
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  };

  const searchFood = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setResults([]);
    
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchQuery)}&page_size=20&json=true&fields=product_name,nutriments,image_url,brands`
      );
      
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        // Filter products that have nutritional data
        const validProducts = data.products.filter(p =>
          p.nutriments &&
          (p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal'])
        );
        if (validProducts.length === 0) {
          showToast('Não foram encontrados alimentos com dados nutricionais', 'warning');
        }
        setResults(validProducts);
      } else {
        showToast('Não foram encontrados alimentos. Tenta outra pesquisa.', 'warning');
      }
    } catch (error) {
      console.error('Search error:', error);
      showToast('Erro ao pesquisar alimentos. Verifica a tua conexão.', 'error');
    } finally {
      setSearching(false);
    }
  };

  const selectFood = (food) => {
    setSelectedFood(food);
  };

  const calculateNutrients = () => {
    if (!selectedFood) return null;

    const multiplier = parseFloat(portion) / 100;
    const n = selectedFood.nutriments;

    return {
      calories: Math.round((n['energy-kcal_100g'] || n['energy-kcal'] || 0) * multiplier),
      protein: Math.round((n['proteins_100g'] || n.proteins || 0) * multiplier * 10) / 10,
      carbs: Math.round((n['carbohydrates_100g'] || n.carbohydrates || 0) * multiplier * 10) / 10,
      fat: Math.round((n['fat_100g'] || n.fat || 0) * multiplier * 10) / 10,
    };
  };

  const saveMeal = async () => {
    if (!selectedFood) return;

    const user = auth.currentUser;
    if (!user) return;

    const nutrients = calculateNutrients();
    const today = new Date().toISOString().split('T')[0];

    try {
      // Save meal to user's meals subcollection
      const mealRef = doc(db, 'users', user.uid, 'meals', `${Date.now()}`);
      await setDoc(mealRef, {
        name: selectedFood.product_name || 'Alimento',
        brand: selectedFood.brands || '',
        calories: nutrients.calories,
        protein: nutrients.protein,
        carbs: nutrients.carbs,
        fat: nutrients.fat,
        portion: `${portion}g`,
        mealType: mealTypeToEnglish[mealType] || 'snack',
        timestamp: serverTimestamp(),
        date: today,
      });

      // Update daily stats
      const statsRef = doc(db, 'users', user.uid, 'dailyStats', today);
      await setDoc(statsRef, {
        caloriesConsumed: increment(nutrients.calories),
        proteinConsumed: increment(nutrients.protein),
        carbsConsumed: increment(nutrients.carbs),
        fatConsumed: increment(nutrients.fat),
        date: today,
      }, { merge: true });

      showToast('Refeição adicionada com sucesso!', 'success');

      // Navigate back after delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Save error:', error);
      showToast('Erro ao guardar refeição.', 'error');
    }
  };

  const nutrients = selectedFood ? calculateNutrients() : null;

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              transform: [{ translateY: toastAnim }],
              borderLeftColor:
                toastType === 'success' ? '#4CAF50' :
                toastType === 'error' ? '#F44336' :
                '#FFC107',
            },
          ]}
        >
          <Ionicons
            name={
              toastType === 'success' ? 'checkmark-circle' :
              toastType === 'error' ? 'close-circle' :
              'warning'
            }
            size={20}
            color={
              toastType === 'success' ? '#4CAF50' :
              toastType === 'error' ? '#F44336' :
              '#FFC107'
            }
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adicionar Comida</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#AAAAAA" />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar alimento..."
              placeholderTextColor="#666666"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchFood}
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={searchFood}
          >
            <Text style={styles.searchButtonText}>Pesquisar</Text>
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {searching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>A pesquisar...</Text>
          </View>
        )}

        {/* Results */}
        {!searching && results.length > 0 && !selectedFood && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Resultados ({results.length})</Text>
            {results.map((food, index) => (
              <TouchableOpacity
                key={index}
                style={styles.foodCard}
                onPress={() => selectFood(food)}
              >
                {food.image_url && (
                  <Image 
                    source={{ uri: food.image_url }} 
                    style={styles.foodImage}
                  />
                )}
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName} numberOfLines={2}>
                    {food.product_name || 'Sem nome'}
                  </Text>
                  {food.brands && (
                    <Text style={styles.foodBrand}>{food.brands}</Text>
                  )}
                  <Text style={styles.foodCalories}>
                    {Math.round(food.nutriments['energy-kcal_100g'] || food.nutriments['energy-kcal'] || 0)} kcal / 100g
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666666" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected Food Details */}
        {selectedFood && (
          <View style={styles.detailsSection}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setSelectedFood(null)}
            >
              <Ionicons name="arrow-back" size={20} color="#FF6B35" />
              <Text style={styles.backButtonText}>Voltar aos resultados</Text>
            </TouchableOpacity>

            {selectedFood.image_url && (
              <Image 
                source={{ uri: selectedFood.image_url }} 
                style={styles.detailImage}
              />
            )}

            <Text style={styles.detailName}>{selectedFood.product_name}</Text>
            {selectedFood.brands && (
              <Text style={styles.detailBrand}>{selectedFood.brands}</Text>
            )}

            {/* Portion Input */}
            <View style={styles.portionSection}>
              <Text style={styles.label}>Porção (gramas)</Text>
              <View style={styles.portionContainer}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => {
                    const current = parseInt(portion) || 0;
                    if (current > 10) setPortion(String(current - 10));
                  }}
                >
                  <Ionicons name="remove" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TextInput
                  style={styles.portionInput}
                  value={portion}
                  onChangeText={setPortion}
                  keyboardType="numeric"
                  placeholder="100"
                  placeholderTextColor="#666666"
                />
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => {
                    const current = parseInt(portion) || 0;
                    setPortion(String(current + 10));
                  }}
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {/* Quick Actions */}
              <View style={styles.quickActionsRow}>
                {[50, 100, 150, 200].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.quickActionButton,
                      portion === String(amount) && styles.quickActionButtonActive,
                    ]}
                    onPress={() => setPortion(String(amount))}
                  >
                    <Text
                      style={[
                        styles.quickActionText,
                        portion === String(amount) && styles.quickActionTextActive,
                      ]}
                    >
                      {amount}g
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Meal Type Selector */}
            <View style={styles.mealTypeSection}>
              <Text style={styles.label}>Tipo de Refeição</Text>
              <View style={styles.mealTypeButtons}>
                {mealTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.mealTypeButton,
                      mealType === type && styles.mealTypeButtonActive
                    ]}
                    onPress={() => setMealType(type)}
                  >
                    <Text style={[
                      styles.mealTypeText,
                      mealType === type && styles.mealTypeTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Nutritional Info */}
            {nutrients && (
              <View style={styles.nutrientsCard}>
                <Text style={styles.nutrientsTitle}>Informação Nutricional ({portion}g)</Text>
                <View style={styles.nutrientRow}>
                  <View style={styles.nutrientLabelContainer}>
                    <View style={[styles.nutrientDot, { backgroundColor: '#FF6B35' }]} />
                    <Text style={styles.nutrientLabel}>Calorias</Text>
                  </View>
                  <Text style={[styles.nutrientValue, { color: '#FF6B35' }]}>
                    {nutrients.calories} kcal
                  </Text>
                </View>
                <View style={styles.nutrientRow}>
                  <View style={styles.nutrientLabelContainer}>
                    <View style={[styles.nutrientDot, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.nutrientLabel}>Proteína</Text>
                  </View>
                  <Text style={[styles.nutrientValue, { color: '#4CAF50' }]}>
                    {nutrients.protein}g
                  </Text>
                </View>
                <View style={styles.nutrientRow}>
                  <View style={styles.nutrientLabelContainer}>
                    <View style={[styles.nutrientDot, { backgroundColor: '#2196F3' }]} />
                    <Text style={styles.nutrientLabel}>Carboidratos</Text>
                  </View>
                  <Text style={[styles.nutrientValue, { color: '#2196F3' }]}>
                    {nutrients.carbs}g
                  </Text>
                </View>
                <View style={styles.nutrientRow}>
                  <View style={styles.nutrientLabelContainer}>
                    <View style={[styles.nutrientDot, { backgroundColor: '#FFC107' }]} />
                    <Text style={styles.nutrientLabel}>Gordura</Text>
                  </View>
                  <Text style={[styles.nutrientValue, { color: '#FFC107' }]}>
                    {nutrients.fat}g
                  </Text>
                </View>
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveMeal}
            >
              <Text style={styles.saveButtonText}>Adicionar Refeição</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!searching && results.length === 0 && !selectedFood && searchQuery.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color="#666666" />
            <Text style={styles.emptyTitle}>Pesquisa alimentos</Text>
            <Text style={styles.emptyText}>
              Usa a barra de pesquisa acima para encontrar alimentos da base de dados OpenFoodFacts
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  toast: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#AAAAAA',
    fontSize: 16,
    marginTop: 12,
  },
  resultsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  foodImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  foodBrand: {
    fontSize: 13,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  foodCalories: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '700',
    marginTop: 4,
  },
  detailsSection: {
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  detailBrand: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 24,
  },
  portionSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  portionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepperButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  portionInput: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    padding: 16,
    fontSize: 22,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontWeight: '700',
    textAlign: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    alignItems: 'center',
  },
  quickActionButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  quickActionText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mealTypeSection: {
    marginBottom: 24,
  },
  mealTypeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    marginBottom: 8,
  },
  mealTypeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mealTypeText: {
    color: '#AAAAAA',
    fontSize: 15,
    fontWeight: '600',
  },
  mealTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  nutrientsCard: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  nutrientsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
  },
  nutrientLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutrientDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  nutrientLabel: {
    fontSize: 16,
    color: '#AAAAAA',
    fontWeight: '500',
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    paddingVertical: 20,
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
});