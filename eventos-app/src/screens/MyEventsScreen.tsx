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
  Text,
  ActivityIndicator,
  Chip,
  FAB,
} from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/api';
import { Event } from '../types';

const MyEventsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadMyEvents();
  }, []);

  const loadMyEvents = async () => {
    try {
      setLoading(true);
      // This would need to be implemented in the API to filter by creator
      const response = await eventService.getEvents();
      // Filter events created by the current user
      const myEvents = response.collection.filter(event => 
        event.creator_user && event.creator_user.id === user?.id
      );
      setEvents(myEvents);
    } catch (error) {
      console.error('Error loading my events:', error);
      Alert.alert('Error', 'No se pudieron cargar tus eventos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyEvents();
    setRefreshing(false);
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

  const isEventPast = (dateString: string) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    return eventDate < now;
  };

  const handleDeleteEvent = async (eventId: number) => {
    Alert.alert(
      'Eliminar Evento',
      '¿Estás seguro de que quieres eliminar este evento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eventService.deleteEvent(eventId);
              Alert.alert('Éxito', 'Evento eliminado correctamente');
              loadMyEvents(); // Reload the list
            } catch (error: any) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', error.response?.data?.message || 'No se pudo eliminar el evento');
            }
          },
        },
      ]
    );
  };

  const renderEventCard = ({ item }: { item: Event }) => {
    const eventIsPast = isEventPast(item.start_date);
    
    return (
      <Card style={styles.card}>
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
            
            <View style={styles.statusInfo}>
              <Text style={styles.capacity}>
                👥 {item.max_assistance} personas
              </Text>
              <Text style={[
                styles.statusText,
                { 
                  color: eventIsPast 
                    ? '#F44336' 
                    : item.enabled_for_enrollment === '1' 
                      ? '#4CAF50' 
                      : '#F44336' 
                }
              ]}>
                {eventIsPast 
                  ? '❌ Evento finalizado' 
                  : item.enabled_for_enrollment === '1' 
                    ? '✅ Inscripciones abiertas' 
                    : '❌ Inscripciones cerradas'
                }
              </Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
              style={styles.viewButton}
            >
              Ver Detalle
            </Button>
            
            {!eventIsPast && (
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('EditEvent', { event: item })}
                style={styles.editButton}
              >
                Editar
              </Button>
            )}
            
            <Button
              mode="outlined"
              onPress={() => handleDeleteEvent(item.id)}
              style={styles.deleteButton}
              textColor="#F44336"
            >
              Eliminar
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando tus eventos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
              No has creado ningún evento aún
            </Text>
            <Text style={styles.emptySubtext}>
              Crea tu primer evento para comenzar
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
    marginBottom: 16,
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
  statusInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacity: {
    fontSize: 12,
    color: '#666',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#2196F3',
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
    borderColor: '#F44336',
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
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default MyEventsScreen;
