# THRIV - AI Assistant Documentation

## Project Overview

**THRIV** is a React Native mobile fitness and nutrition tracking application built with Expo. The app helps users track their daily nutrition (calories, protein, carbs, fats), water intake, workouts, and fitness progress. It features Firebase authentication and Firestore database integration, with Portuguese language support.

**Current Status**: Working MVP with Firebase authentication, nutrition tracking via OpenFoodFacts API, and basic home screen functionality.

---

## Tech Stack

### Core Framework
- **React Native**: 0.81.5 (via Expo)
- **React**: 19.1.0
- **Expo SDK**: ~54.0.25

### Navigation
- **@react-navigation/native**: 7.1.24
- **@react-navigation/native-stack**: 7.8.5
- **@react-navigation/bottom-tabs**: 7.8.11

### Backend & Database
- **Firebase**: 11.0.2
  - Firebase Authentication (email/password)
  - Firestore Database
  - AsyncStorage persistence for React Native

### UI & Animations
- **@expo/vector-icons**: 15.0.3 (Ionicons)
- **expo-linear-gradient**: 15.0.7
- **react-native-reanimated**: 3.16.3
- **expo-haptics**: 15.0.7

### External APIs
- **OpenFoodFacts API**: For food nutrition data lookup

### Utilities
- **date-fns**: 4.1.0
- **@react-native-async-storage/async-storage**: 2.1.0

---

## Project Structure

```
/THRIV
├── App.js                      # Main app entry, navigation setup, auth state
├── firebase.js                 # Firebase configuration and initialization
├── index.js                    # Root entry point
├── package.json                # Dependencies and scripts
├── app.json                    # Expo configuration
├── babel.config.js             # Babel configuration
├── metro.config.js             # Metro bundler configuration
├── GoogleService-Info.plist    # iOS Firebase config
│
├── /assets                     # Images, icons, splash screens
│   ├── Logo_THRIV.png
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
│
└── /screens                    # All screen components
    ├── OnboardingScreen.js     # First-time user onboarding
    ├── SignupScreen.js         # User registration
    ├── LoginScreen.js          # User login
    ├── PaywallInitialScreen.js # Subscription paywall
    ├── HomeScreen.js           # Main dashboard
    ├── NutritionScreen.js      # Nutrition tracking (placeholder)
    ├── WorkoutsScreen.js       # Workout tracking (placeholder)
    ├── ProfessionalsScreen.js  # Professional services (placeholder)
    ├── ProfileScreen.js        # User profile (placeholder)
    ├── AddFoodScreen.js        # Food search and logging
    ├── ScanFoodScreen.js       # Barcode scanning (placeholder)
    ├── LogWorkoutScreen.js     # Workout logging (placeholder)
    └── ProgressScreen.js       # Progress tracking (placeholder)
```

---

## Navigation Architecture

### Stack Navigator (Root)
The app uses a nested navigation structure:

1. **Auth Flow** (not authenticated):
   - Onboarding → Signup → Login → PaywallInitial

2. **Main Flow** (authenticated):
   - MainTabs (Bottom Tab Navigator)
   - Modal screens accessible from anywhere

### Bottom Tab Navigator (MainTabs)
Located at: `App.js:29-104`

Five main tabs:
- **HomeTab** → HomeScreen (label: "Início")
- **NutritionTab** → NutritionScreen (label: "Nutrição")
- **WorkoutsTab** → WorkoutsScreen (label: "Treinos")
- **ProfessionalsTab** → ProfessionalsScreen (label: "Profissionais")
- **ProfileTab** → ProfileScreen (label: "Perfil")

### Modal Screens
Presented as modals over the main navigation:
- **ScanFood** - Barcode scanning
- **AddFood** - Food search and logging
- **LogWorkout** - Workout entry
- **Progress** - Progress visualization

### Authentication Flow
- On app start, `onAuthStateChanged` listener checks auth state (`App.js:110-121`)
- If user exists → navigate to `MainTabs`
- If no user → navigate to `Onboarding`
- Uses `navigation.replace()` for auth transitions to prevent back navigation

---

## Firebase Setup

### Configuration
File: `firebase.js`

```javascript
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Firestore
const db = getFirestore(app);

export { auth, db };
```

### Firestore Data Structure

