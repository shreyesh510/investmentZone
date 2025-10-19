import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(@Request() req: any, @Body() createGoalDto: CreateGoalDto) {
    const userId = req.user.userId;
    return this.goalsService.create(userId, createGoalDto);
  }

  @Get()
  findAll(@Request() req: any) {
    const userId = req.user.userId;
    return this.goalsService.findAll(userId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.goalsService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    const userId = req.user.userId;
    return this.goalsService.update(userId, id, updateGoalDto);
  }

  @Post(':id/complete-day')
  markDayComplete(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.goalsService.markDayComplete(userId, id);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.goalsService.remove(userId, id);
  }
}
