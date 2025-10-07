import { Injectable } from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import { CreateTradingWalletDto } from './dto/create-trading-wallet.dto';
import { UpdateTradingWalletDto } from './dto/update-trading-wallet.dto';
import { TradingWallet } from './entities/trading-wallet.entity';

@Injectable()
export class TradingWalletService {
  constructor(
    private readonly firebaseDatabaseService: FirebaseDatabaseService,
  ) {}

  async create(createTradingWalletDto: CreateTradingWalletDto): Promise<TradingWallet> {
    return this.firebaseDatabaseService.createTradingWallet(createTradingWalletDto);
  }

  async findAll(): Promise<TradingWallet[]> {
    return this.firebaseDatabaseService.getTradingWallets();
  }

  async update(id: string, updateTradingWalletDto: UpdateTradingWalletDto): Promise<boolean> {
    return this.firebaseDatabaseService.updateTradingWallet(id, updateTradingWalletDto);
  }

  async remove(id: string): Promise<boolean> {
    return this.firebaseDatabaseService.deleteTradingWallet(id);
  }

  async getHistory(limit?: number): Promise<any[]> {
    return this.firebaseDatabaseService.getTradingWalletHistory(limit);
  }

  // Get total wallet balance
  async getTotalBalance(): Promise<{
    totalBalance: number;
    byCurrency: Record<string, number>;
    wallets: TradingWallet[];
  }> {
    const wallets = await this.findAll();
    let totalBalance = 0;
    const byCurrency: Record<string, number> = {};

    wallets.forEach((wallet) => {
      const balance = wallet.balance || 0;
      totalBalance += balance;

      if (!byCurrency[wallet.currency]) {
        byCurrency[wallet.currency] = 0;
      }
      byCurrency[wallet.currency] += balance;
    });

    return {
      totalBalance,
      byCurrency,
      wallets,
    };
  }
}
