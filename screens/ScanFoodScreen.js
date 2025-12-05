import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Camera } from 'expo-camera';
import { auth, db } from '../firebase';
import { doc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { GOOGLE_VISION_API_KEY } from '../config';

const { width } = Dimensions.get('window');

// Food detection keywords to filter Google Vision API results
const FOOD_KEYWORDS = [
  'food', 'dish', 'meal', 'snack', 'bread', 'fruit', 'vegetable',
  'meat', 'fish', 'chicken', 'beef', 'pork', 'rice', 'pasta', 'salad',
  'soup', 'sauce', 'cheese', 'milk', 'egg', 'beans', 'nuts', 'dessert',
  'beverage', 'drink', 'juice', 'smoothie', 'yogurt', 'cereal', 'breakfast',
  'lunch', 'dinner', 'snack', 'ingredient'
];

// Meal type translations
const MEAL_TYPE_TRANSLATIONS = {
  breakfast: 'Pequeno-almoço',
  lunch: 'Almoço',
  dinner: 'Jantar',
  snack: 'Snack'
};

const MEAL_TYPE_KEYS = Object.keys(MEAL_TYPE_TRANSLATIONS);
const MEAL_TYPE_OPTIONS = MEAL_TYPE_KEYS.map(key => MEAL_TYPE_TRANSLATIONS[key]);

export default function ScanFoodScreen({ navigation }) {
  const [mode, setMode] = useState('initial'); // initial, camera, processing, results
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [detectedLabels, setDetectedLabels] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [portion, setPortion] = useState('100');
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const [loading, setLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Convert image to base64
  const imageToBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  // Call Google Vision API
  const callGoogleVision = async (base64Image) => {
    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Image },
                features: [
                  { type: 'LABEL_DETECTION', maxResults: 15 },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (data.responses && data.responses[0].labelAnnotations) {
        // Filter labels to only food-related ones
        const foodLabels = data.responses[0].labelAnnotations
          .filter(label => {
            const desc = label.description.toLowerCase();
            return FOOD_KEYWORDS.some(keyword => desc.includes(keyword));
          })
          .slice(0, 5)
          .map(label => label.description);

        return foodLabels;
      }

      return [];
    } catch (error) {
      console.error('Error calling Google Vision API:', error);
      throw error;
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.cancelled && result.assets && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erro', 'Erro ao seleccionar imagem');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    if (!cameraPermission) {
      Alert.alert('Permissão', 'Necessária permissão para usar a câmara');
      return;
    }

    setMode('camera');
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.cancelled && result.assets && result.assets[0]) {
        await processImage(result.assets[0].uri);
      } else {
        setMode('initial');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Erro', 'Erro ao tirar foto');
      setMode('initial');
    }
  };

  // Process image: convert to base64 and call Vision API
  const processImage = async (uri) => {
    try {
      setMode('processing');
      setLoading(true);

      // Convert to base64
      const base64 = await imageToBase64(uri);
      setImageUri(uri);
      setImageBase64(base64);

      // Call Google Vision API
      const labels = await callGoogleVision(base64);

      if (labels.length === 0) {
        Alert.alert(
          'Sem resultados',
          'Não foi possível detectar alimentos na imagem. Tenta outra foto.'
        );
        setMode('initial');
        setImageUri(null);
        setImageBase64(null);
      } else {
        setDetectedLabels(labels);
        setSelectedLabel(labels[0]); // Select first label by default
        setMode('results');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Erro', 'Erro ao processar imagem');
      setMode('initial');
    } finally {
      setLoading(false);
    }
  };

  // Search for selected label in OpenFoodFacts
  const searchLabel = async () => {
    if (!selectedLabel) return;

    try {
      setLoading(true);

      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
          selectedLabel
        )}&page_size=10&json=true&fields=product_name,nutriments,image_url,brands`
      );

      const data = await response.json();

      if (data.products && data.products.length > 0) {
        // Filter products that have nutritional data
        const validProducts = data.products.filter(
          p => p.nutriments && (p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal'])
        );

        if (validProducts.length === 0) {
          Alert.alert('Sem resultados', 'Nenhum produto com informação nutricional encontrado');
          setSearchResults([]);
        } else {
          setSearchResults(validProducts);
        }
      } else {
        Alert.alert('Sem resultados', 'Nenhum alimento encontrado para: ' + selectedLabel);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Erro', 'Erro ao pesquisar alimentos');
    } finally {
      setLoading(false);
    }
  };

  // Calculate nutrients
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

  // Save meal to Firestore
  const saveMeal = async () => {
    if (!selectedFood) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erro', 'Utilizador não autenticado');
      return;
    }

    const nutrients = calculateNutrients();
    const today = new Date().toISOString().split('T')[0];
    const mealTypeKey = MEAL_TYPE_KEYS[MEAL_TYPE_OPTIONS.indexOf(selectedMealType)];

    try {
      setLoading(true);

      // Save meal
      const mealRef = doc(db, 'users', user.uid, 'meals', `${Date.now()}`);
      await setDoc(mealRef, {
        name: selectedFood.product_name || 'Alimento',
        brand: selectedFood.brands || '',
        calories: nutrients.calories,
        protein: nutrients.protein,
        carbs: nutrients.carbs,
        fat: nutrients.fat,
        portion: `${portion}g`,
        mealType: mealTypeKey, // Store as English key
        timestamp: serverTimestamp(),
        date: today,
        scanned: true,
      });

      // Update daily stats
      const statsRef = doc(db, 'users', user.uid, 'dailyStats', today);
      await updateDoc(statsRef, {
        caloriesConsumed: increment(nutrients.calories),
        proteinConsumed: increment(nutrients.protein),
        carbsConsumed: increment(nutrients.carbs),
        fatConsumed: increment(nutrients.fat),
        date: today,
      }).catch(async (error) => {
        if (error.code === 'not-found') {
          // Create new daily stats if doesn't exist
          await setDoc(statsRef, {
            caloriesConsumed: nutrients.calories,
            proteinConsumed: nutrients.protein,
            carbsConsumed: nutrients.carbs,
            fatConsumed: nutrients.fat,
            date: today,
          });
        }
      });

      Alert.alert(
        'Sucesso!',
        `${selectedFood.product_name} adicionado com sucesso!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Erro', 'Erro ao guardar refeição');
    } finally {
      setLoading(false);
    }
  };

  // Render initial screen
  const renderInitial = () => (
    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
      <View style={styles.iconContainer}>
        <Ionicons name="camera" size={80} color="#FF6B35" />
      </View>
      <Text style={styles.title}>Digitalizar Alimento</Text>
      <Text style={styles.subtitle}>
        Tira uma foto ou selecciona uma imagem para digitalizar o alimento
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
          <Ionicons name="camera" size={24} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Tirar Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
          <Ionicons name="image" size={24} color="#FF6B35" />
          <Text style={styles.secondaryButtonText}>Galeria</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Render processing screen
  const renderProcessing = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color="#FF6B35" />
      <Text style={styles.processingText}>A analisar imagem...</Text>
    </View>
  );

  // Render results screen
  const renderResults = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* Image Preview */}
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
      )}

      {/* Detected Labels */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alimentos Detectados</Text>
        <View style={styles.labelsContainer}>
          {detectedLabels.map((label, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.labelButton,
                selectedLabel === label && styles.labelButtonActive
              ]}
              onPress={() => setSelectedLabel(label)}
            >
              <Text style={[
                styles.labelButtonText,
                selectedLabel === label && styles.labelButtonTextActive
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search Button */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={searchLabel}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="search" size={20} color="#FFFFFF" />
            <Text style={styles.searchButtonText}>Pesquisar</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Search Results */}
      {!loading && searchResults.length > 0 && !selectedFood && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resultados ({searchResults.length})</Text>
          {searchResults.map((food, index) => (
            <TouchableOpacity
              key={index}
              style={styles.foodCard}
              onPress={() => setSelectedFood(food)}
            >
              {food.image_url && (
                <Image source={{ uri: food.image_url }} style={styles.foodImage} />
              )}
              <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={2}>
                  {food.product_name || 'Sem nome'}
                </Text>
                {food.brands && (
                  <Text style={styles.foodBrand} numberOfLines={1}>
                    {food.brands}
                  </Text>
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

      {/* Food Details */}
      {selectedFood && (
        <View style={styles.section}>
          {selectedFood.image_url && (
            <Image source={{ uri: selectedFood.image_url }} style={styles.detailImage} />
          )}

          <Text style={styles.detailName}>{selectedFood.product_name}</Text>
          {selectedFood.brands && (
            <Text style={styles.detailBrand}>{selectedFood.brands}</Text>
          )}

          {/* Portion Input */}
          <View style={styles.portionSection}>
            <Text style={styles.label}>Porção (gramas)</Text>
            <View style={styles.portionInput}>
              <TextInput
                style={styles.input}
                value={portion}
                onChangeText={setPortion}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor="#666"
              />
              <Text style={styles.inputUnit}>g</Text>
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedFood(null)}
            >
              <Ionicons name="arrow-back" size={20} color="#FF6B35" />
              <Text style={styles.backButtonText}>Voltar aos resultados</Text>
            </TouchableOpacity>
          </View>

          {/* Meal Type Selector */}
          <View style={styles.mealTypeSection}>
            <Text style={styles.label}>Tipo de Refeição</Text>
            <View style={styles.mealTypeButtons}>
              {MEAL_TYPE_OPTIONS.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeButton,
                    selectedMealType === type && styles.mealTypeButtonActive
                  ]}
                  onPress={() => setSelectedMealType(type)}
                >
                  <Text style={[
                    styles.mealTypeText,
                    selectedMealType === type && styles.mealTypeTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Nutritional Info */}
          {calculateNutrients() && (
            <View style={styles.nutrientsCard}>
              <Text style={styles.nutrientsTitle}>Informação Nutricional ({portion}g)</Text>
              <View style={styles.nutrientRow}>
                <Text style={styles.nutrientLabel}>Calorias</Text>
                <Text style={styles.nutrientValue}>{calculateNutrients().calories} kcal</Text>
              </View>
              <View style={styles.nutrientRow}>
                <Text style={styles.nutrientLabel}>Proteína</Text>
                <Text style={styles.nutrientValue}>{calculateNutrients().protein}g</Text>
              </View>
              <View style={styles.nutrientRow}>
                <Text style={styles.nutrientLabel}>Carboidratos</Text>
                <Text style={styles.nutrientValue}>{calculateNutrients().carbs}g</Text>
              </View>
              <View style={styles.nutrientRow}>
                <Text style={styles.nutrientLabel}>Gordura</Text>
                <Text style={styles.nutrientValue}>{calculateNutrients().fat}g</Text>
              </View>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveMeal}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Adicionar Refeição</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIconButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FF6B35" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digitalizar</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      {mode === 'processing' && renderProcessing()}
      {(mode === 'initial' || mode === 'camera') && renderInitial()}
      {mode === 'results' && renderResults()}

      <StatusBar style="light" />
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backIconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#AAAAAA',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  secondaryButtonText: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  labelButton: {
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  labelButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  labelButtonText: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '600',
  },
  labelButtonTextActive: {
    color: '#FFFFFF',
  },
  searchButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    paddingVertical: 16,
  },
  inputUnit: {
    color: '#AAAAAA',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(26, 26, 26, 0.6)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
});
