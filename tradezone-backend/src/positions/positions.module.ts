import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { DatabaseModule } from '../database/database.module';
import { MarketDataService } from './market-data.service';
import { PositionsCronService } from './positions.cron';

@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  controllers: [PositionsController],
  providers: [PositionsService, MarketDataService, PositionsCronService],
  exports: [PositionsService],
})
export class PositionsModule {}
