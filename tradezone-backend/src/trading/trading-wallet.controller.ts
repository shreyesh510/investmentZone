import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TradingWalletService } from './trading-wallet.service';
import { CreateTradingWalletDto } from './dto/create-trading-wallet.dto';
import { UpdateTradingWalletDto } from './dto/update-trading-wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trading/wallet')
@UseGuards(JwtAuthGuard)
export class TradingWalletController {
  constructor(private readonly tradingWalletService: TradingWalletService) {}

  @Post()
  create(@Body() createTradingWalletDto: CreateTradingWalletDto) {
    return this.tradingWalletService.create(createTradingWalletDto);
  }

  @Get()
  findAll() {
    return this.tradingWalletService.findAll();
  }

  @Get('balance')
  getTotalBalance() {
    return this.tradingWalletService.getTotalBalance();
  }

  @Get('history')
  getHistory(@Query('limit') limit?: string) {
    return this.tradingWalletService.getHistory(limit ? parseInt(limit) : undefined);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTradingWalletDto: UpdateTradingWalletDto) {
    return this.tradingWalletService.update(id, updateTradingWalletDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tradingWalletService.remove(id);
  }
}
