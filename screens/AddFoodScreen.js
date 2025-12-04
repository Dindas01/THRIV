import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export default function AddFoodScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [portion, setPortion] = useState('100');
  const [mealType, setMealType] = useState('lunch');

  // Mapping: chave em inglês (guardada na BD) -> label em português (mostrado no UI)
  const mealTypeLabels = {
    'breakfast': 'Pequeno-almoço',
    'lunch': 'Almoço',
    'dinner': 'Jantar',
    'snack': 'Snack',
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

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
        setResults(validProducts);
      } else {
        Alert.alert('Sem resultados', 'Não foram encontrados alimentos. Tenta outra pesquisa.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Erro', 'Erro ao pesquisar alimentos. Verifica a tua conexão.');
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
        mealType: mealType,
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

      Alert.alert(
        'Sucesso!', 
        'Refeição adicionada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Erro', 'Erro ao guardar refeição.');
    }
  };

  const nutrients = selectedFood ? calculateNutrients() : null;

  return (
    <View style={styles.container}>
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
              <TextInput
                style={styles.portionInput}
                value={portion}
                onChangeText={setPortion}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor="#666666"
              />
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
                      {mealTypeLabels[type]}
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
                  <Text style={styles.nutrientLabel}>Calorias</Text>
                  <Text style={styles.nutrientValue}>{nutrients.calories} kcal</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientLabel}>Proteína</Text>
                  <Text style={styles.nutrientValue}>{nutrients.protein}g</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientLabel}>Carboidratos</Text>
                  <Text style={styles.nutrientValue}>{nutrients.carbs}g</Text>
                </View>
                <View style={styles.nutrientRow}>
                  <Text style={styles.nutrientLabel}>Gordura</Text>
                  <Text style={styles.nutrientValue}>{nutrients.fat}g</Text>
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
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  searchButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
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
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
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
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
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
  portionInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
    fontWeight: '600',
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
  },
  mealTypeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  mealTypeText: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '600',
  },
  mealTypeTextActive: {
    color: '#FFFFFF',
  },
  nutrientsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  nutrientsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nutrientLabel: {
    fontSize: 16,
    color: '#AAAAAA',
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
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