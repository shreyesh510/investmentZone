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
  Request,
} from '@nestjs/common';
import { TradePnLService } from './trade-pnl.service';
import { CreateTradePnLDto } from './dto/create-trade-pnl.dto';
import { UpdateTradePnLDto } from './dto/update-trade-pnl.dto';
import { CreateTradePnLBulkDto } from './dto/create-trade-pnl-bulk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trade-pnl')
@UseGuards(JwtAuthGuard)
export class TradePnLController {
  constructor(private readonly tradePnLService: TradePnLService) {}

  @Post()
  create(@Body() createTradePnLDto: CreateTradePnLDto, @Request() req) {
    const userId = req.user.userId;
    return this.tradePnLService.create(createTradePnLDto, userId);
  }

  @Post('bulk-import')
  async bulkImport(
    @Body() createTradePnLBulkDto: CreateTradePnLBulkDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.tradePnLService.bulkImport(createTradePnLBulkDto.items, userId);
  }

  @Get()
  findAll(@Request() req, @Query('days') days?: string) {
    const userId = req.user.userId;
    const daysNum = days ? parseInt(days) : undefined;
    return this.tradePnLService.findAll(userId, daysNum);
  }

  @Get('statistics')
  getStatistics(@Request() req, @Query('days') days?: string) {
    const userId = req.user.userId;
    const daysNum = days ? parseInt(days) : 30;
    return this.tradePnLService.getStatistics(userId, daysNum);
  }

  @Get('by-date/:date')
  findByDate(@Param('date') date: string, @Request() req) {
    const userId = req.user.userId;
    return this.tradePnLService.findByDate(date, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.tradePnLService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTradePnLDto: UpdateTradePnLDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return this.tradePnLService.update(id, updateTradePnLDto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    await this.tradePnLService.remove(id, userId);
    return { success: true };
  }
}
