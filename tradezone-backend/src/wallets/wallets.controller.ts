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
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get()
  async list(@Request() req) {
    const userId = req.user.userId;
    return await this.walletsService.list(userId);
  }

  @Post()
  async create(@Body() dto: CreateWalletDto, @Request() req) {
    const userId = req.user.userId;
    return await this.walletsService.create(userId, dto as any);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWalletDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const ok = await this.walletsService.update(userId, id, dto as any);
    return { success: ok };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    const ok = await this.walletsService.remove(userId, id);
    return { success: ok };
  }

  @Get('history/all')
  async history(@Request() req, @Query('limit') limit?: string) {
    const userId = req.user.userId;
    const n = limit ? parseInt(limit, 10) : undefined;
    return await this.walletsService.history(userId, n);
  }
}
