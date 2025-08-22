import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  Title,
  Paragraph,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { eventService, eventLocationService, tagService, locationService, provinceService } from '../services/api';
import { EventLocation, Tag, Province, Location } from '../types';

const CreateEventScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [maxAssistance, setMaxAssistance] = useState('');
  const [enabledForEnrollment, setEnabledForEnrollment] = useState('1');

  // Location data
  const [eventLocations, setEventLocations] = useState<EventLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<EventLocation | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);

  // Location form fields
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationCapacity, setLocationCapacity] = useState('');
  const [locationLatitude, setLocationLatitude] = useState('');
  const [locationLongitude, setLocationLongitude] = useState('');
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedLocationItem, setSelectedLocationItem] = useState<Location | null>(null);

  // Tags
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      loadLocationsByProvince(selectedProvince.id);
    }
  }, [selectedProvince]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [locationsData, tagsData, provincesData] = await Promise.all([
        eventLocationService.getEventLocations(),
        tagService.getTags(),
        provinceService.getProvinces(),
      ]);
      
      setEventLocations(locationsData);
      setTags(tagsData);
      setProvinces(provincesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos iniciales');
    } finally {
      setLoadingData(false);
    }
  };

  const loadLocationsByProvince = async (provinceId: number) => {
    try {
      const locationsData = await locationService.getLocationsByProvince(provinceId);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const validateForm = () => {
    if (!name.trim() || name.length < 3) {
      Alert.alert('Error', 'El nombre debe tener al menos 3 caracteres');
      return false;
    }

    if (!description.trim() || description.length < 3) {
      Alert.alert('Error', 'La descripción debe tener al menos 3 caracteres');
      return false;
    }

    if (!startDate || !startTime) {
      Alert.alert('Error', 'Debes seleccionar fecha y hora');
      return false;
    }

    if (!duration || parseInt(duration) <= 0) {
      Alert.alert('Error', 'La duración debe ser mayor a 0');
      return false;
    }

    if (!price || parseFloat(price) < 0) {
      Alert.alert('Error', 'El precio debe ser mayor o igual a 0');
      return false;
    }

    if (!maxAssistance || parseInt(maxAssistance) <= 0) {
      Alert.alert('Error', 'La capacidad debe ser mayor a 0');
      return false;
    }

    if (!selectedLocation && !showLocationForm) {
      Alert.alert('Error', 'Debes seleccionar una ubicación');
      return false;
    }

    if (showLocationForm) {
      if (!locationName.trim() || locationName.length < 3) {
        Alert.alert('Error', 'El nombre de la ubicación debe tener al menos 3 caracteres');
        return false;
      }

      if (!locationAddress.trim() || locationAddress.length < 3) {
        Alert.alert('Error', 'La dirección debe tener al menos 3 caracteres');
        return false;
      }

      if (!locationCapacity || parseInt(locationCapacity) <= 0) {
        Alert.alert('Error', 'La capacidad de la ubicación debe ser mayor a 0');
        return false;
      }

      if (!selectedLocationItem) {
        Alert.alert('Error', 'Debes seleccionar una localidad');
        return false;
      }
    }

    return true;
  };

  const handleCreateLocation = async () => {
    if (!selectedLocationItem) return;

    try {
      const locationData = {
        id_location: selectedLocationItem.id,
        name: locationName.trim(),
        full_address: locationAddress.trim(),
        max_capacity: locationCapacity,
        latitude: locationLatitude || '0',
        longitude: locationLongitude || '0',
      };

      const newLocation = await eventLocationService.createEventLocation(locationData);
      setEventLocations([...eventLocations, newLocation]);
      setSelectedLocation(newLocation);
      setShowLocationForm(false);
      
      // Reset form
      setLocationName('');
      setLocationAddress('');
      setLocationCapacity('');
      setLocationLatitude('');
      setLocationLongitude('');
      setSelectedProvince(null);
      setSelectedLocationItem(null);
    } catch (error) {
      console.error('Error creating location:', error);
      Alert.alert('Error', 'No se pudo crear la ubicación');
    }
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const startDateTime = `${startDate}T${startTime}:00.000Z`;
      
      const eventData = {
        name: name.trim(),
        description: description.trim(),
        id_event_location: selectedLocation!.id,
        start_date: startDateTime,
        duration_in_minutes: parseInt(duration),
        price: price,
        enabled_for_enrollment: enabledForEnrollment,
        max_assistance: parseInt(maxAssistance),
        tags: selectedTags,
      };

      await eventService.createEvent(eventData);
      Alert.alert('Éxito', 'Evento creado correctamente', [
        { text: 'OK', onPress: () => navigation.navigate('Home') }
      ]);
    } catch (error: any) {
      console.error('Error creating event:', error);
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear el evento');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Surface style={styles.surface}>
          <Title style={styles.title}>Crear Nuevo Evento</Title>

          <TextInput
            label="Nombre del Evento"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Descripción"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
          />

          <View style={styles.dateTimeContainer}>
            <TextInput
              label="Fecha (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              placeholder="2024-12-25"
            />
            <TextInput
              label="Hora (HH:MM)"
              value={startTime}
              onChangeText={setStartTime}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              placeholder="20:00"
            />
          </View>

          <View style={styles.rowContainer}>
            <TextInput
              label="Duración (minutos)"
              value={duration}
              onChangeText={setDuration}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              keyboardType="numeric"
            />
            <TextInput
              label="Precio"
              value={price}
              onChangeText={setPrice}
              mode="outlined"
              style={[styles.input, styles.halfInput]}
              keyboardType="numeric"
            />
          </View>

          <TextInput
            label="Capacidad máxima"
            value={maxAssistance}
            onChangeText={setMaxAssistance}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
          />

          <View style={styles.enrollmentContainer}>
            <Text style={styles.label}>Inscripciones habilitadas</Text>
            <SegmentedButtons
              value={enabledForEnrollment}
              onValueChange={setEnabledForEnrollment}
              buttons={[
                { value: '1', label: 'Sí' },
                { value: '0', label: 'No' },
              ]}
            />
          </View>

          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>📍 Ubicación</Text>
            
            {!showLocationForm ? (
              <View>
                <Text style={styles.label}>Seleccionar ubicación existente:</Text>
                {eventLocations.map((location) => (
                  <Chip
                    key={location.id}
                    selected={selectedLocation?.id === location.id}
                    onPress={() => setSelectedLocation(location)}
                    style={styles.locationChip}
                  >
                    {location.name}
                  </Chip>
                ))}
                
                <Button
                  mode="outlined"
                  onPress={() => setShowLocationForm(true)}
                  style={styles.addLocationButton}
                >
                  Crear Nueva Ubicación
                </Button>
              </View>
            ) : (
              <View style={styles.locationForm}>
                <Text style={styles.label}>Crear nueva ubicación:</Text>
                
                <TextInput
                  label="Nombre de la ubicación"
                  value={locationName}
                  onChangeText={setLocationName}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Dirección completa"
                  value={locationAddress}
                  onChangeText={setLocationAddress}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Capacidad máxima"
                  value={locationCapacity}
                  onChangeText={setLocationCapacity}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                />

                <View style={styles.rowContainer}>
                  <TextInput
                    label="Latitud"
                    value={locationLatitude}
                    onChangeText={setLocationLatitude}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                    keyboardType="numeric"
                  />
                  <TextInput
                    label="Longitud"
                    value={locationLongitude}
                    onChangeText={setLocationLongitude}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                    keyboardType="numeric"
                  />
                </View>

                <Text style={styles.label}>Provincia:</Text>
                {provinces.map((province) => (
                  <Chip
                    key={province.id}
                    selected={selectedProvince?.id === province.id}
                    onPress={() => setSelectedProvince(province)}
                    style={styles.locationChip}
                  >
                    {province.name}
                  </Chip>
                ))}

                {selectedProvince && (
                  <>
                    <Text style={styles.label}>Localidad:</Text>
                    {locations.map((location) => (
                      <Chip
                        key={location.id}
                        selected={selectedLocationItem?.id === location.id}
                        onPress={() => setSelectedLocationItem(location)}
                        style={styles.locationChip}
                      >
                        {location.name}
                      </Chip>
                    ))}
                  </>
                )}

                <View style={styles.locationFormButtons}>
                  <Button
                    mode="outlined"
                    onPress={handleCreateLocation}
                    style={styles.locationFormButton}
                  >
                    Crear Ubicación
                  </Button>
                  <Button
                    mode="text"
                    onPress={() => setShowLocationForm(false)}
                    style={styles.locationFormButton}
                  >
                    Cancelar
                  </Button>
                </View>
              </View>
            )}
          </View>

          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>🏷️ Etiquetas</Text>
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <Chip
                  key={tag.id}
                  selected={selectedTags.includes(tag.id)}
                  onPress={() => toggleTag(tag.id)}
                  style={styles.tagChip}
                >
                  {tag.name}
                </Chip>
              ))}
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleCreateEvent}
            style={styles.createButton}
            loading={loading}
            disabled={loading}
          >
            Crear Evento
          </Button>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
  },
  surface: {
    padding: 20,
    borderRadius: 10,
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  enrollmentContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  locationSection: {
    marginBottom: 20,
  },
  locationChip: {
    marginBottom: 8,
  },
  addLocationButton: {
    marginTop: 8,
  },
  locationForm: {
    marginTop: 12,
  },
  locationFormButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  locationFormButton: {
    flex: 1,
  },
  tagsSection: {
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    marginBottom: 8,
  },
  createButton: {
    marginTop: 16,
    paddingVertical: 8,
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
});

export default CreateEventScreen;
