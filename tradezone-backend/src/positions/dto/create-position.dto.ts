import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  IsPositive,
  IsIn,
} from 'class-validator';

export class CreatePositionDto {
  @IsString()
  symbol: string;

  @IsEnum(['buy', 'sell'])
  side: 'buy' | 'sell';

  @IsNumber()
  @IsPositive()
  lots: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  entryPrice?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  currentPrice?: number;

  @IsNumber()
  @IsPositive()
  investedAmount: number;

  @IsEnum(['Delta Exchange', 'Groww'])
  platform: 'Delta Exchange' | 'Groww';

  @IsOptional()
  @IsNumber()
  @IsIn([20, 50, 100, 150, 200])
  leverage?: number;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @IsEnum(['main', 'longterm'])
  account?: 'main' | 'longterm';

  @IsOptional()
  @IsNumber()
  @Min(0)
  stopLoss?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  takeProfit?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
