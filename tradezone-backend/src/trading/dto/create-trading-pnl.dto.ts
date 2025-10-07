import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateTradingPnLDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsNumber()
  @IsNotEmpty()
  pnl: number;

  @IsNumber()
  @IsOptional()
  profit?: number;

  @IsNumber()
  @IsOptional()
  loss?: number;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
