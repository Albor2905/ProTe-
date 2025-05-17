// En tu Cloud Function (backend)
export const enviarNotificacionSiEstado2 = onValueWritten(
  "Estado/led1",
  async (event) => {
    // ... validación del estado ...

    const db = getDatabase();
    const usersSnapshot = await db.ref("UsuariosProTec").once("value");
    const users = usersSnapshot.val();

    for (const userId in users) {
      const token = users[userId]?.expoToken;
      if (!token) continue;
      
      try {
        await getMessaging().send({
          token: token,
          notification: {
            title: "⚠️ Alerta",
            body: "El sensor está en estado crítico!"
          }
        });
      } catch (error) {
        console.error(`Error enviando a ${userId}:`, error);
        // Opcional: Eliminar token inválido
        if (error.code === 'messaging/invalid-registration-token') {
          await db.ref(`UsuariosProTec/${userId}/expoToken`).remove();
        }
      }
    }
  }
);