```
/users/{userId}
  ├── name: string
  ├── email: string
  ├── createdAt: timestamp
  │
  ├── /dailyStats/{YYYY-MM-DD}
  │   ├── caloriesConsumed: number
  │   ├── proteinConsumed: number
  │   ├── waterGlasses: number
  │   └── date: string
  │
  └── /meals/{timestamp}
      ├── name: string
      ├── brand: string
      ├── calories: number
      ├── protein: number
      ├── carbs: number
      ├── fat: number
      ├── portion: string
      ├── mealType: string
      ├── timestamp: serverTimestamp
      └── date: string (YYYY-MM-DD)
```

### Common Firebase Patterns

**Reading user data:**
```javascript
const user = auth.currentUser;
const userDoc = await getDoc(doc(db, 'users', user.uid));
const userData = userDoc.data();
```

**Updating daily stats:**
```javascript
const today = new Date().toISOString().split('T')[0];
const statsRef = doc(db, 'users', user.uid, 'dailyStats', today);
await setDoc(statsRef, {
  caloriesConsumed: increment(value)
}, { merge: true });
```

**Creating meals:**
```javascript
const mealRef = doc(db, 'users', user.uid, 'meals', `${Date.now()}`);
await setDoc(mealRef, {
  // meal data
  timestamp: serverTimestamp(),
  date: today
});
```

---

## Design System

### Color Palette
- **Primary Orange**: `#FF6B35`
- **Background Black**: `#000000` or `#0D0D0D`
- **Card Background**: `#1A1A1A` or `rgba(26, 26, 26, 0.6)`
- **Border**: `#333333` or `rgba(255, 255, 255, 0.1)`
- **Text White**: `#FFFFFF`
- **Text Gray**: `#AAAAAA` (secondary), `#666666` (tertiary)

### Typography
- **Heavy titles**: fontWeight `'900'`, letterSpacing `-0.5`
- **Section titles**: fontSize `18-20`, fontWeight `'700'`
- **Body text**: fontSize `14-16`, fontWeight `'600'` or `'500'`
- **Labels**: fontSize `12-14`, color `#AAAAAA`

### Component Patterns

**Card with border:**
```javascript
{
  backgroundColor: 'rgba(26, 26, 26, 0.6)',
  borderRadius: 16-20,
  padding: 16-20,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)'
}
```

**Primary button:**
```javascript
{
  backgroundColor: '#FF6B35',
  paddingVertical: 16-18,
  borderRadius: 12-16,
  alignItems: 'center'
}
```

**Icon circle:**
```javascript
{
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: 'rgba(255, 107, 53, 0.2)',
  justifyContent: 'center',
  alignItems: 'center'
}
```

### Icons
Using **Ionicons** from `@expo/vector-icons`:
- Prefer outline variants for unfocused states
- Use filled variants for focused/active states
- Common icons:
  - `flame-outline` - Calories
  - `fitness-outline` - Protein/Workouts
  - `water-outline` - Water
  - `nutrition-outline` - Food
  - `barbell-outline` - Workouts

---

## Code Conventions

### File Structure
1. Imports (React Native, third-party, local)
2. Default export function component
3. Helper functions (if any)
4. StyleSheet at the bottom

### Component Patterns

**Loading states:**
```javascript
const [loading, setLoading] = useState(true);

if (loading) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF6B35" />
    </View>
  );
}
```

**Error handling with alerts:**
```javascript
try {
  // operation
} catch (error) {
  console.error('Error:', error);
  Alert.alert('Erro', 'Mensagem de erro em português');
}
```

**Navigation:**
```javascript
// Navigate to screen
navigation.navigate('ScreenName');

// Go back
navigation.goBack();

// Replace (for auth flows)
navigation.replace('MainTabs');
```

### State Management
- **Local state**: `useState` for component-level state
- **Auth state**: Global listener in `App.js`
- **No global state library**: Each screen manages its own data fetching

### Date Handling
- Use ISO date format for Firestore: `new Date().toISOString().split('T')[0]` → `"YYYY-MM-DD"`
- Manual Portuguese date formatting in HomeScreen (see `App.js:19-23`)
- Consider using `date-fns` for more complex formatting

---

## External API Integration

### OpenFoodFacts API
Used in: `AddFoodScreen.js:27-56`

