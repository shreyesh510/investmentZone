import { Injectable } from '@nestjs/common';
import { FirebaseConfig } from '../config/firebase.config';
import * as admin from 'firebase-admin';
import {
  Permission,
  UserPermissions,
  DEFAULT_USER_PERMISSIONS,
} from '../auth/entities/permission.entity';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  isAiFeatureEnabled?: boolean;
}

// ChatMessage interface removed - using in-memory chat via WebSocket

@Injectable()
export class FirebaseDatabaseService {
  private firestore: admin.firestore.Firestore;
  private usersCollection = 'users';
  private permissionsCollection = 'permissions';
  private positionsCollection = 'positions';
  private positionsHistoryCollection = 'positions_history';
  private exitPositionsCollection = 'exit_positions';
  private withdrawalsCollection = 'withdrawals';
  private depositsCollection = 'deposits';
  private walletsCollection = 'wallets';
  // New collection for explicit wallet history entries
  private walletHistoryCollection = 'wallet_history';
  private tradePnLCollection = 'tradePnL';
  private tradeRulesCollection = 'tradeRules';
  private tradeRuleHistoryCollection = 'tradeRuleHistory';
  private pnlLimitsCollection = 'pnlLimits';
  // Trading collections (shared across all users)
  private tradingPnLCollection = 'tradingPnL';
  private tradingWalletCollection = 'tradingWallet';
  private tradingPnLHistoryCollection = 'tradingPnLHistory';
  private tradingWalletHistoryCollection = 'tradingWalletHistory';

  constructor(private firebaseConfig: FirebaseConfig) {
    // Firestore will be initialized in onModuleInit
  }

  private getFirestore() {
    return this.firebaseConfig.getFirestore();
  }

