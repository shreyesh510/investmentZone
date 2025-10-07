import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateTradingWalletDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  balance: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsOptional()
  platform?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
