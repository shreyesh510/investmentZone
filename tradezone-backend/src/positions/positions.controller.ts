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
  Header,
} from '@nestjs/common';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('positions')
@UseGuards(JwtAuthGuard)
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  async create(@Body() createPositionDto: CreatePositionDto, @Request() req) {
    console.log('🔍 Creating position for user:', req.user.userId);
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in JWT token');
    }
    return await this.positionsService.create(createPositionDto, userId);
  }

  @Get()
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('unique') unique?: string,
    @Query('aggregated') aggregated?: string,
    @Query('representative') representative?: 'latest' | 'earliest',
    @Query('compact') compact?: string,
    @Query('side') side?: 'buy' | 'sell',
    @Query('platform') platform?: 'Delta Exchange' | 'Groww',
    @Query('account') account?: 'main' | 'longterm',
    @Query('timeframe') timeframe?: '1D' | '7D' | '30D' | '90D' | 'all',
    @Query('symbol') symbol?: string,
  ) {
    console.log('🔍 Getting positions for user:', req.user.userId);
    const userId = req.user.userId;

    if (!userId) {
      throw new Error('User ID not found in JWT token');
    }

    const result = await this.positionsService.findAllByQuery(userId, {
      status,
      unique,
      aggregated,
      representative,
      compact,
      side,
      platform,
      account,
      timeframe,
      symbol,
    });
    if (Array.isArray(result)) {
      console.log(`🔍 Found ${result.length} positions for user ${userId}`);
    }
    return result;
  }

  // Removed getAllPositionsWithPnl

  @Get('history')
  async history(@Request() req, @Query('limit') limit?: string) {
    const userId = req.user.userId;
    const n = limit ? parseInt(limit, 10) : undefined;
    return await this.positionsService.history(userId, n);
  }

  @Get('open/list')
  async getOpenPositions(@Request() req) {
    const userId = req.user.userId;
    return await this.positionsService.getOpenPositions(userId);
  }

  @Get('closed/list')
  async getClosedPositions(@Request() req) {
    const userId = req.user.userId;
    return await this.positionsService.getClosedPositions(userId);
  }

  @Get('symbol/:symbol')
  async getBySymbol(@Param('symbol') symbol: string, @Request() req) {
    const userId = req.user.userId;
    return await this.positionsService.getBySymbol(userId, symbol);
  }

  // Bulk import endpoint: accepts JSON { account?: 'main'|'longterm', items: Array<...> }
  @Post('multi')
  async bulkImport(
    @Body() body: { account?: 'main' | 'longterm'; items: Array<any> },
    @Request() req,
  ) {
    const userId = req.user.userId;
    if (!body || !Array.isArray(body.items)) {
      return { created: 0, skipped: 0, ids: [], error: 'items array required' };
    }
    // Forward to service
    return await this.positionsService.bulkImport(
      userId,
      body.items,
      body.account,
    );
  }

  // Removed close-all endpoint

  // Generic ID-based routes last
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return await this.positionsService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    return await this.positionsService.update(id, updatePositionDto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    await this.positionsService.remove(id, userId);
    return { message: 'Position deleted successfully' };
  }
}
