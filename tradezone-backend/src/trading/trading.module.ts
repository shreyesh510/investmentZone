import { Module } from '@nestjs/common';
import { TradingPnLService } from './trading-pnl.service';
import { TradingWalletService } from './trading-wallet.service';
import { TradingPnLController } from './trading-pnl.controller';
import { TradingWalletController } from './trading-wallet.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TradingPnLController, TradingWalletController],
  providers: [TradingPnLService, TradingWalletService],
  exports: [TradingPnLService, TradingWalletService],
})
export class TradingModule {}
