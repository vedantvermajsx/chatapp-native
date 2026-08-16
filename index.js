import 'react-native-get-random-values';
import './src/utils/crypto';
import { registerRootComponent } from 'expo';
import { registerFirebaseBackgroundHandler } from './src/services/firebaseBackgroundHandler';

import App from './App';

registerFirebaseBackgroundHandler();

registerRootComponent(App);
