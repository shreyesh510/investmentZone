import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Position } from './entities/position.entity';
import { MarketDataService } from './market-data.service';

@Injectable()
export class PositionsService {
  constructor(
    private readonly firebaseDatabaseService: FirebaseDatabaseService,
    private readonly marketData: MarketDataService,
  ) {}

  async create(
    createPositionDto: CreatePositionDto,
    userId: string,
  ): Promise<Position> {
    console.log('🔍 Creating position with data:', createPositionDto);
    console.log('🔍 For user ID:', userId);

    const {
      entryPrice: _entryPriceIgnored,
      leverage: _levIgnored,
      ...rest
    } = createPositionDto as any;
    const positionData = {
      ...rest,
      account: (createPositionDto as any).account,
      status: (createPositionDto as any).status || 'open',
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      timestamp: createPositionDto.timestamp || new Date().toISOString(),
    };

    const position =
      await this.firebaseDatabaseService.createPosition(positionData);
    // Log history: create
    try {
      await this.firebaseDatabaseService.addPositionHistoryEntry({
        userId,
        action: 'create',
        positionId: position.id,
        symbol: position.symbol,
        details: { ...positionData },
      });
    } catch {}
    console.log('✅ Position created successfully:', position.id);
    return position;
  }

  async findAll(userId: string): Promise<Position[]> {
    console.log('🔍 Finding all positions for user:', userId);

    try {
      const positions = await this.firebaseDatabaseService.getPositions(userId);
      console.log(`📊 Found ${positions.length} positions for user ${userId}`);

      // Log first few positions for debugging
      if (positions.length > 0) {
        console.log('📄 Sample positions:');
        positions.slice(0, 3).forEach((pos, index) => {
          console.log(
            `  ${index + 1}. ${pos.symbol} - ${pos.side} - ${pos.lots} lots`,
          );
        });
      }

      return positions;
    } catch (error) {
      console.error('❌ Error in findAll:', error);
      throw error;
    }
  }

  // Helper: pick most recent position per symbol (case-insensitive)
  public uniqueBySymbol(positions: Position[]): Position[] {
    const bySymbol = new Map<string, Position>();
    const toEpoch = (p: Position): number => {
      const t1 = (p as any).createdAt
        ? new Date((p as any).createdAt).getTime()
        : NaN;
      const t2 = (p as any).updatedAt
        ? new Date((p as any).updatedAt).getTime()
        : NaN;
      const t3 = (p as any).timestamp ? Date.parse((p as any).timestamp) : NaN;
      return Math.max(
        Number.isFinite(t1) ? t1 : 0,
        Number.isFinite(t2) ? t2 : 0,
        Number.isFinite(t3) ? t3 : 0,
      );
    };
    for (const p of positions) {
      const key = (p.symbol || '').toUpperCase();
      const existing = bySymbol.get(key);
      if (!existing) {
        bySymbol.set(key, p);
        continue;
      }
      if (toEpoch(p) >= toEpoch(existing)) {
        bySymbol.set(key, p);
      }
    }
    return Array.from(bySymbol.values());
  }

  async findAllUnique(userId: string): Promise<Position[]> {
    const positions = await this.findAll(userId);
    return this.uniqueBySymbol(positions);
  }

  async findOne(id: string, userId: string): Promise<Position> {
    const position = await this.firebaseDatabaseService.getPositionById(id);

    if (!position) {
      throw new NotFoundException('Position not found');
    }

    if (position.userId !== userId) {
      throw new ForbiddenException(
        'Unauthorized: Position does not belong to user',
      );
    }

    return position;
  }

