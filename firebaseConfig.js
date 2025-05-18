import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

// Configuración de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBVYMeMZsn_hxSyoYVopGcgx9ydr0BhxDY",
  authDomain: "proyectocecyte-9f75e.firebaseapp.com",
  databaseURL: "https://proyectocecyte-9f75e-default-rtdb.firebaseio.com",
  projectId: "proyectocecyte-9f75e",
  storageBucket: "proyectocecyte-9f75e.appspot.com",
  messagingSenderId: "478449984037",
  appId: "1:478449984037:web:34110861ef0289292cd5cc",
  measurementId: "G-DV46P0XEV0"
};

let app;
let database;

try {
  // Inicializa la app solo si no existe
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  database = getDatabase(app);
} catch (error) {
  console.error("Error inicializando Firebase:", error);
  database = null;
}

export { database };

