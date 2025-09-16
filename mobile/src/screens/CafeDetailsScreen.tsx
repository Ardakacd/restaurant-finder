import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Dimensions } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { apiService } from '../services/api';

const { width: screenWidth } = Dimensions.get('window');

type CafeDetailsRouteProp = RouteProp<RootStackParamList, 'CafeDetails'>;

export default function CafeDetailsScreen() {
  const route = useRoute<CafeDetailsRouteProp>();
  const { cafe } = route.params;
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    checkFavoriteStatus();
  }, [cafe.id]);

  const checkFavoriteStatus = async () => {
    try { 
      const isFav = await apiService.isFavorite(cafe.id);
      setIsFavorite(isFav);
    } catch (error) {
      setIsFavorite(false);
    }
  };

  const toggleFavorite = async () => {
    setFavoriteLoading(true);
    try {
      const wasAdded = await apiService.toggleFavorite(cafe.id);
      setIsFavorite(wasAdded);
      Alert.alert('Success', wasAdded ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      Alert.alert('Error', 'Please login to manage favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const renderPhoto = (item: string, index: number) => (
    <View key={index} style={styles.photoContainer}>
      <Image 
        source={{ uri: item }} 
        style={styles.photoImage}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {cafe.photos && cafe.photos.length > 0 && (
            <View style={styles.photosSection}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                  setCurrentPhotoIndex(index);
                }}
                style={styles.photoScrollView}
              >
                {cafe.photos.map((photo, index) => renderPhoto(photo, index))}
              </ScrollView>
              {cafe.photos.length > 1 && (
                <View style={styles.photoIndicators}>
                  {cafe.photos.map((_, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.photoIndicator, 
                        index === currentPhotoIndex && styles.activePhotoIndicator
                      ]} 
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          <Card style={styles.headerCard}>
            <Card.Content>
              <View style={styles.header}>
                <View style={styles.titleSection}>
                  <Text variant="headlineSmall" style={styles.cafeName}>
                    {cafe.name}
                  </Text>
                  <Text variant="bodyMedium" style={styles.address}>
                    {cafe.address}
                  </Text>
                  <View style={styles.headerDetails}>
                    {cafe.rating && (
                      <View style={styles.ratingContainer}>
                        <View style={styles.starContainer}>
                          <Text style={styles.starIcon}>★</Text>
                        </View>
                        <Text style={styles.ratingText}>{cafe.rating}</Text>
                        <Text style={styles.ratingLabel}>rating</Text>
                      </View>
                    )}
                    {cafe.primary_type && (
                      <View style={styles.typeContainer}>
                        <View style={styles.typeDot} />
                        <Text style={styles.typeText}>{cafe.primary_type}</Text>
                      </View>
                    )}
                    {cafe.opening_hours?.openNow !== undefined && (
                      <View style={[styles.statusContainer, cafe.opening_hours.openNow ? styles.openStatus : styles.closedStatus]}>
                        <View style={[styles.statusIndicator, cafe.opening_hours.openNow ? styles.openIndicator : styles.closedIndicator]} />
                        <Text style={[styles.statusText, cafe.opening_hours.openNow ? styles.openText : styles.closedText]}>
                          {cafe.opening_hours.openNow ? 'Open now' : 'Closed'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>

          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              icon={isFavorite ? "heart" : "heart-outline"}
              onPress={toggleFavorite}
              loading={favoriteLoading}
              style={[styles.actionButton, isFavorite && styles.favoriteButton]}
            >
              {isFavorite ? 'In Favorites' : 'Add to Favorites'}
            </Button>
          </View>

          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Contact Information
              </Text>
              {cafe.phone && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Phone:</Text>
                  <Text variant="bodyMedium">{cafe.phone}</Text>
                </View>
              )}
              {cafe.business_status && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Status:</Text>
                  <Text variant="bodyMedium">{cafe.business_status}</Text>
                </View>
              )}
              {cafe.primary_type && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Type:</Text>
                  <Text variant="bodyMedium" style={styles.capitalize}>{cafe.primary_type}</Text>
                </View>
              )}
              {cafe.google_maps_uri && (
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Maps:</Text>
                  <Text variant="bodyMedium" style={styles.linkText}>Open in Google Maps</Text>
                </View>
              )}
            </Card.Content>
          </Card>

          {cafe.price_range && (
            <Card style={styles.infoCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Price Range
                </Text>
                <View style={styles.priceContainer}>
                  <Text variant="bodyMedium" style={styles.priceText}>
                    {cafe.price_range.startPrice?.units || '?'}-{cafe.price_range.endPrice?.units || '?'} {cafe.price_range.startPrice?.currencyCode || cafe.price_range.endPrice?.currencyCode || ''}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}

          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Services & Features
              </Text>
              <View style={styles.servicesGrid}>
                {cafe.delivery !== null && (
                  <View style={styles.serviceItem}>
                    <View style={[styles.serviceIcon, cafe.delivery ? styles.availableService : styles.unavailableService]}>
                      <Text style={styles.serviceIconText}>{cafe.delivery ? '✓' : '✕'}</Text>
                    </View>
                    <Text style={[styles.serviceLabel, cafe.delivery ? styles.availableLabel : styles.unavailableLabel]}>
                      Delivery
                    </Text>
                  </View>
                )}
                {cafe.reservable !== null && (
                  <View style={styles.serviceItem}>
                    <View style={[styles.serviceIcon, cafe.reservable ? styles.availableService : styles.unavailableService]}>
                      <Text style={styles.serviceIconText}>{cafe.reservable ? '✓' : '✕'}</Text>
                    </View>
                    <Text style={[styles.serviceLabel, cafe.reservable ? styles.availableLabel : styles.unavailableLabel]}>
                      Reservations
                    </Text>
                  </View>
                )}
                {cafe.serves_breakfast !== null && (
                  <View style={styles.serviceItem}>
                    <View style={[styles.serviceIcon, cafe.serves_breakfast ? styles.availableService : styles.unavailableService]}>
                      <Text style={styles.serviceIconText}>{cafe.serves_breakfast ? '✓' : '✕'}</Text>
                    </View>
                    <Text style={[styles.serviceLabel, cafe.serves_breakfast ? styles.availableLabel : styles.unavailableLabel]}>
                      Breakfast
                    </Text>
                  </View>
                )}
                {cafe.serves_lunch !== null && (
                  <View style={styles.serviceItem}>
                    <View style={[styles.serviceIcon, cafe.serves_lunch ? styles.availableService : styles.unavailableService]}>
                      <Text style={styles.serviceIconText}>{cafe.serves_lunch ? '✓' : '✕'}</Text>
                    </View>
                    <Text style={[styles.serviceLabel, cafe.serves_lunch ? styles.availableLabel : styles.unavailableLabel]}>
                      Lunch
                    </Text>
                  </View>
                )}
                {cafe.serves_dinner !== null && (
                  <View style={styles.serviceItem}>
                    <View style={[styles.serviceIcon, cafe.serves_dinner ? styles.availableService : styles.unavailableService]}>
                      <Text style={styles.serviceIconText}>{cafe.serves_dinner ? '✓' : '✕'}</Text>
                    </View>
                    <Text style={[styles.serviceLabel, cafe.serves_dinner ? styles.availableLabel : styles.unavailableLabel]}>
                      Dinner
                    </Text>
                  </View>
                )}
                {cafe.allows_dogs !== null && (
                  <View style={styles.serviceItem}>
                    <View style={[styles.serviceIcon, cafe.allows_dogs ? styles.availableService : styles.unavailableService]}>
                      <Text style={styles.serviceIconText}>{cafe.allows_dogs ? '🐕' : '✕'}</Text>
                    </View>
                    <Text style={[styles.serviceLabel, cafe.allows_dogs ? styles.availableLabel : styles.unavailableLabel]}>
                      Pet-friendly
                    </Text>
                  </View>
                )}
                {cafe.serves_vegetarian_food !== null && (
                  <View style={styles.serviceItem}>
                    <View style={[styles.serviceIcon, cafe.serves_vegetarian_food ? styles.availableService : styles.unavailableService]}>
                      <Text style={styles.serviceIconText}>{cafe.serves_vegetarian_food ? '🌱' : '✕'}</Text>
                    </View>
                    <Text style={[styles.serviceLabel, cafe.serves_vegetarian_food ? styles.availableLabel : styles.unavailableLabel]}>
                      Vegetarian
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>

          {cafe.opening_hours?.weekdayDescriptions && (
            <Card style={styles.infoCard}>
              <Card.Content >
                <View style={styles.sectionHeader}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Opening Hours
                  </Text>
                </View>
                {cafe.opening_hours.weekdayDescriptions.map((hours, index) => (
                  <Text key={index} variant="bodyMedium" style={styles.hoursText}>
                    {hours}
                  </Text>
                ))}
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  cafeName: {
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  address: {
    color: '#7f8c8d',
  },
  ratingChip: {
    backgroundColor: '#f39c12',
  },
  actionButtons: {
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#3498db',
  },
  favoriteButton: {
    backgroundColor: '#e74c3c',
  },
  infoCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 80,
    color: '#2c3e50',
  },
  hoursText: {
    marginBottom: 4,
    color: '#2c3e50',
  },
  reviewsCard: {
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  reviewRating: {
    backgroundColor: '#f39c12',
  },
  reviewText: {
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewDate: {
    color: '#7f8c8d',
  },
  reviewDivider: {
    marginBottom: 16,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  linkText: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  priceText: {
    fontWeight: '700',
    color: '#27ae60',
    fontSize: 16,
  },
  headerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starContainer: {
    backgroundColor: '#f39c12',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  ratingLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 2,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3498db',
  },
  typeText: {
    fontSize: 14,
    color: '#7f8c8d',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 6,
  },
  openStatus: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  closedStatus: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
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
    fontSize: 13,
    fontWeight: '600',
  },
  openText: {
    color: '#27ae60',
  },
  closedText: {
    color: '#e74c3c',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  serviceItem: {
    alignItems: 'center',
    minWidth: 80,
    gap: 8,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableService: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  unavailableService: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  serviceIconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  serviceLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  availableLabel: {
    color: '#27ae60',
  },
  unavailableLabel: {
    color: '#e74c3c',
  },
  photosSection: {
    marginBottom: 20,
  },
  photoScrollView: {
    height: 200,
  },
  photoContainer: {
    width: screenWidth - 40,
    height: 200,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  photoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(52, 152, 219, 0.3)',
  },
  activePhotoIndicator: {
    backgroundColor: '#3498db',
  },
});
