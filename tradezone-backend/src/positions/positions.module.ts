import { Module } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { DatabaseModule } from '../database/database.module';
import { MarketDataService } from './market-data.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PositionsController],
  providers: [PositionsService, MarketDataService],
  exports: [PositionsService],
})
export class PositionsModule {}
