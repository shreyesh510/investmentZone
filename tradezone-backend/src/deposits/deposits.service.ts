import { Injectable } from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import type { Deposit } from './entities/deposit.entity';

@Injectable()
export class DepositsService {
  constructor(private readonly db: FirebaseDatabaseService) {}

  async create(
    userId: string,
    amount: number,
    method?: string,
    description?: string,
  ): Promise<Deposit> {
    const base: any = {
      userId,
      amount,
      status: 'pending',
      requestedAt: new Date(),
    };
    if (method !== undefined) base.method = method;
    if (description !== undefined) base.description = description;
    return await this.db.createDeposit(base);
  }

  async list(userId: string): Promise<Deposit[]> {
    return await this.db.getDeposits(userId);
  }

  async update(
    userId: string,
    id: string,
    data: Partial<Deposit>,
  ): Promise<boolean> {
    return await this.db.updateDeposit(userId, id, data);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    return await this.db.deleteDeposit(userId, id);
  }
}
