import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Searchbar,
  FAB,
  Chip,
  Text,
  ActivityIndicator,
} from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/api';
import { Event, SearchFilters } from '../types';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const { user } = useAuth();

  useEffect(() => {
    loadEvents();
  }, [searchFilters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvents(searchFilters);
      setEvents(response.collection);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'No se pudieron cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleSearch = () => {
    const filters: SearchFilters = {};
    if (searchQuery.trim()) {
      filters.name = searchQuery.trim();
    }
    setSearchFilters(filters);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFilters({});
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return `$${numPrice.toLocaleString('es-AR')}`;
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}>
      <Card.Content>
        <Title style={styles.eventTitle}>{item.name}</Title>
        <Paragraph style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Paragraph>
        
        <View style={styles.eventInfo}>
          <Text style={styles.eventDate}>
            📅 {formatDate(item.start_date)}
          </Text>
          <Text style={styles.eventPrice}>
            💰 {formatPrice(item.price)}
          </Text>
          <Text style={styles.eventDuration}>
            ⏱️ {item.duration_in_minutes} min
          </Text>
        </View>

        {item.event_location && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              📍 {item.event_location.name}
            </Text>
            <Text style={styles.locationAddress}>
              {item.event_location.full_address}
            </Text>
          </View>
        )}

        <View style={styles.eventFooter}>
          <View style={styles.tagsContainer}>
            {item.tags?.map((tag) => (
              <Chip key={tag.id} style={styles.tag} textStyle={styles.tagText}>
                {tag.name}
              </Chip>
            ))}
          </View>
          
          <View style={styles.enrollmentInfo}>
            <Text style={styles.capacity}>
              👥 {item.max_assistance} personas
            </Text>
            <Text style={[
              styles.enrollmentStatus,
              { color: item.enabled_for_enrollment === '1' ? '#4CAF50' : '#F44336' }
            ]}>
              {item.enabled_for_enrollment === '1' ? '✅ Inscripciones abiertas' : '❌ Inscripciones cerradas'}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando eventos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar eventos..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
        />
        {searchQuery.length > 0 && (
          <Button onPress={clearSearch} mode="text" compact>
            Limpiar
          </Button>
        )}
      </View>

      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No se encontraron eventos con esa búsqueda' : 'No hay eventos disponibles'}
            </Text>
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('CreateEvent')}
        label="Crear Evento"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  searchBar: {
    flex: 1,
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventDescription: {
    color: '#666',
    marginBottom: 12,
  },
  eventInfo: {
    marginBottom: 12,
  },
  eventDate: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  eventPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  eventDuration: {
    fontSize: 14,
    color: '#666',
  },
  locationInfo: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  eventFooter: {
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#E3F2FD',
  },
  tagText: {
    color: '#1976D2',
    fontSize: 12,
  },
  enrollmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacity: {
    fontSize: 12,
    color: '#666',
  },
  enrollmentStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default HomeScreen;