**Endpoint:**
```
https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&page_size=20&json=true&fields=product_name,nutriments,image_url,brands
```

**Response structure:**
```javascript
{
  products: [
    {
      product_name: string,
      brands: string,
      image_url: string,
      nutriments: {
        'energy-kcal_100g': number,
        'proteins_100g': number,
        'carbohydrates_100g': number,
        'fat_100g': number
      }
    }
  ]
}
```

**Usage pattern:**
1. Search for food by name
2. Filter products with valid nutritional data
3. Display results
4. User selects food and enters portion size
5. Calculate nutrients based on portion
6. Save to Firestore

---

## Development Workflows

### Starting the Development Server
```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run in web browser
```

### Common Development Tasks

#### Adding a New Screen
1. Create file in `/screens/` (e.g., `NewScreen.js`)
2. Import in `App.js`
3. Add to navigator:
   ```javascript
   <Stack.Screen
     name="NewScreen"
     component={NewScreen}
     options={{ presentation: 'modal' }} // if modal
   />
   ```
4. Navigate using: `navigation.navigate('NewScreen')`

#### Adding Firebase Data
1. Define data structure in Firestore
2. Use `setDoc` with `merge: true` for updates
3. Use `increment()` for atomic number updates
4. Use `serverTimestamp()` for timestamps

#### Implementing a New Feature
1. Check if placeholder screen exists
2. Read relevant code in similar screens (e.g., HomeScreen, AddFoodScreen)
3. Follow existing patterns for:
   - Loading states
   - Error handling
   - Firebase operations
   - UI components
4. Use Portuguese for all user-facing text

---

## Authentication Patterns

### Signup Flow
File: `SignupScreen.js`
- Collect: name, email, password, confirmPassword
- Validate inputs
- `createUserWithEmailAndPassword(auth, email, password)`
- Create user document in Firestore
- Navigate to PaywallInitial or MainTabs

### Login Flow
File: `LoginScreen.js`
- Collect: email, password
- `signInWithEmailAndPassword(auth, email, password)`
- Handle Firebase error codes with Portuguese messages
- Navigate to MainTabs on success

### Logout
```javascript
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

await signOut(auth);
// Auth listener in App.js will handle navigation
```

---

## Testing & Debugging

### Debugging Firebase
- Check Firebase console for data structure
- Use `console.error()` for error logging
- Verify auth state: `auth.currentUser`

### Common Issues

**Firebase persistence:**
- Handled automatically via AsyncStorage
- Configured in `firebase.js:21-30`

**Navigation issues:**
- Use `navigation.replace()` for auth flows
- Use `navigation.navigate()` for regular navigation
- Check if screen is registered in navigator

**Metro bundler:**
- Clear cache: `expo start -c`
- Ensure `.cjs` and `.mjs` extensions are supported (see `metro.config.js`)

**Styling:**
- Check SafeAreaView if content is cut off
- Use `KeyboardAvoidingView` for forms
- Set `keyboardShouldPersistTaps="handled"` on ScrollView

---

## Current Limitations & TODOs

### Implemented Features
- ✅ Firebase Authentication (email/password)
- ✅ User registration and login
- ✅ Home dashboard with daily stats
- ✅ Food search via OpenFoodFacts
- ✅ Meal logging with nutrition tracking
- ✅ Water intake tracking
- ✅ Firestore data persistence

### Placeholder Screens (Not Implemented)
- ❌ ScanFoodScreen (barcode scanning)
- ❌ LogWorkoutScreen (workout entry)
- ❌ ProgressScreen (charts/graphs)
- ❌ NutritionScreen (full nutrition view)
- ❌ WorkoutsScreen (workout plans)
- ❌ ProfessionalsScreen (trainer/nutritionist directory)
- ❌ ProfileScreen (user settings)

### Known Limitations
- Google Sign-In not implemented
- Password reset not implemented
- No data visualization/charts
- No workout tracking
- No professional services integration
- No subscription/paywall implementation
- Daily stats not loaded from Firestore (only updated)

---

## Key Files Reference

### `App.js` (185 lines)
- Main navigation setup
- Auth state management
- Bottom tab navigator
- Stack navigator with all screens
- Global styling

