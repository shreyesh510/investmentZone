import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import { CreateTradeRuleDto } from './dto/create-trade-rule.dto';
import { UpdateTradeRuleDto } from './dto/update-trade-rule.dto';
import { TradeRule } from './entities/trade-rule.entity';

@Injectable()
export class TradeRulesService {
  constructor(
    private readonly firebaseDatabaseService: FirebaseDatabaseService,
  ) {}

  async create(
    createTradeRuleDto: CreateTradeRuleDto,
    userId: string,
  ): Promise<TradeRule> {
    console.log('🔍 Creating trade rule with data:', createTradeRuleDto);
    console.log('🔍 For user ID:', userId);

    const tradeRuleData = {
      ...createTradeRuleDto,
      userId: userId,
      violations: 0,
      isActive: createTradeRuleDto.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tradeRule = await this.firebaseDatabaseService.createTradeRule(tradeRuleData);

    // Record history
    await this.firebaseDatabaseService.createTradeRuleHistory({
      userId,
      ruleId: tradeRule.id,
      ruleTitle: tradeRule.title,
      action: 'created',
      timestamp: new Date(),
      details: `Created rule: ${tradeRule.title}`,
    });

    console.log('✅ Trade rule created successfully:', tradeRule.id);
    return tradeRule;
  }

  async findAll(
    userId: string,
    filters?: {
      category?: string;
      isActive?: boolean;
    },
  ): Promise<TradeRule[]> {
    console.log('🔍 Finding all trade rules for user:', userId);
    console.log('🔍 With filters:', filters);

    try {
      const tradeRules = await this.firebaseDatabaseService.getTradeRules(userId);

      // Ensure we have an array
      if (!Array.isArray(tradeRules)) {
        console.log('⚠️ No trade rules found or invalid data format for user:', userId);
        return [];
      }

      let filteredRules = tradeRules;

      if (filters?.category) {
        filteredRules = filteredRules.filter(rule => rule.category === filters.category);
      }

      if (filters?.isActive !== undefined) {
        filteredRules = filteredRules.filter(rule => rule.isActive === filters.isActive);
      }

      console.log(`✅ Found ${filteredRules.length} trade rules for user ${userId}`);
      return filteredRules;
    } catch (error) {
      console.error('❌ Error fetching trade rules for user:', userId, error);
      return [];
    }
  }

  async findOne(id: string, userId: string): Promise<TradeRule> {
    console.log('🔍 Finding trade rule:', id, 'for user:', userId);

    const tradeRule = await this.firebaseDatabaseService.getTradeRule(id);

    if (!tradeRule) {
      throw new NotFoundException(`Trade rule with ID ${id} not found`);
    }

    if (tradeRule.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this trade rule');
    }

    console.log('✅ Trade rule found:', tradeRule.id);
    return tradeRule;
  }

  async update(
    id: string,
    updateTradeRuleDto: UpdateTradeRuleDto,
    userId: string,
  ): Promise<TradeRule> {
    console.log('🔍 Updating trade rule:', id, 'for user:', userId);
    console.log('🔍 With data:', updateTradeRuleDto);

    // First verify the rule exists and belongs to the user
    const existingRule = await this.findOne(id, userId);

    const updateData = {
      ...updateTradeRuleDto,
      updatedAt: new Date(),
    };

    const updatedRule = await this.firebaseDatabaseService.updateTradeRule(id, updateData);

    // Record history
    await this.firebaseDatabaseService.createTradeRuleHistory({
      userId,
      ruleId: id,
      ruleTitle: existingRule.title,
      action: 'updated',
      timestamp: new Date(),
      details: `Updated rule: ${existingRule.title}`,
    });

    console.log('✅ Trade rule updated successfully:', id);
    return updatedRule;
  }

  async remove(id: string, userId: string): Promise<void> {
    console.log('🔍 Removing trade rule:', id, 'for user:', userId);

    // First verify the rule exists and belongs to the user
    const existingRule = await this.findOne(id, userId);

    await this.firebaseDatabaseService.deleteTradeRule(id);

    // Record history
    await this.firebaseDatabaseService.createTradeRuleHistory({
      userId,
      ruleId: id,
      ruleTitle: existingRule.title,
      action: 'deleted',
      timestamp: new Date(),
      details: `Deleted rule: ${existingRule.title}`,
    });

    console.log('✅ Trade rule deleted successfully:', id);
  }

  async logViolation(id: string, userId: string): Promise<TradeRule> {
    console.log('🔍 Logging violation for trade rule:', id, 'for user:', userId);

    const tradeRule = await this.findOne(id, userId);

    const updateData = {
      violations: tradeRule.violations + 1,
      lastViolation: new Date(),
      updatedAt: new Date(),
    };

    const updatedRule = await this.firebaseDatabaseService.updateTradeRule(id, updateData);

    // Record history
    await this.firebaseDatabaseService.createTradeRuleHistory({
      userId,
      ruleId: id,
      ruleTitle: tradeRule.title,
      action: 'violation_recorded',
      timestamp: new Date(),
      details: `Broke rule: ${tradeRule.title} (${tradeRule.violations + 1} times total)`,
    });

    console.log('✅ Violation logged successfully for rule:', id);
    return updatedRule;
  }

  async getHistory(userId: string): Promise<any[]> {
    console.log('🔍 Getting trade rule history for user:', userId);
    return await this.firebaseDatabaseService.getTradeRuleHistory(userId);
  }

  async getPnlLimits(userId: string): Promise<any> {
    console.log('🔍 Getting pnl limits for user:', userId);
    return await this.firebaseDatabaseService.getPnlLimits(userId);
  }

  async updatePnlLimits(userId: string, pnlLimits: { lossAmount?: number; profitAmount?: number }): Promise<any> {
    console.log('🔍 Updating pnl limits for user:', userId, 'with data:', pnlLimits);
    return await this.firebaseDatabaseService.updatePnlLimits(userId, pnlLimits);
  }

  async getViolations(userId: string): Promise<any> {
    console.log('🔍 Getting violations for user:', userId);

    try {
      const tradeRules = await this.firebaseDatabaseService.getTradeRules(userId);

      // If no rules found, return empty analysis structure
      if (!Array.isArray(tradeRules) || tradeRules.length === 0) {
        return this.getEmptyViolationAnalysis();
      }

      // Get all rules with violations
      const violationsData = tradeRules.filter(rule => rule.violations > 0);

      // Find most violated rule
      const mostViolatedRule = violationsData.length > 0
        ? violationsData.reduce((prev, current) =>
            (current.violations > prev.violations) ? current : prev
          )
        : null;

      // Build category breakdown
      const categoryBreakdown = {};
      tradeRules.forEach(rule => {
        const category = rule.category || 'custom';
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { rules: 0, violations: 0 };
        }
        categoryBreakdown[category].rules += 1;
        categoryBreakdown[category].violations += rule.violations || 0;
      });

      // Build daily violations (mock for now - would need violation timestamps)
      const dailyViolations = [];

      // Build recent violations list
      const recentViolations = violationsData
        .filter(rule => rule.lastViolation)
        .map(rule => ({
          ruleId: rule.id,
          ruleTitle: rule.title,
          violationDate: rule.lastViolation,
        }))
        .sort((a, b) => {
          const dateA = a.violationDate ? new Date(a.violationDate).getTime() : 0;
          const dateB = b.violationDate ? new Date(b.violationDate).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 10); // Last 10 violations

      const totalViolations = tradeRules.reduce((sum, rule) => sum + (rule.violations || 0), 0);
      const violatedRules = tradeRules.filter(rule => rule.violations > 0).length;
      const activeRules = tradeRules.filter(rule => rule.isActive !== false).length;

      const analysis = {
        totalViolations,
        totalRules: tradeRules.length,
        activeRules,
        violatedRules,
        averageViolationsPerRule: tradeRules.length > 0 ? totalViolations / tradeRules.length : 0,
        mostViolatedRule: mostViolatedRule ? {
          id: mostViolatedRule.id,
          title: mostViolatedRule.title,
          violations: mostViolatedRule.violations,
        } : null,
        categoryBreakdown,
        dailyViolations,
        recentViolations,
      };

      console.log('✅ Violations analysis completed for user:', userId);
      return analysis;
    } catch (error) {
      console.error('❌ Error getting violations:', error);
      return this.getEmptyViolationAnalysis();
    }
  }

  private getEmptyViolationAnalysis() {
    return {
      totalViolations: 0,
      totalRules: 0,
      activeRules: 0,
      violatedRules: 0,
      averageViolationsPerRule: 0,
      mostViolatedRule: null,
      categoryBreakdown: {},
      dailyViolations: [],
      recentViolations: [],
    };
  }
}