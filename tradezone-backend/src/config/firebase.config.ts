import * as admin from 'firebase-admin';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class FirebaseConfig implements OnModuleInit {
  private firebaseApp: admin.app.App;

  async onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Check if Firebase is already initialized
      const apps = admin.apps;
      if (apps.length > 0 && apps[0]) {
        console.log(
          '🔥 Firebase Admin SDK already initialized, reusing existing app',
        );
        this.firebaseApp = apps[0];
        return;
      }

      let credential: admin.credential.Credential;

      // Check if we're in production (Render) and use environment variables
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Parse the service account key from environment variable
        const serviceAccount = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        );
        credential = admin.credential.cert(serviceAccount);
        console.log('🔥 Using Firebase credentials from environment variables');
      } else {
        // Fallback to local file for development
        const serviceAccountPath = require('path').join(
          process.cwd(),
          'tradeinzone-1a8b1-firebase-adminsdk-fbsvc-ad8db35560.json',
        );
        credential = admin.credential.cert(serviceAccountPath);
        console.log('🔥 Using Firebase credentials from local file');
      }

      // Initialize Firebase Admin SDK
      this.firebaseApp = admin.initializeApp({
        credential,
        projectId: process.env.FIREBASE_PROJECT_ID || 'tradeinzone-1a8b1',
        databaseURL:
          process.env.FIREBASE_DATABASE_URL ||
          'https://tradeinzone-1a8b1-default-rtdb.firebaseio.com',
      });

      console.log('🔥 Firebase Admin SDK initialized successfully');

      // Ensure Firestore ignores undefined values to prevent validation errors on optional fields
      try {
        admin
          .firestore(this.firebaseApp)
          .settings({ ignoreUndefinedProperties: true } as any);
        console.log(
          '🔥 Firestore settings applied: ignoreUndefinedProperties = true',
        );
      } catch (e) {
        console.warn(
          '⚠️ Could not apply Firestore settings for ignoreUndefinedProperties:',
          e,
        );
      }
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error);
      throw error;
    }
  }

  public getFirestore() {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return admin.firestore(this.firebaseApp);
  }

  public getAuth() {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return admin.auth(this.firebaseApp);
  }

  public getDatabase() {
    if (!this.firebaseApp) {
      throw new Error('Firebase not initialized');
    }
    return admin.database(this.firebaseApp);
  }
}
