import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';

export enum RuleImportance {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum RuleCategory {
  LOSS = 'loss',
  PROFIT = 'profit',
  RULE = 'rule',
}

export class CreateTradeRuleDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(RuleCategory)
  category: RuleCategory;

  @IsEnum(RuleImportance)
  importance: RuleImportance;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tips?: string[];

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  maxViolationsPerDay?: number;

  @IsNumber()
  @IsOptional()
  penaltyAmount?: number;
}