import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export enum RuleImportance {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum RuleCategory {
  RISK = 'risk',
  STRATEGY = 'strategy',
  PSYCHOLOGY = 'psychology',
  TECHNICAL = 'technical',
  FUNDAMENTAL = 'fundamental',
  CUSTOM = 'custom',
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

export class UpdateTradeRuleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(RuleCategory)
  @IsOptional()
  category?: RuleCategory;

  @IsEnum(RuleImportance)
  @IsOptional()
  importance?: RuleImportance;

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

export class TradeRuleViolationDto {
  @IsString()
  ruleId: string;

  @IsString()
  @IsOptional()
  tradeId?: string;

  @IsString()
  description: string;

  @IsNumber()
  @IsOptional()
  penaltyAmount?: number;

  @IsDateString()
  @IsOptional()
  violationDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}