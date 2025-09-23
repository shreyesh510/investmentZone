import { PartialType } from '@nestjs/mapped-types';
import { CreateTradeRuleDto } from './create-trade-rule.dto';

export class UpdateTradeRuleDto extends PartialType(CreateTradeRuleDto) {}