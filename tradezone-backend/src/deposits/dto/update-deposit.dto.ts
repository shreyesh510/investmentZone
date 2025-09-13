import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateDepositDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