  async update(
    id: string,
    updatePositionDto: UpdatePositionDto,
    userId: string,
  ): Promise<Position> {
    // First check if position exists and belongs to user
    const existing = await this.findOne(id, userId);

    const updateData = {
      ...updatePositionDto,
      updatedAt: new Date(),
    };

    // Ensure closedAt is set when closing
    if (updateData.status === 'closed' && !(updateData as any).closedAt) {
      (updateData as any).closedAt = new Date();
    }

    await this.firebaseDatabaseService.updatePosition(id, updateData);
    // Log history: update
    try {
      await this.firebaseDatabaseService.addPositionHistoryEntry({
        userId,
        action: (updateData as any).status === 'closed' ? 'close' : 'update',
        positionId: id,
        symbol: existing.symbol,
        details: { ...updatePositionDto },
      });
    } catch {}

    // Return the updated position
    const updated = await this.findOne(id, userId);

    // If we transitioned to closed, create an exit entry
    if (existing.status !== 'closed' && updateData.status === 'closed') {
      const pnlNumber = Number((updatePositionDto as any).pnl) || 0;
      await this.firebaseDatabaseService.createExitEntrySingle({
        userId,
        position: updated,
        pnl: pnlNumber,
        closedAt: (updateData as any).closedAt,
      });
      // Optionally, close any other open legs for the same symbol for this user to keep state consistent
      try {
        await this.firebaseDatabaseService.closeOpenPositionsBySymbolForUser(
          userId,
          updated.symbol,
        );
      } catch (e) {
        // non-fatal
      }
    }

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    // First check if position exists and belongs to user
    const existing = await this.findOne(id, userId);

    await this.firebaseDatabaseService.deletePosition(id);
    // Log history: delete
    try {
      await this.firebaseDatabaseService.addPositionHistoryEntry({
        userId,
        action: 'delete',
        positionId: id,
        symbol: existing.symbol,
        details: { before: existing },
      });
    } catch {}
  }

  async getOpenPositions(userId: string): Promise<Position[]> {
    const allPositions = await this.findAll(userId);
    return allPositions.filter((position) => position.status === 'open');
  }

  async getClosedPositions(userId: string): Promise<Position[]> {
    const allPositions = await this.findAll(userId);
    return allPositions.filter((position) => position.status === 'closed');
  }

  async getBySymbol(userId: string, symbol: string): Promise<Position[]> {
    // Normalize symbol to uppercase to match stored data
    const sym = (symbol || '').toUpperCase();
    return this.firebaseDatabaseService.getPositionsBySymbol(userId, sym);
  }

  async history(userId: string, limit?: number): Promise<any[]> {
    return await this.firebaseDatabaseService.getPositionHistory(userId, limit);
  }

  // Bulk import positions with deduping using deterministic keys
  async bulkImport(
    userId: string,
    items: Array<any>,
    defaultAccount?: 'main' | 'longterm',
  ) {
    const normalized = Array.isArray(items)
      ? items.map((x) => {
          const obj = { ...(x || {}) };
          if (!obj.account && defaultAccount) obj.account = defaultAccount;
          // Normalize field names from typical Excel headers
          if (obj.Symbol && !obj.symbol) obj.symbol = String(obj.Symbol);
          if (obj.Lots && !obj.lots) obj.lots = Number(obj.Lots);
          if ((obj.Entry || obj['Entry Price']) && !obj.entryPrice)
            obj.entryPrice = Number(obj.Entry ?? obj['Entry Price']);
          if (
            (obj.Amount || obj.Invested || obj.Margin) &&
            obj.investedAmount === undefined
          ) {
            const n = Number(obj.Amount ?? obj.Invested ?? obj.Margin);
            if (Number.isFinite(n)) obj.investedAmount = n;
          }
          if (obj.Side && !obj.side)
            obj.side =
              String(obj.Side).toLowerCase() === 'sell' ? 'sell' : 'buy';
          if (obj.Platform && !obj.platform) obj.platform = obj.Platform;
          if (obj.Date && !obj.date) obj.date = obj.Date;
          if (obj.Timestamp && !obj.timestamp) obj.timestamp = obj.Timestamp;
          return obj;
        })
      : [];
    return await this.firebaseDatabaseService.createPositionsBulk(
      userId,
      normalized,
    );
  }

