import { 
  Injectable, 
  OnModuleInit, 
  Logger 
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin         from 'firebase-admin';

// Firebase Admin Service

// Handles the initialization and low-level token verification logic for third-party authentication via Google Firebase.
@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);

  constructor(private readonly configService: ConfigService) {}

  // Automatically connects to the Firebase project using service account credentials during the module startup phase.
  onModuleInit() {
    // Initialise only once — guard against hot-reload double init.
    if (admin.apps.length > 0) return;

    const projectId  = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey  = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.error(
        'Firebase Admin SDK credentials are missing. ' +
        'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env',
      );
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });

    this.logger.log('Firebase Admin SDK initialised');
  }

  // Decodes and validates incoming identity tokens, throwing an error if the credential has expired or been tampered with.
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return admin.auth().verifyIdToken(idToken);
  }
}
