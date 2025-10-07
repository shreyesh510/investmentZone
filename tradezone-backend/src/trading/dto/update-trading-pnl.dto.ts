import { PartialType } from '@nestjs/mapped-types';
import { CreateTradingPnLDto } from './create-trading-pnl.dto';

export class UpdateTradingPnLDto extends PartialType(CreateTradingPnLDto) {}
