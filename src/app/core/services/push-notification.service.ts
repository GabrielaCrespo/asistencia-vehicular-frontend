import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { StorageService } from '../auth/storage.service';

const firebaseConfig = {
  apiKey: "AIzaSyBs1w6L6-cFNbTLNH1UTgi6rAxtvwH6VWw",
  authDomain: "asistencia-vehicular-bd3a4.firebaseapp.com",
  projectId: "asistencia-vehicular-bd3a4",
  storageBucket: "asistencia-vehicular-bd3a4.firebasestorage.app",
  messagingSenderId: "1071893055653",
  appId: "1:1071893055653:web:3d0623359d189a04cde54c"
};

const VAPID_KEY = 'BF-SE3bb3pmkwcwv1en6PUiK-Ldf2LR3KBTodm4CwkLkmaNziNA9_GC0KVQxPyjp8wV8FiAsXSafZ75ZRAaj2nE';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private messaging: any;

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
    const app = initializeApp(firebaseConfig);
    this.messaging = getMessaging(app);
  }

  async inicializar(): Promise<void> {
    try {
      // Registrar el service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('[FCM Web] Service worker registrado');

      // Pedir permisos
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[FCM Web] Permisos denegados');
        return;
      }

      // Obtener token
      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('[FCM Web] Token:', token);
        await this.registrarToken(token);
      }

      // Escuchar notificaciones en primer plano
      onMessage(this.messaging, (payload) => {
        console.log('[FCM Web] Notificación en primer plano:', payload);
        this.mostrarNotificacion(
          payload.notification?.title ?? 'Asistencia Vehicular',
          payload.notification?.body ?? ''
        );
      });

    } catch (error) {
      console.error('[FCM Web] Error:', error);
    }
  }

  private async registrarToken(token: string): Promise<void> {
    try {
      const authToken = this.storage.getToken();
      if (!authToken) return;

      await this.http.post(
        `${environment.api.baseUrl}/api/notificaciones/registrar-token`,
        { fcm_token: token },
        { headers: new HttpHeaders({ Authorization: `Bearer ${authToken}` }) }
      ).toPromise();

      console.log('[FCM Web] Token registrado en backend');
    } catch (error) {
      console.error('[FCM Web] Error registrando token:', error);
    }
  }

  private mostrarNotificacion(titulo: string, cuerpo: string): void {
    if (Notification.permission === 'granted') {
      new Notification(titulo, {
        body: cuerpo,
        icon: '/favicon.ico',
      });
    }
  }
}