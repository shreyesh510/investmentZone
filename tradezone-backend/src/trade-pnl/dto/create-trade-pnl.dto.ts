import {
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateTradePnLDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsString()
  symbol?: string;

  @IsOptional()
  @IsString()
  datetime?: string;

  @IsNumber()
  @IsNotEmpty()
  profit: number;

  @IsNumber()
  @IsNotEmpty()
  loss: number;

  @IsNumber()
  @IsNotEmpty()
  netPnL: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  totalTrades?: number;

  @IsOptional()
  @IsNumber()
  winningTrades?: number;

  @IsOptional()
  @IsNumber()
  losingTrades?: number;
}
