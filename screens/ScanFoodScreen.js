import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  TextInput
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../firebase';
import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { GOOGLE_VISION_API_KEY } from '../config';

export default function ScanFoodScreen({ navigation }) {
  const [processing, setProcessing] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [detectedLabels, setDetectedLabels] = useState([]);
  const [foodResults, setFoodResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [portion, setPortion] = useState('100');
  const [mealType, setMealType] = useState('Almoço');
  const [debugInfo, setDebugInfo] = useState('');

  const mealTypes = ['Pequeno-almoço', 'Almoço', 'Jantar', 'Snack'];

  const addDebug = (msg) => {
    console.log(msg);
    setDebugInfo(prev => prev + '\n' + msg);
  };

  // Request camera permission
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'É necessário acesso à câmara para tirar fotos.');
      return false;
    }
    return true;
  };

  // Request gallery permission
  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'É necessário acesso à galeria para escolher fotos.');
      return false;
    }
    return true;
  };

  // Take photo with camera
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true, // THIS IS KEY - get base64 directly without FileSystem
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        processImage(result.assets[0].base64);
      }
    } catch (error) {
      addDebug('Camera error: ' + error.message);
      Alert.alert('Erro', 'Erro ao tirar foto: ' + error.message);
    }
  };

  // Pick from gallery
  const pickImage = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true, // THIS IS KEY - get base64 directly without FileSystem
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        processImage(result.assets[0].base64);
      }
    } catch (error) {
      addDebug('Gallery error: ' + error.message);
      Alert.alert('Erro', 'Erro ao escolher imagem: ' + error.message);
    }
  };

  // Process image with Google Vision API
  const processImage = async (base64Image) => {
    setProcessing(true);
    setDetectedLabels([]);
    setFoodResults([]);
    setSelectedFood(null);
    setDebugInfo('');

    addDebug('Starting image processing...');

    try {
      // Call Google Vision API
      addDebug('Calling Google Vision API...');
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  {
                    type: 'LABEL_DETECTION',
                    maxResults: 10,
                  },
                ],
              },
            ],
          }),
        }
      );

      const visionData = await visionResponse.json();
      addDebug('Vision API response received');

      if (visionData.responses && visionData.responses[0].labelAnnotations) {
        const labels = visionData.responses[0].labelAnnotations;
        addDebug(`Found ${labels.length} labels`);

        // Filter food-related labels
        const foodKeywords = [
          'food', 'dish', 'meal', 'cuisine', 'recipe', 'ingredient',
          'snack', 'breakfast', 'lunch', 'dinner', 'dessert', 'fruit',
          'vegetable', 'meat', 'drink', 'beverage', 'bread', 'pasta',
          'rice', 'salad', 'soup', 'sandwich', 'pizza', 'burger'
        ];

        const foodLabels = labels.filter(label =>
          foodKeywords.some(keyword =>
            label.description.toLowerCase().includes(keyword)
          )
        );

        addDebug(`Filtered to ${foodLabels.length} food labels`);
        setDetectedLabels(foodLabels);

        if (foodLabels.length === 0) {
          Alert.alert(
            'Nenhuma Comida Detectada',
            'Não foi possível identificar comida na imagem. Tenta outra foto.'
          );
          setProcessing(false);
          return;
        }

        // Search for food in OpenFoodFacts using top label
        const topLabel = foodLabels[0].description;
        addDebug(`Searching OpenFoodFacts for: ${topLabel}`);
        await searchFoodInDatabase(topLabel);
      } else if (visionData.responses && visionData.responses[0].error) {
        const error = visionData.responses[0].error;
        addDebug(`Vision API error: ${error.message}`);
        Alert.alert('Erro API', `Google Vision Error: ${error.message}`);
      } else {
        addDebug('No labels found in response');
        Alert.alert('Erro', 'Não foi possível analisar a imagem.');
      }
    } catch (error) {
      addDebug('Error: ' + error.message);
      Alert.alert('Erro', 'Erro ao processar imagem: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Search OpenFoodFacts API
  const searchFoodInDatabase = async (query) => {
    try {
      addDebug('Calling OpenFoodFacts API...');
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&page_size=10&json=true&fields=product_name,nutriments,image_url,brands`
      );

      const data = await response.json();
      addDebug(`OpenFoodFacts returned ${data.products?.length || 0} products`);

      if (data.products && data.products.length > 0) {
        const validProducts = data.products.filter(p =>
          p.nutriments &&
          (p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal'])
        );
        addDebug(`${validProducts.length} products have nutritional data`);
        setFoodResults(validProducts);
      } else {
        addDebug('No products found');
        Alert.alert(
          'Sem Resultados',
          'Não foram encontrados alimentos na base de dados. Tenta adicionar manualmente.'
        );
      }
    } catch (error) {
      addDebug('OpenFoodFacts error: ' + error.message);
      Alert.alert('Erro', 'Erro ao buscar informação nutricional.');
    }
  };

  // Calculate nutrients based on portion
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
      Alert.alert('Erro', 'Tens que fazer login primeiro.');
      return;
    }

    const nutrients = calculateNutrients();
    const today = new Date().toISOString().split('T')[0];

    try {
      addDebug('Saving to Firestore...');

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
        scanned: true,
        imageUri: imageUri,
      });

      // Update daily stats
      const statsRef = doc(db, 'users', user.uid, 'dailyStats', today);
      await setDoc(statsRef, {
        caloriesConsumed: increment(nutrients.calories),
        proteinConsumed: increment(nutrients.protein),
        date: today,
      }, { merge: true });

      addDebug('Saved successfully!');
      Alert.alert(
        'Sucesso!',
        'Refeição adicionada com sucesso!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      addDebug('Save error: ' + error.message);
      Alert.alert('Erro', 'Erro ao guardar refeição: ' + error.message);
    }
  };

  // Reset and start over
  const reset = () => {
    setImageUri(null);
    setDetectedLabels([]);
    setFoodResults([]);
    setSelectedFood(null);
    setPortion('100');
    setDebugInfo('');
  };

  const nutrients = selectedFood ? calculateNutrients() : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Food</Text>
        {imageUri && (
          <TouchableOpacity onPress={reset}>
            <Ionicons name="refresh" size={24} color="#FF6B35" />
          </TouchableOpacity>
        )}
        {!imageUri && <View style={{ width: 24 }} />}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Initial State - Camera/Gallery buttons */}
        {!imageUri && (
          <View style={styles.initialState}>
            <View style={styles.iconContainer}>
              <Ionicons name="camera" size={64} color="#FF6B35" />
            </View>
            <Text style={styles.title}>Digitalizar Comida</Text>
            <Text style={styles.subtitle}>
              Tira uma foto ou escolhe da galeria para identificar comida automaticamente
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Tirar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={pickImage}
            >
              <Ionicons name="images" size={24} color="#FF6B35" />
              <Text style={styles.secondaryButtonText}>Escolher da Galeria</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Processing State */}
        {processing && (
          <View style={styles.processingState}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            )}
            <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
            <Text style={styles.processingText}>A processar imagem...</Text>
            <Text style={styles.processingSubtext}>
              A analisar com Google Vision API
            </Text>
          </View>
        )}

        {/* Results State */}
        {!processing && imageUri && !selectedFood && (
          <View>
            <Image source={{ uri: imageUri }} style={styles.resultImage} />

            {/* Detected Labels */}
            {detectedLabels.length > 0 && (
              <View style={styles.labelsSection}>
                <Text style={styles.sectionTitle}>Comida Detectada</Text>
                <View style={styles.labelsContainer}>
                  {detectedLabels.map((label, index) => (
                    <View key={index} style={styles.labelChip}>
                      <Text style={styles.labelText}>{label.description}</Text>
                      <Text style={styles.labelScore}>
                        {Math.round(label.score * 100)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Food Results */}
            {foodResults.length > 0 && (
              <View style={styles.resultsSection}>
                <Text style={styles.sectionTitle}>
                  Resultados ({foodResults.length})
                </Text>
                {foodResults.map((food, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.foodCard}
                    onPress={() => setSelectedFood(food)}
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
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Nutritional Info */}
            {nutrients && (
              <View style={styles.nutrientsCard}>
                <Text style={styles.nutrientsTitle}>
                  Informação Nutricional ({portion}g)
                </Text>
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

        {/* Debug Info */}
        {debugInfo.length > 0 && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <ScrollView style={styles.debugScroll}>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </ScrollView>
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

  // Initial State
  initialState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  secondaryButtonText: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },

  // Processing State
  processingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
    marginBottom: 24,
  },
  loader: {
    marginBottom: 16,
  },
  processingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  processingSubtext: {
    fontSize: 16,
    color: '#AAAAAA',
  },

  // Results State
  resultImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 24,
  },
  labelsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  labelScore: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '700',
  },
  resultsSection: {
    marginBottom: 24,
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

  // Details Section
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

  // Debug Section
  debugSection: {
    marginTop: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 8,
  },
  debugScroll: {
    maxHeight: 200,
  },
  debugText: {
    fontSize: 12,
    color: '#AAAAAA',
    fontFamily: 'monospace',
  },
});