### `firebase.js` (38 lines)
- Firebase initialization
- Auth with AsyncStorage persistence
- Firestore setup
- Exports: `auth`, `db`, `app`

### `screens/HomeScreen.js` (429 lines)
- Main dashboard
- User greeting with initials
- 2x2 stats grid (calories, protein, workout, water)
- Progress bars and water dots
- Quick action buttons
- Manual Portuguese date formatting

### `screens/AddFoodScreen.js` (554 lines)
- OpenFoodFacts API integration
- Food search interface
- Result display with images
- Portion size input
- Meal type selection
- Nutrition calculation
- Firestore meal logging

### `screens/LoginScreen.js` (253 lines)
- Email/password login
- Firebase error handling
- Portuguese error messages
- Google Sign-In placeholder

### `screens/SignupScreen.js`
- User registration
- Form validation
- Firestore user document creation

---

## Best Practices for AI Assistants

### When Adding Features
1. **Read existing code first** - Check similar screens for patterns
2. **Follow Portuguese naming** - All UI text must be in Portuguese
3. **Use existing design patterns** - Match color scheme and component styles
4. **Handle loading states** - Always show ActivityIndicator during async operations
5. **Error handling** - Use Alert.alert with Portuguese messages
6. **Console logging** - Use console.error for debugging

### When Modifying Firebase
1. **Check existing structure** - Follow the established data model
2. **Use merge: true** - When updating documents to avoid overwriting
3. **Use increment()** - For atomic number updates
4. **Use serverTimestamp()** - For accurate timestamps
5. **Include date field** - Store ISO date strings for daily grouping

### When Working with Navigation
1. **Register screens** - Add to Stack.Navigator in App.js
2. **Use correct method** - `navigate()` for normal, `replace()` for auth
3. **Modal presentation** - Use `options={{ presentation: 'modal' }}` for overlays
4. **Pass params** - Use `route.params` to access navigation parameters

### When Styling Components
1. **Match design system** - Use established colors and patterns
2. **Dark theme** - App uses dark mode exclusively
3. **Consistent spacing** - Use multiples of 4 (8, 12, 16, 20, 24, etc.)
4. **Border radius** - 8-12 for small elements, 16-20 for cards
5. **Font weights** - '900' for titles, '700' for buttons, '600' for labels

### Language Requirements
- **All user-facing text**: Portuguese (Portugal variant)
- **Code comments**: Can be in English
- **Console logs**: Can be in English
- **Error messages**: Must be in Portuguese

---

## Quick Reference

### Common Imports
```javascript
// React Native
import { StyleSheet, Text, View, TouchableOpacity, ScrollView,
         TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { useState, useEffect } from 'react';

// Navigation
import { useNavigation } from '@react-navigation/native';

// Icons
import { Ionicons } from '@expo/vector-icons';

// Firebase
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment,
         serverTimestamp, collection, query, where } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword,
         signOut } from 'firebase/auth';
```

### Common Commands
```bash
# Development
npm start              # Start dev server
npm start -- --clear   # Clear cache and start

# Expo
expo start             # Same as npm start
expo start -c          # Clear cache

# Platform-specific
expo start --android   # Android only
expo start --ios       # iOS only
expo start --web       # Web browser
```

---

## Git Workflow

### Branch Naming
- Feature branches: `claude/claude-md-{session-id}`
- Always develop on designated Claude branches
- Never push to main/master without explicit permission

### Commit Messages
- Use clear, descriptive messages
- Focus on "why" rather than "what"
- Examples:
  - "Add OpenFoodFacts API integration for food search"
  - "Fix water tracking increment logic"
  - "Update Firebase data structure for meals"

### Important Git Notes
- Current branch: `claude/claude-md-mirah4xkjrci0pe7-01Nkd83oHWJeXJ8LbE8yRXZW`
- Main branch: (to be determined)
- Recent commits show progression: Initial commit → Working MVP → AddFood feature

---

## Additional Resources

- **Expo Documentation**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **Firebase Web SDK**: https://firebase.google.com/docs/web/setup
- **OpenFoodFacts API**: https://world.openfoodfacts.org/data
- **Ionicons**: https://ionic.io/ionicons

---

**Last Updated**: December 4, 2025
**App Version**: 1.0.0 (MVP)
**Expo SDK**: ~54.0.25
