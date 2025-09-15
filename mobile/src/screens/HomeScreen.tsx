import React, { useState, useEffect } from 'react';
import { View, StyleSheet,  Alert } from 'react-native';
import { Text, Card, ActivityIndicator, Searchbar, Button } from 'react-native-paper';
import { FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { Cafe } from '../types';
import { apiService } from '../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(false);
  const [popularLoading, setPopularLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [topPlaces, setTopPlaces] = useState<Cafe[]>([]);

  useEffect(() => {
    
    const fetchTopPlaces = async () => {
      try {
      setPopularLoading(true);
      const topPlaces = await apiService.getTopPlaces();
      setTopPlaces(topPlaces.cafes);
      setPopularLoading(false);
      } catch (error: any) {
        setTopPlaces([]);
      } finally {
        setPopularLoading(false);
      }
    };
    
    if (!hasSearched) {
      fetchTopPlaces();
    }
    
  }, [hasSearched]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const searchResults = await apiService.searchCafes(searchQuery.trim());
      setCafes(searchResults.cafes);
    } catch (error: any) {
      console.error('Search error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to search cafes. Please try again.';
      Alert.alert('Error', errorMessage);
      setCafes([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePopularSearch = async (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    setHasSearched(true);
    
    try {
      const searchResults = await apiService.searchCafes(query);
      setCafes(searchResults.cafes);
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search cafes. Please try again.');
      setCafes([]);
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

  const renderCafeItem = ({ item }: { item: Cafe }) => (
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
              {item.primary_type && (
                <View style={styles.typeContainer}>
                  <View style={styles.typeDot} />
                  <Text style={styles.typeText}>{item.primary_type}</Text>
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
            {formatPriceRange(item.price_range) && (
              <Text variant="bodySmall" style={styles.priceRange}>
                {formatPriceRange(item.price_range)}
              </Text>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Find Your Perfect Cafe
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Discover amazing cafes in your area
        </Text>

        <Searchbar
          placeholder="Search for cafes..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchbar}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Searching cafes...</Text>
          </View>
        )}

        {hasSearched && !loading && (
          <View style={styles.resultsSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Search Results ({cafes.length})
            </Text>
            <FlatList
              data={cafes}
              renderItem={renderCafeItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    No cafes found. Try a different search term.
                  </Text>
                </View>
              }
            />
          </View>
        )}

        {!hasSearched && (
           popularLoading ? (
             <View style={styles.loadingContainer}>
               <ActivityIndicator size="large" />
               <Text style={styles.loadingText}>Loading popular places...</Text>
             </View>
           ) : (
            <FlatList
              data={topPlaces}
              renderItem={renderCafeItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View>
                  <Card style={styles.featuredCard}>
                    <Card.Content>
                      <Text variant="titleLarge" style={styles.cardTitle}>
                        Featured Today
                      </Text>
                      <Text variant="bodyMedium" style={styles.cardDescription}>
                        Discover handpicked cafes with great ambiance and excellent coffee
                      </Text>
                      <Button 
                        mode="contained" 
                        onPress={() => handlePopularSearch('cafe')}
                        style={styles.exploreButton}
                      >
                        Explore Now
                      </Button>
                    </Card.Content>
                  </Card>
                  {topPlaces.length > 0 && (
                    <View style={styles.popularSection}>
                      <Text variant="titleMedium" style={styles.sectionTitle}>
                        Popular Places
                      </Text>
                    </View>
                  )}
                </View>
              }
              contentContainerStyle={styles.flatListContent}
            />
           )
        )}
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
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d',
  },
  searchbar: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#7f8c8d',
  },
  resultsSection: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  cafeCard: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  cafeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cafeInfo: {
    flex: 1,
  },
  cafeName: {
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  cafeAddress: {
    color: '#7f8c8d',
    marginBottom: 8,
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
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3498db',
  },
  typeText: {
    fontSize: 13,
    color: '#7f8c8d',
    textTransform: 'capitalize',
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#7f8c8d',
    textAlign: 'center',
  },
  featuredCard: {
    marginBottom: 30,
    backgroundColor: '#ffffff',
    elevation: 4,
  },
  cardTitle: {
    marginBottom: 8,
    color: '#2c3e50',
  },
  cardDescription: {
    marginBottom: 16,
    color: '#7f8c8d',
  },
  exploreButton: {
    backgroundColor: '#3498db',
  },
  popularSection: {
    marginTop: 20,
  },
  popularCard: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  popularCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flatListContent: {
    paddingBottom: 20,
  },
});
