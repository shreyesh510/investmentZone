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
import { TradeRulesService } from './trade-rules.service';
import { CreateTradeRuleDto } from './dto/create-trade-rule.dto';
import { UpdateTradeRuleDto } from './dto/update-trade-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trade-rules')
@UseGuards(JwtAuthGuard)
export class TradeRulesController {
  constructor(private readonly tradeRulesService: TradeRulesService) {}

  @Post()
  async create(@Body() createTradeRuleDto: CreateTradeRuleDto, @Request() req) {
    console.log('🔍 Creating trade rule for user:', req.user.userId);
    const userId = req.user.userId;
    if (!userId) {
      throw new Error('User ID not found in JWT token');
    }
    return await this.tradeRulesService.create(createTradeRuleDto, userId);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('category') category?: string,
    @Query('isActive') isActive?: string,
  ) {
    console.log('🔍 Getting trade rules for user:', req.user.userId);
    const userId = req.user.userId;

    if (!userId) {
      throw new Error('User ID not found in JWT token');
    }

    const result = await this.tradeRulesService.findAll(userId, {
      category,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });

    if (Array.isArray(result)) {
      console.log(`🔍 Found ${result.length} trade rules for user ${userId}`);
    }
    return result;
  }

  @Get('violations')
  async getViolations(@Request() req) {
    const userId = req.user.userId;
    return await this.tradeRulesService.getViolations(userId);
  }

  @Get('history')
  async getHistory(@Request() req) {
    const userId = req.user.userId;
    return await this.tradeRulesService.getHistory(userId);
  }

  @Get('pnl-limits')
  async getPnlLimits(@Request() req) {
    const userId = req.user.userId;
    return await this.tradeRulesService.getPnlLimits(userId);
  }

  @Post('pnl-limits')
  async updatePnlLimits(@Request() req, @Body() pnlLimits: { lossAmount?: number; profitAmount?: number }) {
    const userId = req.user.userId;
    return await this.tradeRulesService.updatePnlLimits(userId, pnlLimits);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return await this.tradeRulesService.findOne(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTradeRuleDto: UpdateTradeRuleDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const updatedRule = await this.tradeRulesService.update(id, updateTradeRuleDto, userId);
    return { success: true, id, patch: updateTradeRuleDto };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    await this.tradeRulesService.remove(id, userId);
    return { success: true, message: 'Trade rule deleted successfully' };
  }

  @Post(':id/violation')
  async logViolation(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return await this.tradeRulesService.logViolation(id, userId);
  }
}