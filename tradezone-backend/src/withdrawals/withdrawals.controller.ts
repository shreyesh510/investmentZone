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
import { WithdrawalsService } from './withdrawals.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from './dto/update-withdrawal.dto';

@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalService: WithdrawalsService) {}

  @Get()
  async list(@Request() req) {
    const userId = req.user.userId;
    return await this.withdrawalService.list(userId);
  }

  @Post()
  async create(@Body() dto: CreateWithdrawalDto, @Request() req) {
    const userId = req.user.userId;
    return await this.withdrawalService.create(
      userId,
      dto.amount,
      dto.method,
      dto.description,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWithdrawalDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const ok = await this.withdrawalService.update(userId, id, dto as any);
    return { success: ok };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    const ok = await this.withdrawalService.remove(userId, id);
    return { success: ok };
  }
}
