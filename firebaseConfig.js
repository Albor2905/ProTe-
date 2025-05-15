import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database"; // Importa solo la función de la base de datos

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBrTd3fXqmwUrpp92ngMeU-CzTwYeLvhP4",
  authDomain: "protec-bc9e5.firebaseapp.com",
  projectId: "protec-bc9e5",
  storageBucket: "protec-bc9e5.firebasestorage.app",
  messagingSenderId: "865111368997",
  appId: "1:865111368997:web:b2275c658acdb1159fa6cc",
  measurementId: "G-D52SVP6CH8",
  databaseURL: "https://protec-bc9e5-default-rtdb.firebaseio.com/" // Asegúrate de agregar la URL de tu base de datos
};

// Solo inicializa Firebase si no está ya inicializada
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig); // Si no hay aplicaciones, inicializa Firebase
} else {
  app = getApp(); // Si ya está inicializada, obtiene la instancia existente
}

const database = getDatabase(app);  // Obtén la referencia a la base de datos

export { database };  // Exporta la base de datos