  // Helper: same calendar day check
  private isSameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  // Helper: parse various timestamp formats to a Date. Falls back to today if invalid.
  private parseToDate(value?: string | Date): Date {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    // Fast-path ISO
    const iso = Date.parse(value);
    if (!Number.isNaN(iso)) return new Date(iso);
    // Handle Delta CSV like: "2025-09-05 20:27:42.507554+05:30 IST Asia/Kolkata"
    // Extract the YYYY-MM-DD part and construct a date in local time.
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      // Create date at midnight local time for date-only comparison
      const [y, m, d] = match[1].split('-').map(Number);
      return new Date(y, (m || 1) - 1, d || 1);
    }
    // Last resort: now
    return new Date();
  }

  // Removed bulk default leverage helper

  // Helper: compute cutoff date for timeframe as last N days (24h per day)
  private getTimeframeCutoff(
    timeframe?: '1D' | '7D' | '30D' | '90D' | 'all',
  ): Date | null {
    if (!timeframe || timeframe === 'all') return null;
    const days =
      timeframe === '1D'
        ? 1
        : timeframe === '7D'
          ? 7
          : timeframe === '30D'
            ? 30
            : 90;
    const ms = days * 24 * 60 * 60 * 1000;
    return new Date(Date.now() - ms);
  }

  // Helper: best-effort conversion of various timestamp representations to Date
  private toDate(value: any): Date | null {
    if (!value) return null;
    try {
      // Firestore Timestamp-like
      if (value && typeof value.toDate === 'function') {
        const d = value.toDate();
        return d instanceof Date && !isNaN(d.getTime()) ? d : null;
      }
      if (
        typeof value === 'object' &&
        ('seconds' in value || '_seconds' in value)
      ) {
        const seconds = value.seconds ?? value._seconds ?? 0;
        const nanos = value.nanoseconds ?? value._nanoseconds ?? 0;
        const ms = seconds * 1000 + Math.floor(nanos / 1e6);
        const d = new Date(ms);
        return !isNaN(d.getTime()) ? d : null;
      }
      // Date instance or parsable string/number
      if (value instanceof Date) return !isNaN(value.getTime()) ? value : null;
      const d = new Date(value);
      return !isNaN(d.getTime()) ? d : null;
    } catch {
      return null;
    }
  }

  // Removed bulk create handler

  // Calculate P&L for a position
  calculatePnL(position: Position): { pnl: number; pnlPercent: number } {
    const entry = Number(position.entryPrice ?? 0);
    const lots = Number(position.lots ?? 0);
    const invested = Number(position.investedAmount ?? 0);
    const currentRaw = (position as any).currentPrice;
    const current = typeof currentRaw === 'number' ? currentRaw : entry;
    if (!entry || entry <= 0 || !lots) {
      return { pnl: 0, pnlPercent: 0 };
    }
    const priceDiff =
      position.side === 'buy' ? current - entry : entry - current;
    const pnl = priceDiff * lots;
    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
    return { pnl, pnlPercent };
  }

  // Calculate P&L using lot-size qty when known; fallback to notional-based qty.
  private calcPnlWithLive(
    position: Position,
    current: number | null | undefined,
  ) {
    const entry = Number(position.entryPrice ?? 0);
    if (!entry || entry <= 0) {
      return { pnl: 0, pnlPercent: 0 };
    }
    const live = typeof current === 'number' && current > 0 ? current : entry;
    const priceDiff = position.side === 'buy' ? live - entry : entry - live;

    const lotSize = this.marketData.getLotSize(position.symbol);
    let qty = 0;
    let investedUsd = Number(position.investedAmount || 0);
    if (lotSize > 0) {
      qty = (Number(position.lots) || 0) * lotSize;
      // for percent, approximate invested as entry*qty/leverage if leverage present
      const notionalAtEntry = entry * qty;
      const lev = (position as any).leverage || 1;
      investedUsd = lev > 0 ? notionalAtEntry / lev : notionalAtEntry;
    } else {
      const lev = (position as any).leverage || 1;
      const notional = investedUsd * lev;
      qty = entry > 0 ? notional / entry : 0;
    }

    const pnl = priceDiff * qty;
    const pnlPercent = investedUsd > 0 ? (pnl / investedUsd) * 100 : 0;
    return { pnl, pnlPercent };
  }

  // Aggregated open positions grouped by symbol with live P&L
  async getOpenPositionsAggregated(
    userId: string,
    representative: 'latest' | 'earliest' = 'latest',
  ): Promise<
    Array<{
      id: string;
      userId: string;
      symbol: string;
      side: 'buy' | 'sell';
      lots: number;
      investedAmount: number;
      platform?: string;
      leverage?: number;
      status?: string;
      timestamp?: any;
      createdAt?: any;
      updatedAt?: any;
      pnl: number;
      currentPrice: number | null;
      ids?: string[];
    }>
  > {
    const open = await this.getOpenPositions(userId);
    if (open.length === 0) return [];

    const round = (val: number, decimals = 2) =>
      Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);

    // Group by symbol
    const groups = new Map<string, Position[]>();
    for (const p of open) {
      const key = (p.symbol || '').toUpperCase();
      const arr = groups.get(key) ?? [];
      arr.push(p);
      groups.set(key, arr);
    }

    // Fetch live prices in one shot
    const symbols = Array.from(groups.keys());
    const priceMap = await this.marketData.getUsdPricesForSymbols(symbols);

    // Build summary per symbol
    const result: Array<any> = [];

    for (const [sym, arr] of groups.entries()) {
      const totalLots = arr.reduce((s, p) => s + (p.lots || 0), 0);
      // Normalize invested USD: prefer stored investedAmount per leg, fallback to derived
      const invSum = arr.reduce((s, p) => {
        const invested = Number(p.investedAmount) || 0;
        return s + (invested > 0 ? invested : 0);
      }, 0);

      const totalInvested = invSum; // Keep as USD, no conversion needed
      // Representative position (latest/earliest by timestamp/created/updated)
      const toEpoch = (p: Position): number => {
        const t1 = (p as any).createdAt
          ? new Date((p as any).createdAt).getTime()
          : NaN;
        const t2 = (p as any).updatedAt
          ? new Date((p as any).updatedAt).getTime()
          : NaN;
        const t3 = (p as any).timestamp
          ? Date.parse((p as any).timestamp)
          : NaN;
        return Math.max(
          Number.isFinite(t1) ? t1 : 0,
          Number.isFinite(t2) ? t2 : 0,
          Number.isFinite(t3) ? t3 : 0,
        );
      };
      const sorted = [...arr].sort((a, b) => toEpoch(a) - toEpoch(b));
      const rep =
        representative === 'earliest' ? sorted[0] : sorted[sorted.length - 1];
      const side = rep?.side ?? 'buy';

      const live = priceMap[sym];
      // P&L: sum per-leg; prefer qty from invested & leverage when available
      let pnl = 0;
      if (typeof live === 'number' && live > 0) {
        for (const p of arr) {
          if (!p.entryPrice || p.entryPrice <= 0) continue;
          const lev =
            (p as any).leverage && (p as any).leverage > 0
              ? Number((p as any).leverage)
              : 1;
          let qty = 0;
          const lotSize = this.marketData.getLotSize(p.symbol) || 0;
          if (lotSize > 0) {
            qty = (p.lots || 0) * lotSize;
          } else {
            // Fallback when lot size is unknown: derive qty from invested and leverage
            const invested = Number(p.investedAmount) || 0;
            qty =
              invested > 0 && p.entryPrice > 0
                ? (invested * lev) / p.entryPrice
                : 0;
          }
          const diff =
            p.side === 'buy' ? live - p.entryPrice : p.entryPrice - live;
          pnl += diff * qty;
        }
      }

      result.push({
        id: (rep as any)?.id,
        userId: (rep as any)?.userId,
        symbol: sym,
        side,
        lots: totalLots,
        investedAmount: round(totalInvested, 2),
        platform: (rep as any)?.platform,
        account: (rep as any)?.account,
        leverage: (rep as any)?.leverage,
        status: (rep as any)?.status,
        timestamp: (rep as any)?.timestamp,
        createdAt: (rep as any)?.createdAt,
        updatedAt: (rep as any)?.updatedAt,
        pnl: round(pnl, 2),
        currentPrice: typeof live === 'number' ? round(live, 2) : null,
        ids: arr.map((x: any) => x.id).filter(Boolean),
      });
    }

    return result;
  }

  // Consolidated handler for GET /positions with query params
  async findAllByQuery(
    userId: string,
    query: {
      status?: string;
      unique?: string;
      aggregated?: string;
      representative?: 'latest' | 'earliest';
      compact?: string;
      side?: 'buy' | 'sell';
      platform?: 'Delta Exchange' | 'Groww';
      account?: 'main' | 'longterm';
      timeframe?: '1D' | '7D' | '30D' | '90D' | 'all';
      symbol?: string;
    },
  ): Promise<any> {
    const wantUnique = String(query.unique).toLowerCase() === 'true';
    const wantAggregated = String(query.aggregated).toLowerCase() === 'true';
    const rep = query.representative === 'earliest' ? 'earliest' : 'latest';
    const wantCompact = String(query.compact).toLowerCase() === 'true';

    if (query.status === 'open') {
      if (wantAggregated) {
        const data = await this.getOpenPositionsAggregated(userId, rep);
        // Apply optional filters for aggregated response
        let filtered = data;
        if (query.side)
          filtered = filtered.filter((p) => p.side === query.side);
        if (query.platform)
          filtered = filtered.filter(
            (p: any) => (p.platform || '') === query.platform,
          );
        if (query.account)
          filtered = filtered.filter(
            (p: any) => (p.account || '') === query.account,
          );
        if (query.symbol)
          filtered = filtered.filter(
            (p: any) =>
              (p.symbol || '').toUpperCase() === query.symbol!.toUpperCase(),
          );
        const cutoff = this.getTimeframeCutoff(query.timeframe);
        if (cutoff) {
          filtered = filtered.filter((p: any) => {
            const t = p.timestamp ?? p.createdAt ?? p.updatedAt;
            const d = this.toDate(t);
            return !!(d && d >= cutoff);
          });
        }
        if (wantCompact) {
          return filtered.map(({ pnl, currentPrice, ids, ...rest }) => rest);
        }
        return filtered;
      }
      let list = await this.getOpenPositions(userId);
      if (query.side) list = list.filter((p) => p.side === query.side);
      if (query.platform)
        list = list.filter((p: any) => (p.platform || '') === query.platform);
      if (query.account)
        list = list.filter((p: any) => (p.account || '') === query.account);
      if (query.symbol)
        list = list.filter(
          (p: any) =>
            (p.symbol || '').toUpperCase() === query.symbol!.toUpperCase(),
        );
      {
        const cutoff = this.getTimeframeCutoff(query.timeframe);
        if (cutoff) {
          list = list.filter((p: any) => {
            const t = p.timestamp ?? p.createdAt ?? p.updatedAt;
            const d = this.toDate(t);
            return !!(d && d >= cutoff);
          });
        }
      }
      return wantUnique ? this.uniqueBySymbol(list) : list;
    } else if (query.status === 'closed') {
      let list = await this.getClosedPositions(userId);
      if (query.side) list = list.filter((p) => p.side === query.side);
      if (query.platform)
        list = list.filter((p: any) => (p.platform || '') === query.platform);
      if (query.account)
        list = list.filter((p: any) => (p.account || '') === query.account);
      if (query.symbol)
        list = list.filter(
          (p: any) =>
            (p.symbol || '').toUpperCase() === query.symbol!.toUpperCase(),
        );
      {
        const cutoff = this.getTimeframeCutoff(query.timeframe);
        if (cutoff) {
          list = list.filter((p: any) => {
            const t = p.timestamp ?? p.createdAt ?? p.updatedAt;
            const d = this.toDate(t);
            return !!(d && d >= cutoff);
          });
        }
      }
      return wantUnique ? this.uniqueBySymbol(list) : list;
    }

    let positions = wantUnique
      ? await this.findAllUnique(userId)
      : await this.findAll(userId);
    // Apply optional filters for generic case
    if (query.side)
      positions = positions.filter((p: any) => p.side === query.side);
    if (query.platform)
      positions = positions.filter(
        (p: any) => (p.platform || '') === query.platform,
      );
    if (query.account)
      positions = positions.filter(
        (p: any) => (p.account || '') === query.account,
      );
    if (query.symbol)
      positions = positions.filter(
        (p: any) =>
          (p.symbol || '').toUpperCase() === query.symbol!.toUpperCase(),
      );
    {
      const cutoff = this.getTimeframeCutoff(query.timeframe);
      if (cutoff) {
        positions = positions.filter((p: any) => {
          const t = p.timestamp ?? p.createdAt ?? p.updatedAt;
          const d = this.toDate(t);
          return !!(d && d >= cutoff);
        });
      }
    }
    return positions;
  }

  // Removed deprecated getAllPositionsWithPnl

  // Removed close-all service method
}
