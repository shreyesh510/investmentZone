import { PartialType } from '@nestjs/mapped-types';
import { CreateTradePnLDto } from './create-trade-pnl.dto';

export class UpdateTradePnLDto extends PartialType(CreateTradePnLDto) {}
