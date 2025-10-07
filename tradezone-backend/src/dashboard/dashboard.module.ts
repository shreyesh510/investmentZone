import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { WalletsModule } from '../wallets/wallets.module';
import { DepositsModule } from '../deposits/deposits.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';
import { TradePnLModule } from '../trade-pnl/trade-pnl.module';

@Module({
  imports: [
    WalletsModule,
    DepositsModule,
    WithdrawalsModule,
    TradePnLModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
