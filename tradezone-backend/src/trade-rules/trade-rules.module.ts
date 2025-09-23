import { Module } from '@nestjs/common';
import { TradeRulesController } from './trade-rules.controller';
import { TradeRulesService } from './trade-rules.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TradeRulesController],
  providers: [TradeRulesService],
  exports: [TradeRulesService],
})
export class TradeRulesModule {}