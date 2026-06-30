// ==================== PROGRAMS MODULE ====================

// src/programs/programs.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';

@Module({
  imports: [DatabaseModule],
  providers: [ProgramsService],
  controllers: [ProgramsController],
  exports: [ProgramsService],
})
export class ProgramsModule {}

// src/programs/programs.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllPublicPrograms(skip = 0, take = 20) {
    const [programs, total] = await Promise.all([
      this.prisma.program.findMany({
        where: { isPublic: true },
        include: { creator: { select: { firstName: true, lastName: true } } },
        skip,
        take,
      }),
      this.prisma.program.count({ where: { isPublic: true } }),
    ]);

    return { programs, total, skip, take };
  }

  async getProgramById(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: { creator: { select: { firstName: true, lastName: true } } },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    return program;
  }

  async getUserPrograms(userId: string) {
    return this.prisma.program.findMany({
      where: { createdBy: userId },
    });
  }

  async createProgram(userId: string, programData: any) {
    const program = await this.prisma.program.create({
      data: {
        ...programData,
        createdBy: userId,
      },
    });

    this.logger.log(`Program created by user ${userId}: ${program.id}`);
    return program;
  }

  async updateProgram(id: string, userId: string, updateData: any) {
    const program = await this.getProgramById(id);

    if (program.createdBy !== userId) {
      throw new Error('Unauthorized');
    }

    return this.prisma.program.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteProgram(id: string, userId: string) {
    const program = await this.getProgramById(id);

    if (program.createdBy !== userId) {
      throw new Error('Unauthorized');
    }

    return this.prisma.program.delete({ where: { id } });
  }
}

// src/programs/programs.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProgramsService } from './programs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Programs')
@Controller('programs')
export class ProgramsController {
  private readonly logger = new Logger(ProgramsController.name);

  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all public programs' })
  async getAllPrograms(
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 20,
  ) {
    return this.programsService.getAllPublicPrograms(skip, take);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get program by ID' })
  async getProgram(@Param('id') id: string) {
    return this.programsService.getProgramById(id);
  }

  @Get('my/programs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user programs' })
  async getUserPrograms(@CurrentUser('userId') userId: string) {
    return this.programsService.getUserPrograms(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create program' })
  async createProgram(
    @CurrentUser('userId') userId: string,
    @Body() programData: any,
  ) {
    return this.programsService.createProgram(userId, programData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update program' })
  async updateProgram(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() updateData: any,
  ) {
    return this.programsService.updateProgram(id, userId, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete program' })
  async deleteProgram(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.programsService.deleteProgram(id, userId);
  }
}

// ==================== AI COACH MODULE ====================

// src/ai-coach/ai-coach.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { AiCoachService } from './ai-coach.service';
import { AiCoachController } from './ai-coach.controller';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [AiCoachService],
  controllers: [AiCoachController],
  exports: [AiCoachService],
})
export class AiCoachModule {}

// src/ai-coach/ai-coach.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Anthropic } from '@anthropic-ai/sdk';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AiCoachService {
  private readonly logger = new Logger(AiCoachService.name);
  private anthropic: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async sendMessage(userId: string, message: string, conversationId?: string) {
    // Get user context
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        metrics: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        workouts: {
          orderBy: { completedAt: 'desc' },
          take: 5,
          include: {
            exercises: {
              include: {
                exercise: true,
                sets: true,
              },
            },
          },
        },
      },
    });

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await this.prisma.aiConversation.findUnique({
        where: { id: conversationId },
        include: { messages: true },
      });
    } else {
      conversation = await this.prisma.aiConversation.create({
        data: {
          userId,
          title: message.substring(0, 50),
        },
        include: { messages: true },
      });
    }

    // Build context for Claude
    const context = this.buildContext(user, conversation);

