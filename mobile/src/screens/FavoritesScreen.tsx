import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { Cafe } from '../types';
import { apiService } from '../services/api';

type FavoritesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function FavoritesScreen() {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const [favorites, setFavorites] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const hasToken = await apiService.checkToken();
      setIsLoggedIn(hasToken);
      
      if (hasToken) {
        try {
          const favoritesResponse = await apiService.getFavorites();
          setFavorites(favoritesResponse.cafes);
        } catch (error) {
          console.error('Failed to load favorites:', error);
          setFavorites([]);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPriceRange = (priceRange: any) => {
    if (!priceRange) return null;
    const { startPrice, endPrice } = priceRange;
    if (startPrice && endPrice) {
      return `${startPrice.units}-${endPrice.units} ${startPrice.currencyCode}`;
    } else if (endPrice) {
      return `Up to ${endPrice.units} ${endPrice.currencyCode}`;
    } else if (startPrice) {
      return `From ${startPrice.units} ${startPrice.currencyCode}`;
    }
    return null;
  };

  const removeFavorite = async (cafeId: string) => {
    try {
      const wasAdded = await apiService.toggleFavorite(cafeId);
      if (!wasAdded) {
        setFavorites(prev => prev.filter(cafe => cafe.id !== cafeId));
        Alert.alert('Success', 'Removed from favorites');
      } else {
        Alert.alert('Error', 'Something went wrong');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove from favorites');
    }
  };

  const renderFavoriteItem = ({ item }: { item: Cafe }) => (
    <Card 
      style={styles.cafeCard}
      onPress={() => navigation.navigate('CafeDetails', { cafe: item })}
    >
      <Card.Content>
        <View style={styles.cafeHeader}>
          <View style={styles.cafeInfo}>
            <Text variant="titleMedium" style={styles.cafeName}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={styles.cafeAddress}>
              {item.address}
            </Text>
            <View style={styles.cafeDetails}>
              {item.rating && (
                <View style={styles.ratingContainer}>
                  <View style={styles.starContainer}>
                    <Text style={styles.starIcon}>★</Text>
                  </View>
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              )}
              {item.opening_hours?.openNow !== undefined && (
                <View style={[styles.statusContainer, item.opening_hours.openNow ? styles.openStatus : styles.closedStatus]}>
                  <View style={[styles.statusIndicator, item.opening_hours.openNow ? styles.openIndicator : styles.closedIndicator]} />
                  <Text style={[styles.statusText, item.opening_hours.openNow ? styles.openText : styles.closedText]}>
                    {item.opening_hours.openNow ? 'Open now' : 'Closed'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.priceRow}>
              {formatPriceRange(item.price_range) && (
                <Text variant="bodySmall" style={styles.priceRange}>
                  {formatPriceRange(item.price_range)}
                </Text>
              )}
              <Button 
                mode="text" 
                compact
                textColor="#e74c3c"
                onPress={() => removeFavorite(item.id)}
              >
                Remove
              </Button>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            Login Required
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Please login to view your favorite cafes
          </Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Login')}
            style={styles.loginButton}
          >
            Login
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Favorites Yet
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtitle}>
            Start exploring and add cafes to your favorites
          </Text>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            style={styles.exploreButton}
          >
            Explore Cafes
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Your Favorites
        </Text>
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
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
  title: {
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginBottom: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#3498db',
  },
  exploreButton: {
    backgroundColor: '#27ae60',
  },
  list: {
    flex: 1,
  },
  cafeCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    elevation: 3,
  },
  cafeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cafeInfo: {
    flex: 1,
    marginRight: 12,
  },
  cafeName: {
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  cafeAddress: {
    color: '#7f8c8d',
  },
  ratingChip: {
    backgroundColor: '#f39c12',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cafeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starContainer: {
    backgroundColor: '#f39c12',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  openStatus: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  closedStatus: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  openIndicator: {
    backgroundColor: '#2ecc71',
  },
  closedIndicator: {
    backgroundColor: '#e74c3c',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  openText: {
    color: '#27ae60',
  },
  closedText: {
    color: '#e74c3c',
  },
  priceRange: {
    color: '#7f8c8d',
    fontWeight: '500',
    marginTop: 4,
  },
});
