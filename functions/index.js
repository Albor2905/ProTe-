import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { Expo } from 'expo-server-sdk';
import { onValueWritten } from 'firebase-functions/v2/database';
import { onValue } from 'firebase/database';

const app = initializeApp();
const expo = new Expo();

export const enviarNotificacionSiEstado2 = onValueWritten(
  { ref: 'Estado/led1' },
  async (event) => {
    const afterData = event.data.after.val();
    
    if (afterData !== 2) return;

    const db = getDatabase();
    const usersSnapshot = await db.ref('UsuariosProTec').once('value');
    const users = usersSnapshot.val() || {};

    const messages = [];
    const invalidTokens = [];

    // Prepara mensajes
    for (const [userId, userData] of Object.entries(users)) {
      const expoToken = userData?.expoToken;
      if (!expoToken || !Expo.isExpoPushToken(expoToken)) continue;

      messages.push({
        to: expoToken,
        sound: 'default',
        title: '⚠️ Alerta',
        body: '¡Estado crítico detectado!',
        data: { userId } // Datos adicionales
      });
    }

    // Envía en chunks
    const chunks = expo.chunkPushNotifications(messages);
    
    try {
      for (const chunk of chunks) {
        const receipts = await expo.sendPushNotificationsAsync(chunk);
        // Procesa receipts para detectar tokens inválidos
        receipts.forEach(receipt => {
          if (receipt.status === 'error' && receipt.details?.error === 'DeviceNotRegistered') {
            invalidTokens.push(receipt.details.expoPushToken);
          }
        });
      }

      // Limpia tokens inválidos
      await Promise.all(
        invalidTokens.map(token => 
          db.ref('UsuariosProTec')
            .orderByChild('expoToken')
            .equalTo(token)
            .once('value')
            .then(snapshot => {
              const updates = {};
              snapshot.forEach(child => {
                updates[`${child.key}/expoToken`] = null;
              });
              return db.ref().update(updates);
            })
        )
      );

      console.log(`Notificaciones enviadas: ${messages.length}`);
    } catch (error) {
      console.error('Error crítico:', error);
    }
  }
);