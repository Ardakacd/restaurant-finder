import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

class NavigationService {
  private navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

  setNavigationRef(ref: NavigationContainerRef<RootStackParamList>) {
    this.navigationRef = ref;
  }

  navigateToLogin() {
    if (this.navigationRef) {
      this.navigationRef.navigate('Login');
    }
  }

  navigateToMainTabs() {
    if (this.navigationRef) {
      this.navigationRef.navigate('MainTabs');
    }
  }
}

export const navigationService = new NavigationService();
