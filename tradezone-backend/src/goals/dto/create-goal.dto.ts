import { IsString, IsEnum, IsOptional, IsNumber, IsArray } from 'class-validator';
import type { GoalType, GoalStatus } from '../entities/goal.entity';

export class CreateGoalDto {
  @IsString()
  name: string;

  @IsEnum(['financial', 'challenge'])
  type: GoalType;

  @IsOptional()
  @IsEnum(['active', 'completed', 'archived'])
  status?: GoalStatus;

  // Financial goal fields
  @IsOptional()
  @IsNumber()
  targetAmount?: number;

  @IsOptional()
  @IsNumber()
  currentAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  // Challenge goal fields
  @IsOptional()
  @IsNumber()
  totalDays?: number;

  @IsOptional()
  @IsNumber()
  completedDays?: number;

  @IsOptional()
  @IsArray()
  completedDates?: string[];

  // Common fields
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
