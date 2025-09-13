import { Module } from '@nestjs/common';
import { TradePnLController } from './trade-pnl.controller';
import { TradePnLService } from './trade-pnl.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TradePnLController],
  providers: [TradePnLService],
  exports: [TradePnLService],
})
export class TradePnLModule {}
