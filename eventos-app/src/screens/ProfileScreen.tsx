import React from 'react';
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
  Text,
  Avatar,
  Divider,
  List,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={80}
              label={getInitials(user?.first_name || '', user?.last_name || '')}
              style={styles.avatar}
            />
          </View>
          
          <Title style={styles.userName}>
            {user?.first_name} {user?.last_name}
          </Title>
          
          <Paragraph style={styles.userEmail}>
            {user?.username}
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.menuCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Mi Cuenta</Title>
          
          <List.Item
            title="Mis Eventos"
            description="Ver y gestionar mis eventos creados"
            left={(props) => <List.Icon {...props} icon="calendar" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('MyEvents')}
            style={styles.menuItem}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Crear Evento"
            description="Crear un nuevo evento"
            left={(props) => <List.Icon {...props} icon="plus" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('CreateEvent')}
            style={styles.menuItem}
          />
          
          <Divider style={styles.divider} />
          
          <List.Item
            title="Eventos"
            description="Ver todos los eventos disponibles"
            left={(props) => <List.Icon {...props} icon="view-list" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Home')}
            style={styles.menuItem}
          />
        </Card.Content>
      </Card>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Información de la App</Title>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Versión:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Desarrollado por:</Text>
            <Text style={styles.infoValue}>Equipo de Desarrollo</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>API Backend:</Text>
            <Text style={styles.infoValue}>localhost:3000</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.logoutContainer}>
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          textColor="#F44336"
          icon="logout"
        >
          Cerrar Sesión
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileCard: {
    margin: 16,
    elevation: 4,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#6200ee',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  menuCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  menuItem: {
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 4,
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  logoutContainer: {
    padding: 16,
    paddingTop: 0,
  },
  logoutButton: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
});

export default ProfileScreen;
