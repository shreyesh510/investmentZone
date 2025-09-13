import { PartialType } from '@nestjs/mapped-types';
import { CreatePositionDto } from './create-position.dto';
import { IsEnum, IsOptional, IsNumber } from 'class-validator';

export class UpdatePositionDto extends PartialType(CreatePositionDto) {
  @IsOptional()
  @IsNumber()
  currentPrice?: number;

  @IsOptional()
  @IsEnum(['open', 'closed'])
  status?: 'open' | 'closed';

  @IsOptional()
  @IsNumber()
  pnl?: number;

  @IsOptional()
  @IsNumber()
  pnlPercentage?: number;

  @IsOptional()
  closedAt?: Date;

  @IsOptional()
  @IsEnum(['main', 'longterm'])
  account?: 'main' | 'longterm';
}
