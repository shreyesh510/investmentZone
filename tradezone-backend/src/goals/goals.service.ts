import { Injectable } from '@nestjs/common';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Goal } from './entities/goal.entity';

@Injectable()
export class GoalsService {
  constructor(
    private readonly firebaseDatabaseService: FirebaseDatabaseService,
  ) {}

  async create(userId: string, createGoalDto: CreateGoalDto): Promise<Goal> {
    const now = new Date().toISOString();
    const goalData: Omit<Goal, 'id'> = {
      userId,
      name: createGoalDto.name,
      type: createGoalDto.type,
      status: createGoalDto.status || 'active',
      targetAmount: createGoalDto.targetAmount,
      currentAmount: createGoalDto.currentAmount || 0,
      currency: createGoalDto.currency || 'INR',
      totalDays: createGoalDto.totalDays,
      completedDays: createGoalDto.completedDays || 0,
      completedDates: createGoalDto.completedDates || [],
      description: createGoalDto.description,
      startDate: createGoalDto.startDate || now,
      endDate: createGoalDto.endDate,
      createdAt: now,
      updatedAt: now,
    };

    return this.firebaseDatabaseService.createGoal(goalData);
  }

  async findAll(userId: string): Promise<Goal[]> {
    return this.firebaseDatabaseService.getGoals(userId);
  }

  async findOne(userId: string, id: string): Promise<Goal | null> {
    return this.firebaseDatabaseService.getGoalById(userId, id);
  }

  async update(
    userId: string,
    id: string,
    updateGoalDto: UpdateGoalDto,
  ): Promise<boolean> {
    const updateData: Partial<Goal> = {
      ...updateGoalDto,
      updatedAt: new Date().toISOString(),
    };

    return this.firebaseDatabaseService.updateGoal(userId, id, updateData);
  }

  async markDayComplete(userId: string, id: string): Promise<boolean> {
    const goal = await this.findOne(userId, id);
    if (!goal || goal.type !== 'challenge') {
      return false;
    }

    const today = new Date().toISOString().split('T')[0];
    const completedDates = goal.completedDates || [];

    // Check if already completed today
    if (completedDates.includes(today)) {
      return true;
    }

    const newCompletedDates = [...completedDates, today];
    const completedDays = newCompletedDates.length;

    // Check if goal is completed
    const status = completedDays >= (goal.totalDays || 0) ? 'completed' : 'active';

    return this.firebaseDatabaseService.updateGoal(userId, id, {
      completedDays,
      completedDates: newCompletedDates,
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  async remove(userId: string, id: string): Promise<boolean> {
    return this.firebaseDatabaseService.deleteGoal(userId, id);
  }
}
