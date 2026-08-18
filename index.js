import 'react-native-get-random-values';
import './src/utils/crypto';
import { registerRootComponent } from 'expo';
import { registerFirebaseBackgroundHandler } from './src/services/firebaseBackgroundHandler';

import App from './App';

try {
  registerFirebaseBackgroundHandler();
} catch (error) {
}

try {
  registerRootComponent(App);
} catch (error) {
  console.log('[index] Error registering root component:', error);
}
