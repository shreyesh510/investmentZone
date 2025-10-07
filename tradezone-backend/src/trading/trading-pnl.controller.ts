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
  Query,
} from '@nestjs/common';
import { TradingPnLService } from './trading-pnl.service';
import { CreateTradingPnLDto } from './dto/create-trading-pnl.dto';
import { UpdateTradingPnLDto } from './dto/update-trading-pnl.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trading/pnl')
@UseGuards(JwtAuthGuard)
export class TradingPnLController {
  constructor(private readonly tradingPnLService: TradingPnLService) {}

  @Post()
  create(@Request() req, @Body() createTradingPnLDto: CreateTradingPnLDto) {
    const userId = req.user.userId;
    const userName = req.user.name || req.user.email;
    return this.tradingPnLService.create(userId, userName, createTradingPnLDto);
  }

  @Get()
  findAll(@Query('date') date?: string) {
    return this.tradingPnLService.findAll(date);
  }

  @Get('summary/daily')
  getDailySummary(@Query('date') date: string) {
    return this.tradingPnLService.getDailySummary(date);
  }

  @Get('history')
  getHistory(@Query('limit') limit?: string) {
    return this.tradingPnLService.getHistory(limit ? parseInt(limit) : undefined);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTradingPnLDto: UpdateTradingPnLDto,
  ) {
    const userId = req.user.userId;
    return this.tradingPnLService.update(id, userId, updateTradingPnLDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    const userId = req.user.userId;
    return this.tradingPnLService.remove(id, userId);
  }
}
