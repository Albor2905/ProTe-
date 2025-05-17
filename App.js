import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Vibration, 
  Platform,
  ActivityIndicator,
  Button,
  Alert
} from "react-native";
import { database } from './firebaseConfig';
import { ref, onValue, set } from "firebase/database";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { MaterialIcons } from '@expo/vector-icons';

// Configuración avanzada de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Componente de Indicador LED optimizado
const LedIndicator = React.memo(({ status }) => {
  const statusConfig = {
    0: { color: 'gray', label: 'Apagado' },
    1: { color: 'limegreen', label: 'Encendido' },
    2: { color: 'red', label: 'Error' },
    3: { color: 'yellow', label: 'Advertencia' },
    default: { color: 'gray', label: 'Desconocido' }
  };

  const { color, label } = statusConfig[status] || statusConfig.default;

  return (
    <View style={styles.ledContainer}>
      <View style={[styles.led, { backgroundColor: color }]} />
      <Text style={styles.ledLabel}>{label}</Text>
    </View>
  );
});

export default function App() {
  const [ledStatus, setLedStatus] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Registro para notificaciones push mejorado
  useEffect(() => {
    const configureNotifications = async () => {
      try {
        if (!Device.isDevice) {
          console.warn('Las notificaciones requieren un dispositivo físico');
          return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          Alert.alert(
            'Permiso requerido',
            'Las notificaciones están desactivadas. Actívalas en configuración.',
            [{ text: 'OK' }]
          );
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: '1fd6cb39-2fec-4c1a-8f66-4cddee9808c6' // Reemplaza con tu ID de Expo
        });
        setExpoPushToken(tokenData.data);

        // Configurar listeners de notificaciones
        const subscription = Notifications.addNotificationReceivedListener(notification => {
          console.log('Notificación recibida:', notification);
        });

        // Guardar token en Firebase
        const userId = "usuario123"; // Reemplazar con tu sistema de autenticación
        await set(ref(database, `UsuariosProTec/${userId}/expoToken`), tokenData.data);

        return () => subscription.remove();
      } catch (err) {
        console.error('Error en configuración de notificaciones:', err);
        setError('Error al configurar notificaciones');
      }
    };

    configureNotifications();
  }, []);

  // Conexión a Firebase con manejo de errores
  useEffect(() => {
    const ledRef = ref(database, 'estado/led1');
    
    const unsubscribe = onValue(ledRef, 
      (snapshot) => {
        try {
          const value = snapshot.val();
          console.log('Estado del LED:', value);
          setLedStatus(value);
          setError(null);
        } catch (err) {
          console.error('Error al procesar datos:', err);
          setError('Error al leer datos del sensor');
        } finally {
          setLoading(false);
        }
      }, 
      (error) => {
        console.error('Error de conexión:', error);
        setError('Error de conexión con el servidor');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Efecto para alertas y vibración
  useEffect(() => {
    if (ledStatus === 2) {
      // Patrón de vibración mejorado
      const vibrationPattern = Platform.select({
        ios: [0, 1000, 500, 1000, 500, 2000],
        android: [0, 1000, 500, 1000, 500, 2000, 100, 500, 100, 500]
      });

      Vibration.vibrate(vibrationPattern, true);

      // Notificación local avanzada
      Notifications.scheduleNotificationAsync({
        content: {
          title: "⚠️ ¡Alerta Crítica!",
          body: "¡El sensor ha detectado una condición de peligro!",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          data: { emergency: true }
        },
        trigger: null
      });

      // Limpiar al desmontar
      return () => Vibration.cancel();
    }
  }, [ledStatus]);

  // Pantalla de carga
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Conectando con el sensor...</Text>
      </View>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialIcons name="error-outline" size={50} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          title="Reintentar Conexión" 
          onPress={() => {
            setLoading(true);
            setError(null);
          }} 
          color="#0066cc"
        />
      </View>
    );
  }

  // Renderizado principal
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('./assets/favicon.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        <Text style={styles.title}>Sistema ProTec</Text>
        <Text style={styles.subtitle}>Monitoreo en tiempo real</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View 
              key={`sensor-${index}`}
              style={[
                styles.sensorCard,
                index === 0 && ledStatus === 2 && styles.emergencyCard
              ]}
            >
              <Text style={styles.sensorTitle}>Máquina #{index + 1}</Text>
              <Text style={styles.sensorStatus}>Estado actual:</Text>
              <LedIndicator status={index === 0 ? ledStatus : 0} />
              {index === 0 && (
                <Text style={styles.lastUpdate}>
                  {new Date().toLocaleTimeString()}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Estilos mejorados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 25,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 10,
    tintColor: 'white',
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 5,
    fontWeight: '500',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    marginTop: 15,
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 25,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  sensorCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    width: '45%',
    aspectRatio: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  emergencyCard: {
    borderWidth: 2,
    borderColor: 'red',
    shadowColor: 'red',
    shadowRadius: 10,
    shadowOpacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  sensorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 5,
    textAlign: 'center',
  },
  sensorStatus: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 10,
  },
  ledContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  led: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ledLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  lastUpdate: {
    fontSize: 10,
    color: '#888',
    marginTop: 5,
  },
});