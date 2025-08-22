import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Text,
  ActivityIndicator,
  Divider,
  Surface,
} from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/api';
import { Event } from '../types';

const EventDetailScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadEventDetail();
  }, [eventId]);

  const loadEventDetail = async () => {
    try {
      setLoading(true);
      const eventData = await eventService.getEventById(eventId);
      setEvent(eventData);
      // Check if user is enrolled (this would need to be implemented in the API)
      // setIsEnrolled(await checkEnrollmentStatus(eventId));
    } catch (error) {
      console.error('Error loading event detail:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle del evento');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollment = async () => {
    if (!event) return;

    setEnrolling(true);
    try {
      if (isEnrolled) {
        await eventService.unenrollFromEvent(eventId);
        setIsEnrolled(false);
        Alert.alert('Éxito', 'Te has desinscrito del evento');
      } else {
        await eventService.enrollInEvent(eventId);
        setIsEnrolled(true);
        Alert.alert('Éxito', 'Te has inscrito al evento');
      }
    } catch (error: any) {
      console.error('Enrollment error:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo procesar la inscripción');
    } finally {
      setEnrolling(false);
    }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando evento...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Evento no encontrado</Text>
      </View>
    );
  }

  const eventIsPast = isEventPast(event.start_date);
  const canEnroll = event.enabled_for_enrollment === '1' && !eventIsPast;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.mainCard}>
        <Card.Content>
          <Title style={styles.eventTitle}>{event.name}</Title>
          <Paragraph style={styles.eventDescription}>
            {event.description}
          </Paragraph>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>📅 Fecha y Hora</Text>
            <Text style={styles.infoText}>{formatDate(event.start_date)}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>💰 Precio</Text>
            <Text style={styles.priceText}>{formatPrice(event.price)}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>⏱️ Duración</Text>
            <Text style={styles.infoText}>{event.duration_in_minutes} minutos</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>👥 Capacidad</Text>
            <Text style={styles.infoText}>{event.max_assistance} personas</Text>
          </View>

          {event.tags && event.tags.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>🏷️ Etiquetas</Text>
                <View style={styles.tagsContainer}>
                  {event.tags.map((tag) => (
                    <Chip key={tag.id} style={styles.tag} textStyle={styles.tagText}>
                      {tag.name}
                    </Chip>
                  ))}
                </View>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {event.event_location && (
        <Card style={styles.locationCard}>
          <Card.Content>
            <Title style={styles.locationTitle}>📍 Ubicación</Title>
            <Text style={styles.locationName}>{event.event_location.name}</Text>
            <Text style={styles.locationAddress}>{event.event_location.full_address}</Text>
            
            {event.event_location.location && (
              <View style={styles.locationDetails}>
                <Text style={styles.locationDetail}>
                  📍 {event.event_location.location.name}
                </Text>
                {event.event_location.location.province && (
                  <Text style={styles.locationDetail}>
                    🏛️ {event.event_location.location.province.name}
                  </Text>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {event.creator_user && (
        <Card style={styles.creatorCard}>
          <Card.Content>
            <Title style={styles.creatorTitle}>👤 Organizador</Title>
            <Text style={styles.creatorName}>
              {event.creator_user.first_name} {event.creator_user.last_name}
            </Text>
            <Text style={styles.creatorEmail}>{event.creator_user.username}</Text>
          </Card.Content>
        </Card>
      )}

      <Surface style={styles.enrollmentSection}>
        <View style={styles.enrollmentInfo}>
          <Text style={[
            styles.enrollmentStatus,
            { color: canEnroll ? '#4CAF50' : '#F44336' }
          ]}>
            {eventIsPast 
              ? '❌ Evento finalizado' 
              : event.enabled_for_enrollment === '1' 
                ? '✅ Inscripciones abiertas' 
                : '❌ Inscripciones cerradas'
            }
          </Text>
        </View>

        {user && event.creator_user && user.id !== event.creator_user.id && (
          <Button
            mode="contained"
            onPress={handleEnrollment}
            loading={enrolling}
            disabled={enrolling || !canEnroll}
            style={[
              styles.enrollmentButton,
              { backgroundColor: isEnrolled ? '#F44336' : '#4CAF50' }
            ]}
          >
            {isEnrolled ? 'Desinscribirse' : 'Inscribirse'}
          </Button>
        )}

        {user && event.creator_user && user.id === event.creator_user.id && (
          <View style={styles.creatorActions}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('EditEvent', { event })}
              style={styles.editButton}
            >
              Editar Evento
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
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
                          Alert.alert('Éxito', 'Evento eliminado');
                          navigation.goBack();
                        } catch (error) {
                          Alert.alert('Error', 'No se pudo eliminar el evento');
                        }
                      },
                    },
                  ]
                );
              }}
              style={styles.deleteButton}
            >
              Eliminar Evento
            </Button>
          </View>
        )}
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  mainCard: {
    margin: 16,
    elevation: 4,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  divider: {
    marginVertical: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  locationCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationDetails: {
    marginTop: 8,
  },
  locationDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  creatorCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
  },
  creatorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  creatorEmail: {
    fontSize: 14,
    color: '#666',
  },
  enrollmentSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    elevation: 4,
    borderRadius: 8,
  },
  enrollmentInfo: {
    marginBottom: 16,
  },
  enrollmentStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  enrollmentButton: {
    marginBottom: 8,
  },
  creatorActions: {
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    borderColor: '#F44336',
  },
});

export default EventDetailScreen;
