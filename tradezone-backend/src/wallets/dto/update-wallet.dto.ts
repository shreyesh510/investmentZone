import { IsOptional, IsNumber, IsString, IsIn } from 'class-validator';

export class UpdateWalletDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['demat', 'bank'])
  type?: 'demat' | 'bank';

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