  // User operations
  async getUsers(): Promise<User[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.usersCollection)
        .get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const snapshot = await this.getFirestore()
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
      } as User;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    try {
      const docRef = await this.getFirestore()
        .collection(this.usersCollection)
        .add({
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      return {
        id: docRef.id,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      await this.getFirestore()
        .collection(this.usersCollection)
        .doc(userId)
        .update({
          ...userData,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.getFirestore()
        .collection(this.usersCollection)
        .doc(userId)
        .delete();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Chat operations removed - using in-memory chat via WebSocket

  // Initialize with sample data
  async initializeSampleData(): Promise<void> {
    try {
      const usersSnapshot = await this.getFirestore()
        .collection(this.usersCollection)
        .get();

      if (usersSnapshot.empty) {
        // Initializing sample users...

        const sampleUsers = [
          {
            name: 'vivekkolhe',
            email: 'vivekkolhe@gmail.com',
            password: 'Vivek@123',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            name: 'shreyashkolhe',
            email: 'shreyashkolhe@gmail.com',
            password: 'shreyash@123',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        for (const user of sampleUsers) {
          await this.createUser(user);
        }

        // Sample users initialized successfully
      }
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }

  // Permission operations
  async createUserPermissions(
    userId: string,
    permissions: UserPermissions = DEFAULT_USER_PERMISSIONS,
  ): Promise<Permission> {
    try {
      const permissionData = {
        userId,
        permissions,
      };

      const docRef = await this.getFirestore()
        .collection(this.permissionsCollection)
        .add(permissionData);

      const permission: Permission = {
        _id: docRef.id,
        ...permissionData,
      };

      // Permissions created for user
      return permission;
    } catch (error) {
      console.error('Error creating user permissions:', error);
      throw error;
    }
  }

  async getUserPermissions(userId: string): Promise<Permission | null> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.permissionsCollection)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        // No permissions found; creating default permissions
        return await this.createUserPermissions(userId);
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

  async updateUserPermissions(
    userId: string,
    permissions: Partial<UserPermissions>,
  ): Promise<Permission> {
    try {
      // Get existing permissions
      const existingPermission = await this.getUserPermissions(userId);

      if (!existingPermission) {
        throw new Error(`No permissions found for user ${userId}`);
      }

      // Merge with existing permissions
      const updatedPermissions = {
        ...existingPermission.permissions,
        ...permissions,
      };

      const updateData = {
        permissions: updatedPermissions,
      };

      if (!existingPermission._id) {
        throw new Error('Permission document ID is missing');
      }

      await this.getFirestore()
        .collection(this.permissionsCollection)
        .doc(existingPermission._id)
        .update(updateData);

      // Updated permissions for user

      return {
        ...existingPermission,
        ...updateData,
      };
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw error;
    }
  }

  async deleteUserPermissions(userId: string): Promise<void> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.permissionsCollection)
        .where('userId', '==', userId)
        .get();

      const batch = this.getFirestore().batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      // Deleted permissions for user
    } catch (error) {
      console.error('Error deleting user permissions:', error);
      throw error;
    }
  }

  async getAllUserPermissions(): Promise<Permission[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.permissionsCollection)
        .get();
      return snapshot.docs.map((doc) => ({
        _id: doc.id,
        ...doc.data(),
      })) as Permission[];
    } catch (error) {
      console.error('Error getting all permissions:', error);
      throw error;
    }
  }

/*
  // Position operations
  async getPositions(userId: string): Promise<Position[]> {
    try {
      // Fetching positions for user

      const snapshot = await this.getFirestore()
        .collection(this.positionsCollection)
        .where('userId', '==', userId)
        .get();

      // Firestore query returned documents

      const positions = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Mapping position document
        return {
          id: doc.id,
          ...data,
        };
      }) as Position[];

      // Mapped positions

      // Sort by createdAt in JavaScript instead of Firestore
      const sortedPositions = positions.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Descending order
      });

      // Returning sorted positions
      return sortedPositions;
    } catch (error) {
      console.error('❌ Error getting positions:', error);
      return [];
    }
  }

  async getPositionsBySymbol(
    userId: string,
    symbol: string,
  ): Promise<Position[]> {
    try {
      const sym = (symbol || '').toUpperCase();
      const snapshot = await this.getFirestore()
        .collection(this.positionsCollection)
        .where('userId', '==', userId)
        .where('symbol', '==', sym)
        .get();

      const positions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Position[];

      // Sort by createdAt desc (fallback to 0)
      return positions.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error getting positions by symbol:', error);
      return [];
    }
  }

  async getPositionById(positionId: string): Promise<Position | null> {
    try {
      const doc = await this.getFirestore()
        .collection(this.positionsCollection)
        .doc(positionId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      } as Position;
    } catch (error) {
      console.error('Error getting position by ID:', error);
      return null;
    }
  }

  async createPosition(positionData: Omit<Position, 'id'>): Promise<Position> {
    try {
      // Use serverTimestamp() for Firestore timestamps
      const now = new Date();
      const docRef = await this.getFirestore()
        .collection(this.positionsCollection)
        .add({
          ...positionData,
          createdAt: now,
          updatedAt: now,
        });

      return {
        id: docRef.id,
        ...positionData,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Error creating position:', error);
      throw error;
    }
  }

  async updatePosition(
    positionId: string,
    positionData: Partial<Position>,
  ): Promise<void> {
    try {
      await this.getFirestore()
        .collection(this.positionsCollection)
        .doc(positionId)
        .update({
          ...positionData,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error('Error updating position:', error);
      throw error;
    }
  }

  async deletePosition(positionId: string): Promise<void> {
    try {
      await this.getFirestore()
        .collection(this.positionsCollection)
        .doc(positionId)
        .delete();
    } catch (error) {
      console.error('Error deleting position:', error);
      throw error;
    }
  }

  // ---------------- Position History ----------------
  /**
   * Append an immutable activity record to positions_history
   */
  async addPositionHistoryEntry(entry: {
    userId: string;
    action:
      | 'create'
      | 'update'
      | 'close'
      | 'close-all'
      | 'delete'
      | 'bulk-create';
    positionId?: string;
    symbol?: string;
    details?: Record<string, any>;
  }): Promise<string | null> {
    try {
      const db = this.getFirestore();
      const now = new Date();
      const raw = {
        ...entry,
        symbol: (entry.symbol || '').toUpperCase() || undefined,
        createdAt: now,
      } as Record<string, any>;
      // Strip undefined
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      const docRef = await db
        .collection(this.positionsHistoryCollection)
        .add(payload);
      return docRef.id;
    } catch (error) {
      console.error('Error adding position history entry:', error);
      return null;
    }
  }

  async getPositionHistory(userId: string, limit?: number): Promise<any[]> {
    try {
      const db = this.getFirestore();
      // Avoid requiring a composite index by sorting in memory
      const snap = await db
        .collection(this.positionsHistoryCollection)
        .where('userId', '==', userId)
        .get();
      const items = snap.docs.map((d) => {
        const data = d.data() as any;
        const createdAt = this.serializeDate(data.createdAt);
        return { id: d.id, ...data, createdAt };
      });
      const sorted = items.sort((a, b) => {
        const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bt - at;
      });
      return typeof limit === 'number' && limit > 0
        ? sorted.slice(0, limit)
        : sorted;
    } catch (error) {
      console.error('Error getting position history:', error);
      return [];
    }
  }

  // New: get all open positions across all users (for cron jobs)
  async getAllOpenanys(): Promise<any[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.positionsCollection)
        .where('status', '==', 'open')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as any[];
    } catch (error) {
      console.error('Error getting all open positions:', error);
      return [];
    }
  }

  // New: batch update currentPrice by symbol for open positions
  async updateanysCurrentPriceBySymbol(
    symbol: string,
    price: number,
  ): Promise<number> {
    const sym = (symbol || '').toUpperCase();
    if (!sym || !(price > 0)) return 0;
    try {
      const db = this.getFirestore();
      const snapshot = await db
        .collection(this.positionsCollection)
        .where('symbol', '==', sym)
        .where('status', '==', 'open')
        .get();

      if (snapshot.empty) return 0;
      const batch = db.batch();
      let count = 0;
      const now = new Date();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { currentPrice: price, updatedAt: now });
        count += 1;
      });
      await batch.commit();
      return count;
    } catch (error) {
      console.error('Error updating currentPrice by symbol:', error);
      return 0;
    }
  }
  async getOpenanys(userId: string): Promise<any[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.positionsCollection)
        .where('userId', '==', userId)
        .where('status', '==', 'open')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];
    } catch (error) {
      console.error('Error getting open positions:', error);
      return [];
    }
  }

  async getClosedanys(userId: string): Promise<any[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.positionsCollection)
        .where('userId', '==', userId)
        .where('status', '==', 'closed')
        .orderBy('closedAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];
    } catch (error) {
      console.error('Error getting closed positions:', error);
      return [];
    }
  }

  async createanysBatch(
    positions: Array<Omit<any, 'id'>>,
  ): Promise<any[]> {
    if (!positions || positions.length === 0) return [];

    const db = this.getFirestore();
    const batch = db.batch();
    const created: any[] = [];

    for (const p of positions) {
      const docRef = db.collection(this.positionsCollection).doc();
      const now = new Date();
      const data = {
        ...p,
        createdAt: p.createdAt ?? now,
        updatedAt: p.updatedAt ?? now,
      } as any;
      batch.set(docRef, data);
      created.push({ id: docRef.id, ...data } as any);
    }

    await batch.commit();
    return created;
  }

  // Withdrawals operations
  async createWithdrawal(
    data: Omit<
      import('../withdrawals/entities/withdrawal.entity').Withdrawal,
      'id'
    >,
  ): Promise<import('../withdrawals/entities/withdrawal.entity').Withdrawal> {
    try {
      const db = this.getFirestore();
      const now = data.requestedAt ?? new Date();
      // Remove undefined fields to satisfy Firestore validation
      const raw = { ...data, requestedAt: now } as Record<string, any>;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );

      const docRef = await db
        .collection(this.withdrawalsCollection)
        .add(payload);
      // Normalize dates to ISO for API consumers
      const requestedAt = this.serializeDate(payload.requestedAt);
      const completedAt = this.serializeDate(payload.completedAt);
      return {
        id: docRef.id,
        ...(payload as any),
        requestedAt,
        completedAt,
      };
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      throw error;
    }
  }

  async getWithdrawals(
    userId: string,
  ): Promise<import('../withdrawals/entities/withdrawal.entity').Withdrawal[]> {
    try {
      // Fetch by userId then sort in memory to avoid requiring a Firestore composite index
      const snapshot = await this.getFirestore()
        .collection(this.withdrawalsCollection)
        .where('userId', '==', userId)
        .get();
      const items = snapshot.docs.map((d) => {
        const data = d.data() as any;
        // Normalize Firestore Timestamp/Date to ISO strings
        const requestedAt = this.serializeDate(data.requestedAt);
        const completedAt = this.serializeDate(data.completedAt);
        return { id: d.id, ...data, requestedAt, completedAt };
      });
      return items.sort((a, b) => {
        const aTime = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
        const bTime = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
        return bTime - aTime;
      }) as any;
    } catch (error) {
      console.error('Error getting withdrawals:', error);
      return [] as any;
    }
  }

  // Deposits operations
  async createDeposit(
    data: Omit<import('../deposits/entities/deposit.entity').Deposit, 'id'>,
  ): Promise<import('../deposits/entities/deposit.entity').Deposit> {
    try {
      const db = this.getFirestore();
      const now = data.requestedAt ?? new Date();
      const raw = { ...data, requestedAt: now } as Record<string, any>;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      const docRef = await db.collection(this.depositsCollection).add(payload);
      const requestedAt = this.serializeDate(payload.requestedAt);
      const completedAt = this.serializeDate(payload.completedAt);
      return {
        id: docRef.id,
        ...(payload as any),
        requestedAt,
        completedAt,
      };
    } catch (error) {
      console.error('Error creating deposit:', error);
      throw error;
    }
  }

  async getDeposits(
    userId: string,
  ): Promise<import('../deposits/entities/deposit.entity').Deposit[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.depositsCollection)
        .where('userId', '==', userId)
        .get();
      const items = snapshot.docs.map((d) => {
        const data = d.data() as any;
        const requestedAt = this.serializeDate(data.requestedAt);
        const completedAt = this.serializeDate(data.completedAt);
        return { id: d.id, ...data, requestedAt, completedAt };
      });
      return items.sort((a, b) => {
        const aTime = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
        const bTime = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
        return bTime - aTime;
      }) as any;
    } catch (error) {
      console.error('Error getting deposits:', error);
      return [] as any;
    }
  }

  async updateDeposit(
    userId: string,
    id: string,
    data: Partial<import('../deposits/entities/deposit.entity').Deposit>,
  ): Promise<boolean> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.depositsCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      const existing = snap.data() as any;
      if (!existing || existing.userId !== userId) return false;
      const raw = { ...data, updatedAt: new Date() } as Record<string, any>;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      await ref.update(payload);
      return true;
    } catch (error) {
      console.error('Error updating deposit:', error);
      return false;
    }
  }

  async deleteDeposit(userId: string, id: string): Promise<boolean> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.depositsCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      const existing = snap.data() as any;
      if (!existing || existing.userId !== userId) return false;
      await ref.delete();
      return true;
    } catch (error) {
      console.error('Error deleting deposit:', error);
      return false;
    }
  }

  private serializeDate(value: any): string | undefined {
    if (!value) return undefined;
    // Firebase Admin Timestamp instance
    const adminAny: any = value;
    if (adminAny && typeof adminAny.toDate === 'function') {
      try {
        return adminAny.toDate().toISOString();
      } catch {}
    }
    // Shape from JSON ({ _seconds, _nanoseconds })
    if (
      typeof adminAny === 'object' &&
      ('_seconds' in adminAny || 'seconds' in adminAny)
    ) {
      const seconds = adminAny._seconds ?? adminAny.seconds ?? 0;
      const nanos = adminAny._nanoseconds ?? adminAny.nanoseconds ?? 0;
      const ms = seconds * 1000 + Math.floor(nanos / 1e6);
      return new Date(ms).toISOString();
    }
    if (value instanceof Date) return value.toISOString();
    // Try parsing if string/number
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch {}
    return undefined;
  }

  async updateWithdrawal(
    userId: string,
    id: string,
    data: Partial<
      import('../withdrawals/entities/withdrawal.entity').Withdrawal
    >,
  ): Promise<boolean> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.withdrawalsCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      const existing = snap.data() as any;
      if (!existing || existing.userId !== userId) return false; // ownership check

      const raw = { ...data, updatedAt: new Date() } as Record<string, any>;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      await ref.update(payload);
      return true;
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      return false;
    }
  }

  async deleteWithdrawal(userId: string, id: string): Promise<boolean> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.withdrawalsCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      const existing = snap.data() as any;
      if (!existing || existing.userId !== userId) return false; // ownership check
      await ref.delete();
      return true;
    } catch (error) {
      console.error('Error deleting withdrawal:', error);
      return false;
    }
  }

  /**
   * Combined wallet history for a user from deposits and withdrawals.
   * Sorted by requestedAt/createdAt desc and limited when provided.
   */
  async getWalletHistory(userId: string, limit?: number): Promise<any[]> {
    try {
      // Prefer explicit wallet_history collection when available
      try {
        const db = this.getFirestore();
        let snap: admin.firestore.QuerySnapshot | null = null as any;
        try {
          // Primary path: requires composite index (userId asc, createdAt desc)
          let query = db
            .collection(this.walletHistoryCollection)
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc');
          if (typeof limit === 'number' && limit > 0) {
            query = query.limit(limit);
          }
          snap = await query.get();
        } catch (idxErr) {
          // Fallback when index is missing: query without orderBy, then sort/limit in-memory
          const query = db
            .collection(this.walletHistoryCollection)
            .where('userId', '==', userId);
          snap = await query.get();
        }

        const fromCollection = (snap?.docs || []).map((d) => {
          const data = d.data() as any;
          const createdAt = this.serializeDate(data.createdAt);
          const updatedAt = this.serializeDate(data.updatedAt);
          return {
            id: d.id,
            ...data,
            ...(createdAt ? { createdAt } : {}),
            ...(updatedAt ? { updatedAt } : {}),
          };
        });

        if (fromCollection.length > 0) {
          // Ensure desc order by createdAt and apply limit if needed
          fromCollection.sort((a: any, b: any) => {
            const at = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bt = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bt - at;
          });
          return typeof limit === 'number' && limit > 0
            ? fromCollection.slice(0, limit)
            : fromCollection;
        }
      } catch (e) {
        // Fall through to legacy composition if collection doesn't exist or other error
      }

      const deposits = await this.getDeposits(userId);
      const withdrawals = await this.getWithdrawals(userId);
      const normalizeTime = (x: any): number => {
        const t = x?.requestedAt || x?.createdAt || x?.updatedAt;
        const d = t ? new Date(t) : null;
        return d && !isNaN(d.getTime()) ? d.getTime() : 0;
      };
      const items = [
        ...deposits.map((d: any) => ({ type: 'deposit', ...d })),
        ...withdrawals.map((w: any) => ({ type: 'withdrawal', ...w })),
      ].sort((a, b) => normalizeTime(b) - normalizeTime(a));
      return typeof limit === 'number' && limit > 0
        ? items.slice(0, limit)
        : items;
    } catch (error) {
      console.error('Error getting wallet history:', error);
      return [];
    }
  }

  // Wallets operations
  async createWallet(
    data: Omit<import('../wallets/entities/wallet.entity').Wallet, 'id'>,
  ): Promise<import('../wallets/entities/wallet.entity').Wallet> {
    try {
      const db = this.getFirestore();
      const now = data.createdAt ?? new Date();
      const raw = { ...data, createdAt: now, updatedAt: now } as Record<
        string,
        any
      >;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      const docRef = await db.collection(this.walletsCollection).add(payload);
      const createdAt = this.serializeDate(payload.createdAt);
      const updatedAt = this.serializeDate(payload.updatedAt);

      // Record history entry
      try {
        const snapshot = {
          name: payload.name,
          platform: payload.platform,
          balance: payload.balance,
          currency: payload.currency,
          address: payload.address,
          notes: payload.notes,
        };
        await db.collection(this.walletHistoryCollection).add({
          userId: payload.userId,
          walletId: docRef.id,
          action: 'create',
          data: { next: snapshot, name: payload.name },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (e) {
        console.warn('Failed to write wallet_history (create):', e);
      }
      return {
        id: docRef.id,
        ...(payload as any),
        createdAt,
        updatedAt,
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  // --- Positions bulk import helpers ---
  private base64Url(input: string): string {
    try {
      return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
    } catch {
      // Fallback simple hash
      let h = 0;
      for (let i = 0; i < input.length; i++) {
        h = (h * 31 + input.charCodeAt(i)) >>> 0;
      }
      return h.toString(36);
    }
  }

  private makeImportDocId(userId: string, key: string): string {
    return `imp_${this.base64Url(`${userId}|${key}`)}`;
  }

  private normalizeDateKey(value: any): string {
    const d = this.toDateLike(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private toDateLike(value: any): Date {
    // Similar to serialize helpers, but always returns a Date (defaults now)
    if (!value) return new Date();
    const anyVal: any = value;
    if (anyVal && typeof anyVal.toDate === 'function') {
      try {
        const d = anyVal.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {}
    }
    if (
      typeof anyVal === 'object' &&
      ('seconds' in anyVal || '_seconds' in anyVal)
    ) {
      const seconds = anyVal.seconds ?? anyVal._seconds ?? 0;
      const nanos = anyVal.nanoseconds ?? anyVal._nanoseconds ?? 0;
      const ms = seconds * 1000 + Math.floor(nanos / 1e6);
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d;
    }
    if (anyVal instanceof Date)
      return !isNaN(anyVal.getTime()) ? anyVal : new Date();
    const parsed = new Date(anyVal);
    return !isNaN(parsed.getTime()) ? parsed : new Date();
  }

  /**
   * Create a position with deterministic doc id for deduping imports.
   * If a doc with the same id exists, skip creation.
   */
  async createPositionImported(
    userId: string,
    data: Partial<any> & {
      importKey: string;
    },
  ): Promise<{ created: boolean; id: string }> {
    const db = this.getFirestore();
    const id = this.makeImportDocId(userId, data.importKey);
    const ref = db.collection(this.positionsCollection).doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      return { created: false, id };
    }
    const now = new Date();
    const payload: Record<string, any> = {
      userId,
      symbol: (data.symbol || '').toString().toUpperCase(),
      side: data.side === 'sell' ? 'sell' : 'buy',
      entryPrice: Number(data.entryPrice) || 0,
      lots: Number(data.lots) || 0,
      investedAmount:
        Number(
          data.investedAmount ??
            (Number(data.entryPrice) || 0) * (Number(data.lots) || 0),
        ) || 0,
      platform: (data.platform as any) || 'Delta Exchange',
      leverage: data.leverage,
      account: (data.account as any) || 'main',
      timestamp: data.timestamp || now.toISOString(),
      status: (data.status as any) || 'open',
      createdAt: now,
      updatedAt: now,
      importKey: data.importKey,
    };
    await ref.set(payload);
    // History (best-effort)
    try {
      await this.addPositionHistoryEntry({
        userId,
        action: 'create',
        positionId: id,
        symbol: payload.symbol,
        details: { imported: true, ...payload },
      });
    } catch {}
    return { created: true, id };
  }

  /**
   * Bulk import positions with deduping. Dedupe key is built as
   * date|symbol|account|platform|entry|lots.
   */
  async createPositionsBulk(
    userId: string,
    items: Array<
      Partial<any> & {
        date?: any;
      }
    >,
  ): Promise<{ created: number; skipped: number; ids: string[] }> {
    let created = 0;
    let skipped = 0;
    const ids: string[] = [];
    for (const raw of items) {
      const symbol = (raw.symbol || '').toString().toUpperCase();
      if (!symbol) {
        skipped++;
        continue;
      }
      const lots = Number(raw.lots) || 0;
      const entry = Number(raw.entryPrice) || 0;
      if (!lots || !entry) {
        skipped++;
        continue;
      }
      const account = (raw.account as any) || 'main';
      const platform = (raw.platform as any) || 'Delta Exchange';
      const dateKey = this.normalizeDateKey(
        raw.date || raw.timestamp || new Date(),
      );
      const key = `${dateKey}|${symbol}|${account}|${platform}|${entry}|${lots}`;
      const res = await this.createPositionImported(userId, {
        ...raw,
        symbol,
        lots,
        entryPrice: entry,
        account,
        platform,
        timestamp:
          raw.timestamp || new Date(dateKey + 'T00:00:00Z').toISOString(),
        importKey: key,
      } as any);
      ids.push(res.id);
      if (res.created) created++;
      else skipped++;
    }
    return { created, skipped, ids };
  }

  async getWallets(
    userId: string,
  ): Promise<import('../wallets/entities/wallet.entity').Wallet[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.walletsCollection)
        .where('userId', '==', userId)
        .get();
      const items = snapshot.docs.map((d) => {
        const data = d.data() as any;
        const createdAt = this.serializeDate(data.createdAt);
        const updatedAt = this.serializeDate(data.updatedAt);
        return { id: d.id, ...data, createdAt, updatedAt };
      });
      return items.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }) as any;
    } catch (error) {
      console.error('Error getting wallets:', error);
      return [] as any;
    }
  }

  async updateWallet(
    userId: string,
    id: string,
    data: Partial<import('../wallets/entities/wallet.entity').Wallet>,
  ): Promise<boolean> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.walletsCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      const existing = snap.data() as any;
      if (!existing || existing.userId !== userId) return false;
      const raw = { ...data, updatedAt: new Date() } as Record<string, any>;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      await ref.update(payload);
      // Record history entry
      try {
        const fields = [
          'name',
          'type',
          'platform',
          'balance',
          'currency',
          'address',
          'notes',
        ] as const;
        const prev = fields.reduce(
          (acc, k) => ({ ...acc, [k]: existing[k] }),
          {} as Record<string, any>,
        );
        const next = fields.reduce(
          (acc, k) => ({
            ...acc,
            [k]: k in payload ? (payload as any)[k] : existing[k],
          }),
          {} as Record<string, any>,
        );
        const changes = fields.reduce(
          (acc, k) => {
            const before = prev[k];
            const after = next[k];
            const changed = (before ?? null) !== (after ?? null);
            if (changed) acc[k] = { from: before, to: after };
            return acc;
          },
          {} as Record<string, { from: any; to: any }>,
        );

        await db.collection(this.walletHistoryCollection).add({
          userId: existing.userId,
          walletId: id,
          action: 'update',
          data: { name: next.name ?? existing.name, prev, next, changes },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (e) {
        console.warn('Failed to write wallet_history (update):', e);
      }
      return true;
    } catch (error) {
      console.error('Error updating wallet:', error);
      return false;
    }
  }

  async deleteWallet(userId: string, id: string): Promise<boolean> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.walletsCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      const existing = snap.data() as any;
      if (!existing || existing.userId !== userId) return false;

      // Write a history entry before deleting so UI can render context after removal
      try {
        const snapshot = {
          name: existing.name,
          platform: existing.platform,
          balance: existing.balance,
          currency: existing.currency,
          address: existing.address,
          notes: existing.notes,
        };
        await db.collection(this.walletHistoryCollection).add({
          userId: existing.userId,
          walletId: id,
          action: 'delete',
          data: { prev: snapshot, name: existing.name },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (e) {
        console.warn('Failed to write wallet_history (delete):', e);
      }

      await ref.delete();
      return true;
    } catch (error) {
      console.error('Error deleting wallet:', error);
      return false;
    }
  }

  // Create an exit entry for a single closed position
  async createExitEntrySingle(params: {
    userId: string;
    position: any;
    pnl: number;
    closedAt?: Date;
  }): Promise<string | null> {
    try {
      const { userId, position, pnl, closedAt } = params;
      const now = new Date();
      const payload = {
        type: 'single',
        userId,
        positionId: position.id,
        symbol: (position.symbol || '').toUpperCase(),
        pnl: Number(pnl) || 0,
        lots: position.lots,
        side: position.side,
        entryPrice: position.entryPrice,
        investedAmount: position.investedAmount,
        platform: (position as any).platform,
        leverage: (position as any).leverage,
        createdAt: now,
        closedAt: closedAt ?? now,
      } as any;
      const docRef = await this.getFirestore()
        .collection(this.exitPositionsCollection)
        .add(payload);
      return docRef.id;
    } catch (error) {
      console.error('Error creating single exit entry:', error);
      return null;
    }
  }

  // Create a bulk exit entry for closing all
  async createExitEntryBulk(params: {
    userId: string;
    symbols: string[];
    totalPnl: number;
    positionsBreakdown?: Array<{ symbol: string; pnl: number }>;
    closedAt?: Date;
  }): Promise<string | null> {
    try {
      const { userId, symbols, totalPnl, closedAt } = params;
      const now = new Date();
      const payload = {
        type: 'bulk',
        userId,
        symbols: (symbols || []).map((s) => (s || '').toUpperCase()),
        totalPnl: Number(totalPnl) || 0,
        positions: (params.positionsBreakdown || []).map((x) => ({
          symbol: (x.symbol || '').toUpperCase(),
          pnl: Number(x.pnl) || 0,
        })),
        createdAt: now,
        closedAt: closedAt ?? now,
      } as any;
      const docRef = await this.getFirestore()
        .collection(this.exitPositionsCollection)
        .add(payload);
      return docRef.id;
    } catch (error) {
      console.error('Error creating bulk exit entry:', error);
      return null;
    }
  }

  // Close all open positions for a specific user; returns number of updated docs
  async closeAllOpenanysForUser(userId: string): Promise<number> {
    try {
      const db = this.getFirestore();
      const snapshot = await db
        .collection(this.positionsCollection)
        .where('userId', '==', userId)
        .where('status', '==', 'open')
        .get();

      if (snapshot.empty) return 0;

      const now = new Date();
      let count = 0;
      // Firestore batch limit is 500 operations; chunk updates to 400 per batch for safety
      const chunkSize = 400;
      for (let i = 0; i < snapshot.docs.length; i += chunkSize) {
        const chunk = snapshot.docs.slice(i, i + chunkSize);
        const batch = db.batch();
        chunk.forEach((doc) => {
          batch.update(doc.ref, {
            status: 'closed',
            closedAt: now,
            updatedAt: now,
          });
          count += 1;
        });
        await batch.commit();
      }
      return count;
    } catch (error) {
      console.error('Error closing all open positions for user:', error);
      return 0;
    }
  }

  // Close all open positions for a specific user and symbol; returns number of updated docs
  async closeOpenanysBySymbolForUser(
    userId: string,
    symbol: string,
  ): Promise<number> {
    const sym = (symbol || '').toUpperCase();
    if (!userId || !sym) return 0;
    try {
      const db = this.getFirestore();
      const snapshot = await db
        .collection(this.positionsCollection)
        .where('userId', '==', userId)
        .where('symbol', '==', sym)
        .where('status', '==', 'open')
        .get();

      if (snapshot.empty) return 0;

      const now = new Date();
      let count = 0;
      const chunkSize = 400;
      for (let i = 0; i < snapshot.docs.length; i += chunkSize) {
        const chunk = snapshot.docs.slice(i, i + chunkSize);
        const batch = db.batch();
        chunk.forEach((doc) => {
          batch.update(doc.ref, {
            status: 'closed',
            closedAt: now,
            updatedAt: now,
          });
          count += 1;
        });
        await batch.commit();
      }
      return count;
    } catch (error) {
      console.error('Error closing positions by symbol for user:', error);
      return 0;
    }
  }

  // Trade P&L operations
  async createTradePnL(
    data: Omit<import('../trade-pnl/trade-pnl.service').TradePnL, 'id'>,
  ): Promise<import('../trade-pnl/trade-pnl.service').TradePnL> {
    try {
      const db = this.getFirestore();
      const now = data.createdAt ?? new Date();
      const raw = { ...data, createdAt: now, updatedAt: now } as Record<
        string,
        any
      >;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      const docRef = await db.collection(this.tradePnLCollection).add(payload);
      const createdAt = this.serializeDate(payload.createdAt);
      const updatedAt = this.serializeDate(payload.updatedAt);
      return {
        id: docRef.id,
        ...(payload as any),
        createdAt,
        updatedAt,
      };
    } catch (error) {
      console.error('Error creating trade P&L:', error);
      throw error;
    }
  }

  async getTradePnL(
    userId: string,
  ): Promise<import('../trade-pnl/trade-pnl.service').TradePnL[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.tradePnLCollection)
        .where('userId', '==', userId)
        .get();
      const items = snapshot.docs.map((d) => {
        const data = d.data() as any;
        const createdAt = this.serializeDate(data.createdAt);
        const updatedAt = this.serializeDate(data.updatedAt);
        return { id: d.id, ...data, createdAt, updatedAt };
      });
      return items.sort((a, b) => {
        // First sort by date (descending - latest date first)
        const aDate = a.date ? new Date(a.date).getTime() : 0;
        const bDate = b.date ? new Date(b.date).getTime() : 0;
        if (aDate !== bDate) {
          return bDate - aDate;
        }

        // If dates are the same, sort by createdAt timestamp (descending - latest created first)
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
      }) as any;
    } catch (error) {
      console.error('Error getting trade P&L:', error);
      return [] as any;
    }
  }

  async updateTradePnL(
    userId: string,
    id: string,
    data: Partial<import('../trade-pnl/trade-pnl.service').TradePnL>,
  ): Promise<boolean> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.tradePnLCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      const existing = snap.data() as any;
      if (!existing || existing.userId !== userId) return false;
      const raw = { ...data, updatedAt: new Date() } as Record<string, any>;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      await ref.update(payload);
      return true;
    } catch (error) {
      console.error('Error updating trade P&L:', error);
      return false;
    }
  }

  async deleteTradePnL(userId: string, id: string): Promise<boolean> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.tradePnLCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      const existing = snap.data() as any;
      if (!existing || existing.userId !== userId) return false;
      await ref.delete();
      return true;
    } catch (error) {
      console.error('Error deleting trade P&L:', error);
      return false;
    }
  }

  async getTradePnLById(
    userId: string,
    id: string,
  ): Promise<import('../trade-pnl/trade-pnl.service').TradePnL | null> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.tradePnLCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return null;
      const data = snap.data() as any;
      if (!data || data.userId !== userId) return null;
      const createdAt = this.serializeDate(data.createdAt);
      const updatedAt = this.serializeDate(data.updatedAt);
      return { id: snap.id, ...data, createdAt, updatedAt };
    } catch (error) {
      console.error('Error getting trade P&L by id:', error);
      return null;
    }
  }

