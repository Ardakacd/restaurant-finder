import { Cafe } from '../types';

export type RootStackParamList = {
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  CafeDetails: { cafe: Cafe };
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Favorites: undefined;
  Profile: undefined;
};
