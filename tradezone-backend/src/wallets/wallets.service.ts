import { Injectable } from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import type { Wallet } from './entities/wallet.entity';

@Injectable()
export class WalletsService {
  constructor(private readonly db: FirebaseDatabaseService) {}

  async create(userId: string, payload: Partial<Wallet>): Promise<Wallet> {
    const base: Omit<Wallet, 'id'> = {
      userId,
      name: payload.name || 'Wallet',
      platform: payload.platform,
      balance: payload.balance ?? 0,
      currency: payload.currency || 'USD',
      address: payload.address,
      notes: payload.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await this.db.createWallet(base as any);
  }

  async list(userId: string): Promise<Wallet[]> {
    return await this.db.getWallets(userId);
  }

  async update(
    userId: string,
    id: string,
    data: Partial<Wallet>,
  ): Promise<boolean> {
    return await this.db.updateWallet(userId, id, data);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    return await this.db.deleteWallet(userId, id);
  }

  async history(userId: string, limit?: number): Promise<any[]> {
    return await this.db.getWalletHistory(userId, limit);
  }
}