/*
  // Trade Rules operations
  async createTradeRule(
    data: Omit<import('../trade-rules/entities/trade-rule.entity').TradeRule, 'id'>,
  ): Promise<import('../trade-rules/entities/trade-rule.entity').TradeRule> {
    try {
      const db = this.getFirestore();
      const now = new Date();
      const raw = { ...data, createdAt: now, updatedAt: now } as Record<
        string,
        any
      >;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      const docRef = await db.collection(this.tradeRulesCollection).add(payload);
      const createdAt = this.serializeDate(payload.createdAt);
      const updatedAt = this.serializeDate(payload.updatedAt);
      const lastViolation = payload.lastViolation ? this.serializeDate(payload.lastViolation) : undefined;
      return {
        id: docRef.id,
        ...(payload as any),
        createdAt,
        updatedAt,
        lastViolation,
      };
    } catch (error) {
      console.error('Error creating trade rule:', error);
      throw error;
    }
  }

  async getTradeRules(
    userId: string,
  ): Promise<import('../trade-rules/entities/trade-rule.entity').TradeRule[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.tradeRulesCollection)
        .where('userId', '==', userId)
        .get();
      const items = snapshot.docs.map((d) => {
        const data = d.data() as any;
        const createdAt = this.serializeDate(data.createdAt);
        const updatedAt = this.serializeDate(data.updatedAt);
        const lastViolation = data.lastViolation ? this.serializeDate(data.lastViolation) : undefined;
        return { id: d.id, ...data, createdAt, updatedAt, lastViolation };
      });
      return items.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }) as any;
    } catch (error) {
      console.error('Error getting trade rules:', error);
      return [] as any;
    }
  }

  async getTradeRule(
    id: string,
  ): Promise<import('../trade-rules/entities/trade-rule.entity').TradeRule | null> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.tradeRulesCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return null;
      const data = snap.data() as any;
      const createdAt = this.serializeDate(data.createdAt);
      const updatedAt = this.serializeDate(data.updatedAt);
      const lastViolation = data.lastViolation ? this.serializeDate(data.lastViolation) : undefined;
      return { id: snap.id, ...data, createdAt, updatedAt, lastViolation };
    } catch (error) {
      console.error('Error getting trade rule by id:', error);
      return null;
    }
  }

  async updateTradeRule(
    id: string,
    data: Partial<import('../trade-rules/entities/trade-rule.entity').TradeRule>,
  ): Promise<import('../trade-rules/entities/trade-rule.entity').TradeRule> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.tradeRulesCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) {
        throw new Error('Trade rule not found');
      }
      const raw = { ...data, updatedAt: new Date() } as Record<string, any>;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      await ref.update(payload);

      // Get updated document
      const updatedSnap = await ref.get();
      const updatedData = updatedSnap.data() as any;
      const createdAt = this.serializeDate(updatedData.createdAt);
      const updatedAt = this.serializeDate(updatedData.updatedAt);
      const lastViolation = updatedData.lastViolation ? this.serializeDate(updatedData.lastViolation) : undefined;
      return { id: updatedSnap.id, ...updatedData, createdAt, updatedAt, lastViolation };
    } catch (error) {
      console.error('Error updating trade rule:', error);
      throw error;
    }
  }

  async deleteTradeRule(id: string): Promise<void> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.tradeRulesCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) {
        throw new Error('Trade rule not found');
      }
      await ref.delete();
    } catch (error) {
      console.error('Error deleting trade rule:', error);
      throw error;
    }
  }

  // Trade Rule History operations
  async createTradeRuleHistory(data: {
    userId: string;
    ruleId: string;
    ruleTitle: string;
    action: 'created' | 'updated' | 'deleted' | 'violation_recorded';
    timestamp: Date;
    details?: string;
  }): Promise<any> {
    try {
      const db = this.getFirestore();
      const historyData = {
        ...data,
        createdAt: new Date(),
      };
      const docRef = await db.collection(this.tradeRuleHistoryCollection).add(historyData);
      return {
        id: docRef.id,
        ...historyData,
      };
    } catch (error) {
      console.error('Error creating trade rule history:', error);
      throw error;
    }
  }

  async getTradeRuleHistory(userId: string, limit = 20): Promise<any[]> {
    try {
      const db = this.getFirestore();
      const snapshot = await db
        .collection(this.tradeRuleHistoryCollection)
        .where('userId', '==', userId)
        .get();

      const history = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: this.serializeDate(data.timestamp),
          createdAt: this.serializeDate(data.createdAt),
        };
      });

      // Sort by timestamp in descending order (most recent first)
      history.sort((a, b) => {
        const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timestampB - timestampA;
      });

      return history.slice(0, limit);
    } catch (error) {
      console.error('Error getting trade rule history:', error);
      return [];
    }
  }
*/

  // PnL Limits methods
  async getPnlLimits(userId: string): Promise<any> {
    try {
      const db = this.getFirestore();
      const doc = await db.collection(this.pnlLimitsCollection).doc(userId).get();

      if (doc.exists) {
        return doc.data();
      } else {
        // Return default pnl limits
        const defaultPnlLimits = {
          lossAmount: 5,
          profitAmount: 15,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        // Create default pnl limits in database
        await db.collection(this.pnlLimitsCollection).doc(userId).set(defaultPnlLimits);
        return defaultPnlLimits;
      }
    } catch (error) {
      console.error('Error getting pnl limits:', error);
      return { lossAmount: 5, profitAmount: 15 };
    }
  }

  async updatePnlLimits(userId: string, pnlLimits: { lossAmount?: number; profitAmount?: number }): Promise<any> {
    try {
      const db = this.getFirestore();
      const updateData = {
        ...pnlLimits,
        updatedAt: new Date(),
      };

      await db.collection(this.pnlLimitsCollection).doc(userId).update(updateData);

      // Get updated pnl limits
      const doc = await db.collection(this.pnlLimitsCollection).doc(userId).get();
      return doc.data();
    } catch (error) {
      console.error('Error updating pnl limits:', error);
      throw error;
    }
  }

  // ==================== Trading P&L Operations (Shared) ====================
  async createTradingPnL(
    userId: string,
    userName: string,
    data: Omit<import('../trading/entities/trading-pnl.entity').TradingPnL, 'id' | 'userId' | 'userName' | 'createdAt' | 'updatedAt'>,
  ): Promise<import('../trading/entities/trading-pnl.entity').TradingPnL> {
    try {
      const db = this.getFirestore();
      const now = new Date();
      const raw = {
        userId,
        userName,
        ...data,
        createdAt: now,
        updatedAt: now,
      } as Record<string, any>;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      const docRef = await db.collection(this.tradingPnLCollection).add(payload);
      const createdAt = this.serializeDate(payload.createdAt);
      const updatedAt = this.serializeDate(payload.updatedAt);

      // Add to history
      try {
        await db.collection(this.tradingPnLHistoryCollection).add({
          tradingPnLId: docRef.id,
          userId,
          userName,
          action: 'create',
          data: payload,
          createdAt: now,
        });
      } catch (e) {
        console.warn('Failed to write trading PnL history:', e);
      }

      return {
        id: docRef.id,
        ...(payload as any),
        createdAt,
        updatedAt,
      };
    } catch (error) {
      console.error('Error creating trading P&L:', error);
      throw error;
    }
  }

  async getTradingPnL(): Promise<import('../trading/entities/trading-pnl.entity').TradingPnL[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.tradingPnLCollection)
        .get();
      const items = snapshot.docs.map((d) => {
        const data = d.data() as any;
        const createdAt = this.serializeDate(data.createdAt);
        const updatedAt = this.serializeDate(data.updatedAt);
        return { id: d.id, ...data, createdAt, updatedAt };
      });
      return items.sort((a, b) => {
        const aDate = a.date ? new Date(a.date).getTime() : 0;
        const bDate = b.date ? new Date(b.date).getTime() : 0;
        if (aDate !== bDate) {
          return bDate - aDate;
        }
        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
      }) as any;
    } catch (error) {
      console.error('Error getting trading P&L:', error);
      return [] as any;
    }
  }

  async updateTradingPnL(
    id: string,
    userId: string,
    data: Partial<import('../trading/entities/trading-pnl.entity').TradingPnL>,
  ): Promise<boolean> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.tradingPnLCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      const existing = snap.data() as any;

      // Only the creator can update
      if (!existing || existing.userId !== userId) return false;

      const raw = { ...data, updatedAt: new Date() } as Record<string, any>;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      await ref.update(payload);

      // Add to history
      try {
        await db.collection(this.tradingPnLHistoryCollection).add({
          tradingPnLId: id,
          userId,
          userName: existing.userName,
          action: 'update',
          data: payload,
          createdAt: new Date(),
        });
      } catch (e) {
        console.warn('Failed to write trading PnL history:', e);
      }

      return true;
    } catch (error) {
      console.error('Error updating trading P&L:', error);
      return false;
    }
  }

  async deleteTradingPnL(id: string, userId: string): Promise<boolean> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.tradingPnLCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;
      const existing = snap.data() as any;

      // Only the creator can delete
      if (!existing || existing.userId !== userId) return false;

      await ref.delete();

      // Add to history
      try {
        await db.collection(this.tradingPnLHistoryCollection).add({
          tradingPnLId: id,
          userId,
          userName: existing.userName,
          action: 'delete',
          data: existing,
          createdAt: new Date(),
        });
      } catch (e) {
        console.warn('Failed to write trading PnL history:', e);
      }

      return true;
    } catch (error) {
      console.error('Error deleting trading P&L:', error);
      return false;
    }
  }

  // ==================== Trading Wallet Operations (Shared) ====================
  async createTradingWallet(
    data: Omit<import('../trading/entities/trading-wallet.entity').TradingWallet, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<import('../trading/entities/trading-wallet.entity').TradingWallet> {
    try {
      const db = this.getFirestore();
      const now = new Date();
      const raw = { ...data, createdAt: now, updatedAt: now } as Record<string, any>;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      const docRef = await db.collection(this.tradingWalletCollection).add(payload);
      const createdAt = this.serializeDate(payload.createdAt);
      const updatedAt = this.serializeDate(payload.updatedAt);

      // Add to history
      try {
        await db.collection(this.tradingWalletHistoryCollection).add({
          tradingWalletId: docRef.id,
          action: 'create',
          data: payload,
          createdAt: now,
        });
      } catch (e) {
        console.warn('Failed to write trading wallet history:', e);
      }

      return {
        id: docRef.id,
        ...(payload as any),
        createdAt,
        updatedAt,
      };
    } catch (error) {
      console.error('Error creating trading wallet:', error);
      throw error;
    }
  }

  async getTradingWallets(): Promise<import('../trading/entities/trading-wallet.entity').TradingWallet[]> {
    try {
      const snapshot = await this.getFirestore()
        .collection(this.tradingWalletCollection)
        .get();
      const items = snapshot.docs.map((d) => {
        const data = d.data() as any;
        const createdAt = this.serializeDate(data.createdAt);
        const updatedAt = this.serializeDate(data.updatedAt);
        return { id: d.id, ...data, createdAt, updatedAt };
      });
      return items.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }) as any;
    } catch (error) {
      console.error('Error getting trading wallets:', error);
      return [] as any;
    }
  }

  async updateTradingWallet(
    id: string,
    data: Partial<import('../trading/entities/trading-wallet.entity').TradingWallet>,
  ): Promise<boolean> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.tradingWalletCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;

      const raw = { ...data, updatedAt: new Date() } as Record<string, any>;
      const payload = Object.entries(raw).reduce(
        (acc, [k, v]) => {
          if (v !== undefined) (acc as any)[k] = v;
          return acc;
        },
        {} as Record<string, any>,
      );
      await ref.update(payload);

      // Add to history
      try {
        const existing = snap.data() as any;
        await db.collection(this.tradingWalletHistoryCollection).add({
          tradingWalletId: id,
          action: 'update',
          data: payload,
          previousData: existing,
          createdAt: new Date(),
        });
      } catch (e) {
        console.warn('Failed to write trading wallet history:', e);
      }

      return true;
    } catch (error) {
      console.error('Error updating trading wallet:', error);
      return false;
    }
  }

  async deleteTradingWallet(id: string): Promise<boolean> {
    try {
      const db = this.getFirestore();
      const ref = db.collection(this.tradingWalletCollection).doc(id);
      const snap = await ref.get();
      if (!snap.exists) return false;

      const existing = snap.data() as any;
      await ref.delete();

      // Add to history
      try {
        await db.collection(this.tradingWalletHistoryCollection).add({
          tradingWalletId: id,
          action: 'delete',
          data: existing,
          createdAt: new Date(),
        });
      } catch (e) {
        console.warn('Failed to write trading wallet history:', e);
      }

      return true;
    } catch (error) {
      console.error('Error deleting trading wallet:', error);
      return false;
    }
  }

  async getTradingPnLHistory(limit = 50): Promise<any[]> {
    try {
      const db = this.getFirestore();
      const snapshot = await db
        .collection(this.tradingPnLHistoryCollection)
        .get();

      const history = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.serializeDate(data.createdAt),
        };
      });

      history.sort((a, b) => {
        const timestampA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timestampB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timestampB - timestampA;
      });

      return history.slice(0, limit);
    } catch (error) {
      console.error('Error getting trading PnL history:', error);
      return [];
    }
  }

  async getTradingWalletHistory(limit = 50): Promise<any[]> {
    try {
      const db = this.getFirestore();
      const snapshot = await db
        .collection(this.tradingWalletHistoryCollection)
        .get();

      const history = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: this.serializeDate(data.createdAt),
        };
      });

      history.sort((a, b) => {
        const timestampA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timestampB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timestampB - timestampA;
      });

      return history.slice(0, limit);
    } catch (error) {
      console.error('Error getting trading wallet history:', error);
      return [];
    }
  }
}
