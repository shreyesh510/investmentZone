import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepositsService } from './deposits.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';

@Controller('deposits')
@UseGuards(JwtAuthGuard)
export class DepositsController {
  constructor(private readonly svc: DepositsService) {}

  @Get()
  async list(@Request() req) {
    const userId = req.user.userId;
    return await this.svc.list(userId);
  }

  @Post()
  async create(@Body() dto: CreateDepositDto, @Request() req) {
    const userId = req.user.userId;
    return await this.svc.create(
      userId,
      dto.amount,
      dto.method,
      dto.description,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDepositDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const ok = await this.svc.update(userId, id, dto as any);
    return { success: ok };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    const ok = await this.svc.remove(userId, id);
    return { success: ok };
  }
}
