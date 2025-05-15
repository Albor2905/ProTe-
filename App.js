import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { database } from './firebaseConfig'; // Asegúrate de importar la base de datos
import { ref, onValue } from "firebase/database"; // Importa las funciones necesarias

export default function App() {
  const [ledStatus, setLedStatus] = useState({
    led1: true,
    led2: true,
    led3: true,
  });

  useEffect(() => {
    const ledRef = ref(database, 'ledStatus'); // Accede al nodo 'ledStatus'

    const unsubscribe = onValue(ledRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Datos recibidos desde Firebase:', data);  // Verifica los datos recibidos
      if (data) setLedStatus(data);  // Actualiza el estado con los datos de la base de datos
    });

    return () => unsubscribe();  // Limpia la suscripción cuando el componente se desmonte
  }, []);

  const LedIndicator = ({ isOn }) => {
    console.log('Estado del LED:', isOn);  // Verifica el valor de cada LED
    return (
      <View style={[styles.led, { backgroundColor: isOn ? 'green' : 'gray' }]} />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.InsideContainer}>
        <View style={styles.MachineCard}>
          <Image source={require('./assets/favicon.png')} style={styles.ImgCard} />
          <View style={styles.BottomCard}>
            <Text style={styles.MachineTitle}>Maquina NO.1</Text>
            <Text style={styles.MachineSubtitle}>Subtitulo de la Maquina 😛</Text>
            <View style={styles.LedSection}>
              <LedIndicator isOn={ledStatus.led1} />
              <LedIndicator isOn={ledStatus.led2} />
              <LedIndicator isOn={ledStatus.led3} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  InsideContainer: {
    padding: 20,
  },
  MachineCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  ImgCard: {
    width: 100,
    height: 100,
    backgroundColor: '#eee',
  },
  BottomCard: {
    marginTop: 10,
    alignItems: 'center',
  },
  MachineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  MachineSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  LedSection: {
    flexDirection: 'row',
    marginTop: 10,
  },
  led: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 5,
  },
});