    // Get Claude response
    const response = await this.anthropic.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 1024,
      system: context,
      messages: [
        ...conversation.messages.map((msg) => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: message },
      ],
    });

    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Save messages to conversation
    await this.prisma.aiMessage.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: 'USER',
          content: message,
        },
        {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: assistantMessage,
        },
      ],
    });

    return {
      conversationId: conversation.id,
      message: assistantMessage,
    };
  }

  private buildContext(user: any, conversation: any): string {
    const recentWorkouts = user.workouts
      .slice(0, 3)
      .map(
        (w: any) =>
          `${new Date(w.plannedDate).toLocaleDateString()}: ${w.name} - ${w.status}`,
      )
      .join('\n');

    return `You are KAVL, a knowledgeable and supportive fitness coach. You help users optimize their training, nutrition, and recovery.

User Profile:
- Level: ${user.level}
- Goals: ${user.goals.join(', ')}
- Injuries/Limitations: ${user.injuries.length > 0 ? user.injuries.join(', ') : 'None'}

Recent Activity:
${recentWorkouts}

Current Metrics:
${
  user.metrics[0]
    ? `- Weight: ${user.metrics[0].bodyweight}kg
- Sleep: ${user.metrics[0].sleepHours}h
- Fatigue: ${user.metrics[0].fatigue}/10`
    : 'No recent metrics'
}

Provide practical, personalized advice based on their fitness level and goals. Be encouraging and supportive.`;
  }

  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.prisma.aiConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new Error('Conversation not found');
    }

    return conversation;
  }

  async getConversations(userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { userId },
      include: { messages: { take: 1, orderBy: { createdAt: 'desc' } } },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

// src/ai-coach/ai-coach.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Query,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiCoachService } from './ai-coach.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('AI Coach')
@Controller('ai-coach')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiCoachController {
  private readonly logger = new Logger(AiCoachController.name);

  constructor(private readonly aiCoachService: AiCoachService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send message to AI coach' })
  async sendMessage(
    @CurrentUser('userId') userId: string,
    @Body('message') message: string,
    @Body('conversationId') conversationId?: string,
  ) {
    return this.aiCoachService.sendMessage(userId, message, conversationId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations' })
  async getConversations(@CurrentUser('userId') userId: string) {
    return this.aiCoachService.getConversations(userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  async getConversation(
    @CurrentUser('userId') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.aiCoachService.getConversation(conversationId, userId);
  }
}

// ==================== STATS MODULE ====================

// src/stats/stats.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';

@Module({
  imports: [DatabaseModule],
  providers: [StatsService],
  controllers: [StatsController],
})
export class StatsModule {}

// src/stats/stats.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPRs(userId: string) {
    const sets = await this.prisma.set.findMany({
      where: {
        workoutExercise: {
          workout: { userId },
        },
      },
      include: {
        workoutExercise: {
          include: {
            exercise: true,
          },
        },
      },
      orderBy: [{ weight: 'desc' }, { createdAt: 'desc' }],
    });

    const prs = new Map();
    sets.forEach((set) => {
      const exerciseName = set.workoutExercise.exercise.name;
      if (!prs.has(exerciseName)) {
        prs.set(exerciseName, {
          exercise: set.workoutExercise.exercise,
          weight: set.weight,
          reps: set.actualReps,
          date: set.createdAt,
        });
      }
    });

    return Array.from(prs.values());
  }

  async getVolume(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const workouts = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        completedAt: { gte: startDate },
      },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    });

    let totalVolume = 0;
    const volumeByDay = new Map();

    workouts.forEach((workout) => {
      let dayVolume = 0;
      workout.exercises.forEach((exercise) => {
        exercise.sets.forEach((set) => {
          if (set.weight && set.actualReps) {
            const volume = set.weight * set.actualReps;
            dayVolume += volume;
            totalVolume += volume;
          }
        });
      });

      const date = new Date(workout.completedAt || workout.plannedDate)
        .toISOString()
        .split('T')[0];
      volumeByDay.set(date, (volumeByDay.get(date) || 0) + dayVolume);
    });

    return {
      totalVolume,
      volumeByDay: Object.fromEntries(volumeByDay),
    };
  }

  async getProgress(userId: string, exerciseId: string) {
    const sets = await this.prisma.set.findMany({
      where: {
        workoutExercise: {
          exerciseId,
          workout: { userId },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return sets.map((set) => ({
      date: set.createdAt,
      weight: set.weight,
      reps: set.actualReps,
      rpe: set.rpe,
    }));
  }

  async getStreaks(userId: string) {
    const workouts = await this.prisma.workoutSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    });

    let currentStreak = 0;
    let maxStreak = 0;
    let lastDate: Date | null = null;

    workouts.forEach((workout) => {
      if (!workout.completedAt) return;

      const workoutDate = new Date(workout.completedAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!lastDate) {
        currentStreak = 1;
      } else {
        const daysBetween = Math.floor(
          (lastDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysBetween === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }

      maxStreak = Math.max(maxStreak, currentStreak);
      lastDate = workoutDate;
    });

    return {
      currentStreak,
      maxStreak,
      totalWorkouts: workouts.length,
    };
  }
}

// src/stats/stats.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Statistics')
@Controller('stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatsController {
  private readonly logger = new Logger(StatsController.name);

  constructor(private readonly statsService: StatsService) {}

  @Get('pr')
  @ApiOperation({ summary: 'Get personal records' })
  async getPRs(@CurrentUser('userId') userId: string) {
    return this.statsService.getPRs(userId);
  }

  @Get('volume')
  @ApiOperation({ summary: 'Get total volume' })
  async getVolume(
    @CurrentUser('userId') userId: string,
    @Query('days') days: number = 30,
  ) {
    return this.statsService.getVolume(userId, days);
  }

  @Get('progress/:exerciseId')
  @ApiOperation({ summary: 'Get exercise progress' })
  async getProgress(
    @CurrentUser('userId') userId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.statsService.getProgress(userId, exerciseId);
  }

  @Get('streaks')
  @ApiOperation({ summary: 'Get workout streaks' })
  async getStreaks(@CurrentUser('userId') userId: string) {
    return this.statsService.getStreaks(userId);
  }
}

// ==================== ACHIEVEMENTS MODULE ====================

// src/achievements/achievements.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AchievementsService } from './achievements.service';

@Module({
  imports: [DatabaseModule],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}

// src/achievements/achievements.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async unlockAchievement(
    userId: string,
    type: string,
    name: string,
    description?: string,
  ) {
    const achievement = await this.prisma.achievement.create({
      data: {
        userId,
        type,
        name,
        description,
      },
    });

    this.logger.log(`Achievement unlocked for ${userId}: ${name}`);
    return achievement;
  }

  async getAchievements(userId: string) {
    return this.prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  async checkAndUnlockAchievements(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workouts: { where: { status: 'COMPLETED' } },
        achievements: true,
      },
    });

    if (!user) return;

    const achievements = [];

    // First workout
    if (user.workouts.length === 1) {
      achievements.push({
        type: 'FIRST_WORKOUT',
        name: 'First Step',
        description: 'Complete your first workout',
      });
    }

    // 100 workouts
    if (user.workouts.length === 100) {
      achievements.push({
        type: 'HUNDRED_WORKOUTS',
        name: 'Centurion',
        description: 'Complete 100 workouts',
      });
    }

    // Create achievements that haven't been unlocked yet
    for (const achievement of achievements) {
      const exists = user.achievements.find((a) => a.type === achievement.type);
      if (!exists) {
        await this.unlockAchievement(
          userId,
          achievement.type,
          achievement.name,
          achievement.description,
        );
      }
    }
  }
}

// src/metrics/metrics.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
})
export class MetricsModule {}

// src/planner/planner.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
})
export class PlannerModule {}
