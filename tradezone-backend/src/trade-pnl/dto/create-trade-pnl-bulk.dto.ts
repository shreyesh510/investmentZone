import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTradePnLDto } from './create-trade-pnl.dto';

export class CreateTradePnLBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTradePnLDto)
  items: CreateTradePnLDto[];
}

export interface BulkImportResult {
  created: number;
  skipped: number;
  errors: string[];
}
