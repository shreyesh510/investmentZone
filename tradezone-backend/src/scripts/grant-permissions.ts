#!/usr/bin/env ts-node

import * as admin from 'firebase-admin';
import * as path from 'path';

// Permission interfaces
interface UserPermissions {
  AiChat: boolean;
  investment: boolean;
  // Add more permissions here as needed
}

interface Permission {
  _id?: string;
  userId: string;
  permissions: UserPermissions;
}

// All permissions granted
const ALL_PERMISSIONS: UserPermissions = {
  AiChat: true,
  investment: true,
};

class PermissionGrantService {
  private firestore: admin.firestore.Firestore;
  private usersCollection = 'users';
  private permissionsCollection = 'permissions';

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Try to initialize Firebase Admin SDK
      const serviceAccountPath = path.join(
        __dirname,
        '../../tradeinzone-1a8b1-firebase-adminsdk-fbsvc-ad8db35560.json',
      );

      const serviceAccount = require(serviceAccountPath);

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });
      }

      this.firestore = admin.firestore();
      console.log('✅ Firebase initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Firebase:', error);
      process.exit(1);
    }
  }

  async findUserByEmail(email: string): Promise<any | null> {
    try {
      const snapshot = await this.firestore
        .collection(this.usersCollection)
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }

  async getUserPermissions(userId: string): Promise<Permission | null> {
    try {
      const snapshot = await this.firestore
        .collection(this.permissionsCollection)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        _id: doc.id,
        ...doc.data(),
      } as Permission;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      throw error;
    }
  }

  async createUserPermissions(
    userId: string,
    permissions: UserPermissions,
  ): Promise<Permission> {
    try {
      const permissionData = {
        userId,
        permissions,
      };

      const docRef = await this.firestore
        .collection(this.permissionsCollection)
        .add(permissionData);

      const permission: Permission = {
        _id: docRef.id,
        ...permissionData,
      };

      console.log(`✅ Created permissions for user ${userId}`);
      return permission;
    } catch (error) {
      console.error('Error creating user permissions:', error);
      throw error;
    }
  }

  async updateUserPermissions(
    userId: string,
    permissions: UserPermissions,
  ): Promise<Permission> {
    try {
      const existingPermission = await this.getUserPermissions(userId);

      if (!existingPermission) {
        // Create new permissions if they don't exist
        return await this.createUserPermissions(userId, permissions);
      }

      if (!existingPermission._id) {
        throw new Error('Permission document ID is missing');
      }

      const updateData = {
        permissions: permissions,
      };

      await this.firestore
        .collection(this.permissionsCollection)
        .doc(existingPermission._id)
        .update(updateData);

      console.log(`✅ Updated permissions for user ${userId}`);

      return {
        ...existingPermission,
        ...updateData,
      };
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw error;
    }
  }

  async grantAllPermissions(email: string): Promise<void> {
    console.log(`🔍 Looking for user with email: ${email}`);

    // Find user by email
    const user = await this.findUserByEmail(email);
    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      return;
    }

    console.log(`👤 Found user: ${user.name} (ID: ${user.id})`);

    // Grant all permissions
    const updatedPermissions = await this.updateUserPermissions(
      user.id,
      ALL_PERMISSIONS,
    );

    console.log(`🎉 Successfully granted all permissions to ${user.name}:`);
    console.log('📋 Permissions granted:');
    Object.entries(ALL_PERMISSIONS).forEach(([key, value]) => {
      console.log(`   ${key}: ${value ? '✅' : '❌'}`);
    });

    console.log('\n🚀 User can now access:');
    if (ALL_PERMISSIONS.AiChat) console.log('   🤖 AI Chat');
    if (ALL_PERMISSIONS.investment) console.log('   💰 Investment Features');
  }

  async listAllUsers(): Promise<void> {
    try {
      console.log('📋 Listing all users in the database:');
      console.log('----------------------------------------');

      const snapshot = await this.firestore
        .collection(this.usersCollection)
        .get();

      if (snapshot.empty) {
        console.log('No users found in the database.');
        return;
      }

      snapshot.docs.forEach((doc, index) => {
        const userData = doc.data();
        console.log(
          `${index + 1}. ${userData.name} (${userData.email}) - ID: ${doc.id}`,
        );
      });

      console.log('----------------------------------------');
    } catch (error) {
      console.error('Error listing users:', error);
    }
  }
}

// Main execution function
async function main() {
  const service = new PermissionGrantService();

  // Get command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('📋 Usage Examples:');
    console.log('');
    console.log('Grant all permissions to a user:');
    console.log('  npm run grant-permissions user@example.com');
    console.log('  or');
    console.log(
      '  npx ts-node src/scripts/grant-permissions.ts user@example.com',
    );
    console.log('');
    console.log('List all users:');
    console.log('  npm run grant-permissions --list');
    console.log('  or');
    console.log('  npx ts-node src/scripts/grant-permissions.ts --list');
    console.log('');
    return;
  }

  if (args[0] === '--list' || args[0] === '-l') {
    await service.listAllUsers();
    return;
  }

  const email = args[0];

  if (!email || !email.includes('@')) {
    console.error('❌ Please provide a valid email address');
    console.log(
      'Example: npx ts-node src/scripts/grant-permissions.ts user@example.com',
    );
    return;
  }

  try {
    await service.grantAllPermissions(email);
  } catch (error) {
    console.error('❌ Error granting permissions:', error);
  } finally {
    // Close the Firebase app
    await admin.app().delete();
    console.log('✅ Firebase connection closed');
    process.exit(0);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { PermissionGrantService };
