import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { User } from '../types';
import { apiService } from '../services/api';
import * as SecureStore from 'expo-secure-store';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isLoggedIn) {
        checkAuthStatus();
      }
    });

    return unsubscribe;
  }, [navigation, isLoggedIn]);

  const checkAuthStatus = async () => {
    try {
      const hasToken = await apiService.checkToken();
      setIsLoggedIn(hasToken);
      
      if (hasToken) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          
          try {
            const favorites = await apiService.getFavorites();
          } catch (favError) {
            console.error('Failed to fetch favorites:', favError);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          const storedUserName = await SecureStore.getItemAsync('user_name');
          if (storedUserName) {
            setUser({
              user_id: 'unknown',
              email: 'unknown',
              name: storedUserName
            });
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                await apiService.logout(true);
                setIsLoggedIn(false);
                setUser(null);
              } catch (error) {
                console.error('Logout error:', error);
                Alert.alert('Error', 'Failed to logout');
              }
            },
          },
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Card style={styles.welcomeCard}>
            <Card.Content style={styles.welcomeContent}>
              <Avatar.Icon size={80} icon="account" style={styles.avatar} />
              <Text variant="headlineSmall" style={styles.welcomeTitle}>
                Welcome to Cafe Finder
              </Text>
              <Text variant="bodyMedium" style={styles.welcomeSubtitle}>
                Sign in to save your favorite cafes and get personalized recommendations
              </Text>
              
              <View style={styles.authButtons}>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Login')}
                  style={styles.loginButton}
                >
                  Sign In
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('Register')}
                  style={styles.registerButton}
                >
                  Create Account
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={80} 
                label={user?.name.substring(0, 2).toUpperCase() || 'U'} 
                style={styles.profileAvatar}
              />
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.userName}>
                  {user?.name || 'User'}
                </Text>
                <Text variant="bodyMedium" style={styles.userEmail}>
                  {user?.email}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.menuCard}>
          <Card.Content>
            <Button
              mode="text"
              icon="heart"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Favorites' })}
              style={styles.menuItem}
              contentStyle={styles.menuItemContent}
            >
              My Favorites
            </Button>

          </Card.Content>
        </Card>

        <Button
          mode="outlined"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor="#e74c3c"
        >
          Logout
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    elevation: 4,
  },
  welcomeContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatar: {
    backgroundColor: '#3498db',
    marginBottom: 24,
  },
  welcomeTitle: {
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  welcomeSubtitle: {
    marginBottom: 32,
    textAlign: 'center',
    color: '#7f8c8d',
    paddingHorizontal: 20,
  },
  authButtons: {
    width: '100%',
    gap: 12,
  },
  loginButton: {
    backgroundColor: '#3498db',
  },
  registerButton: {
    borderColor: '#27ae60',
  },
  profileCard: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    backgroundColor: '#3498db',
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  userEmail: {
    color: '#7f8c8d',
  },
  statItem: {
    alignItems: 'center',
  },
  menuCard: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  menuItem: {
    justifyContent: 'flex-start',
    paddingVertical: 8,
  },
  menuItemContent: {
    justifyContent: 'flex-start',
  },
  logoutButton: {
    borderColor: '#e74c3c',
  },
});
