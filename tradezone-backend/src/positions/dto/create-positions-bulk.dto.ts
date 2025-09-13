import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize } from 'class-validator';
import { CreatePositionDto } from './create-position.dto';

export class CreatePositionsBulkDto {
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreatePositionDto)
  positions!: CreatePositionDto[];
}
