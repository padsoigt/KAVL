// src/workouts/workouts.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { WorkoutsService } from './workouts.service';
import { WorkoutsController } from './workouts.controller';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [DatabaseModule, AchievementsModule],
  providers: [WorkoutsService],
  controllers: [WorkoutsController],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}

// src/workouts/workouts.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateWorkoutDto } from './dtos/create-workout.dto';
import { AddSetDto } from './dtos/add-set.dto';
import { UpdateSetDto } from './dtos/update-set.dto';

@Injectable()
export class WorkoutsService {
  private readonly logger = new Logger(WorkoutsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createWorkout(userId: string, createWorkoutDto: CreateWorkoutDto) {
    const workout = await this.prisma.workoutSession.create({
      data: {
        userId,
        ...createWorkoutDto,
        status: 'IN_PROGRESS',
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true,
          },
        },
      },
    });

    this.logger.log(`Workout created for user ${userId}: ${workout.id}`);
    return workout;
  }

  async getWorkouts(
    userId: string,
    skip: number = 0,
    take: number = 20,
    status?: string,
  ) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [workouts, total] = await Promise.all([
      this.prisma.workoutSession.findMany({
        where,
        include: {
          exercises: {
            include: {
              exercise: true,
              sets: true,
            },
          },
        },
        orderBy: { plannedDate: 'desc' },
        skip,
        take,
      }),
      this.prisma.workoutSession.count({ where }),
    ]);

    return {
      workouts,
      total,
      skip,
      take,
    };
  }

  async getWorkoutById(workoutId: string, userId: string) {
    const workout = await this.prisma.workoutSession.findUnique({
      where: { id: workoutId },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { exerciseOrder: 'asc' },
        },
      },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    if (workout.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return workout;
  }

  async updateWorkout(
    workoutId: string,
    userId: string,
    updateData: Partial<CreateWorkoutDto>,
  ) {
    const workout = await this.prisma.workoutSession.findUnique({
      where: { id: workoutId },
    });

    if (!workout || workout.userId !== userId) {
      throw new NotFoundException('Workout not found');
    }

    return this.prisma.workoutSession.update({
      where: { id: workoutId },
      data: updateData,
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true,
          },
        },
      },
    });
  }

  async completeWorkout(workoutId: string, userId: string) {
    const workout = await this.getWorkoutById(workoutId, userId);

    const completed = await this.prisma.workoutSession.update({
      where: { id: workoutId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true,
          },
        },
      },
    });

    this.logger.log(`Workout completed: ${workoutId}`);

    // Calculate stats and trigger achievements
    const sets = completed.exercises.flatMap((ex) => ex.sets);
    const totalVolume = sets.reduce((acc, set) => {
      if (set.weight && set.actualReps) {
        return acc + set.weight * set.actualReps;
      }
      return acc;
    }, 0);

    return {
      ...completed,
      stats: {
        totalVolume,
        setsCompleted: sets.filter((s) => s.completed).length,
        totalSets: sets.length,
      },
    };
  }

  async addExerciseToWorkout(
    workoutId: string,
    userId: string,
    exerciseId: string,
    order: number,
  ) {
    const workout = await this.getWorkoutById(workoutId, userId);

    const workoutExercise = await this.prisma.workoutExercise.create({
      data: {
        workoutSessionId: workoutId,
        exerciseId,
        exerciseOrder: order,
      },
      include: {
        exercise: true,
        sets: true,
      },
    });

    this.logger.log(`Exercise added to workout: ${workoutId}`);
    return workoutExercise;
  }

  async addSet(
    workoutId: string,
    exerciseId: string,
    userId: string,
    addSetDto: AddSetDto,
  ) {
    // Verify workout belongs to user
    const workout = await this.getWorkoutById(workoutId, userId);

    // Get or create WorkoutExercise
    let workoutExercise = await this.prisma.workoutExercise.findFirst({
      where: {
        workoutSessionId: workoutId,
        exerciseId,
      },
    });

    if (!workoutExercise) {
      const maxOrder =
        (await this.prisma.workoutExercise.findFirst({
          where: { workoutSessionId: workoutId },
          orderBy: { exerciseOrder: 'desc' },
          select: { exerciseOrder: true },
        })) || { exerciseOrder: 0 };

      workoutExercise = await this.prisma.workoutExercise.create({
        data: {
          workoutSessionId: workoutId,
          exerciseId,
          exerciseOrder: maxOrder.exerciseOrder + 1,
        },
      });
    }

    // Calculate set number
    const setCount = await this.prisma.set.count({
      where: { workoutExerciseId: workoutExercise.id },
    });

    const set = await this.prisma.set.create({
      data: {
        workoutExerciseId: workoutExercise.id,
        setNumber: setCount + 1,
        ...addSetDto,
        completed: true,
      },
    });

    this.logger.log(`Set added to workout exercise: ${workoutExercise.id}`);
    return set;
  }

  async updateSet(setId: string, userId: string, updateSetDto: UpdateSetDto) {
    // Verify set belongs to user's workout
    const set = await this.prisma.set.findUnique({
      where: { id: setId },
      include: {
        workoutExercise: {
          include: {
            workout: true,
          },
        },
      },
    });

    if (!set) {
      throw new NotFoundException('Set not found');
    }

    if (set.workoutExercise.workout.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return this.prisma.set.update({
      where: { id: setId },
      data: updateSetDto,
    });
  }

  async deleteSet(setId: string, userId: string) {
    const set = await this.prisma.set.findUnique({
      where: { id: setId },
      include: {
        workoutExercise: {
          include: {
            workout: true,
          },
        },
      },
    });

    if (!set) {
      throw new NotFoundException('Set not found');
    }

    if (set.workoutExercise.workout.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }

    return this.prisma.set.delete({
      where: { id: setId },
    });
  }

  async getLastSets(userId: string, exerciseId: string, limit: number = 5) {
    return this.prisma.set.findMany({
      where: {
        workoutExercise: {
          exercise: { id: exerciseId },
          workout: { userId },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

// src/workouts/workouts.controller.ts
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
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WorkoutsService } from './workouts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateWorkoutDto } from './dtos/create-workout.dto';
import { AddSetDto } from './dtos/add-set.dto';
import { UpdateSetDto } from './dtos/update-set.dto';

@ApiTags('Workouts')
@Controller('workouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkoutsController {
  private readonly logger = new Logger(WorkoutsController.name);

  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post()
  @ApiOperation({ summary: 'Start a new workout' })
  async createWorkout(
    @CurrentUser('userId') userId: string,
    @Body() createWorkoutDto: CreateWorkoutDto,
  ) {
    return this.workoutsService.createWorkout(userId, createWorkoutDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workouts' })
  async getWorkouts(
    @CurrentUser('userId') userId: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 20,
    @Query('status') status?: string,
  ) {
    return this.workoutsService.getWorkouts(userId, skip, take, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workout by ID' })
  async getWorkout(
    @CurrentUser('userId') userId: string,
    @Param('id') workoutId: string,
  ) {
    return this.workoutsService.getWorkoutById(workoutId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update workout' })
  async updateWorkout(
    @CurrentUser('userId') userId: string,
    @Param('id') workoutId: string,
    @Body() updateData: Partial<CreateWorkoutDto>,
  ) {
    return this.workoutsService.updateWorkout(workoutId, userId, updateData);
  }

  @Post(':id/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Complete workout' })
  async completeWorkout(
    @CurrentUser('userId') userId: string,
    @Param('id') workoutId: string,
  ) {
    return this.workoutsService.completeWorkout(workoutId, userId);
  }

  @Post(':workoutId/exercises/:exerciseId')
  @ApiOperation({ summary: 'Add exercise to workout' })
  async addExercise(
    @CurrentUser('userId') userId: string,
    @Param('workoutId') workoutId: string,
    @Param('exerciseId') exerciseId: string,
    @Query('order') order: number = 1,
  ) {
    return this.workoutsService.addExerciseToWorkout(
      workoutId,
      userId,
      exerciseId,
      order,
    );
  }

  @Post(':workoutId/sets')
  @ApiOperation({ summary: 'Add set to exercise' })
  async addSet(
    @CurrentUser('userId') userId: string,
    @Param('workoutId') workoutId: string,
    @Query('exerciseId') exerciseId: string,
    @Body() addSetDto: AddSetDto,
  ) {
    return this.workoutsService.addSet(workoutId, exerciseId, userId, addSetDto);
  }

  @Put('sets/:setId')
  @ApiOperation({ summary: 'Update set' })
  async updateSet(
    @CurrentUser('userId') userId: string,
    @Param('setId') setId: string,
    @Body() updateSetDto: UpdateSetDto,
  ) {
    return this.workoutsService.updateSet(setId, userId, updateSetDto);
  }

  @Delete('sets/:setId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete set' })
  async deleteSet(
    @CurrentUser('userId') userId: string,
    @Param('setId') setId: string,
  ) {
    return this.workoutsService.deleteSet(setId, userId);
  }

  @Get('exercises/:exerciseId/last-sets')
  @ApiOperation({ summary: 'Get last sets for an exercise' })
  async getLastSets(
    @CurrentUser('userId') userId: string,
    @Param('exerciseId') exerciseId: string,
    @Query('limit') limit: number = 5,
  ) {
    return this.workoutsService.getLastSets(userId, exerciseId, limit);
  }
}

// src/workouts/dtos/create-workout.dto.ts
import { IsString, IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkoutDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsDateString()
  plannedDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// src/workouts/dtos/add-set.dto.ts
import { IsOptional, IsNumber, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AddSetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  targetReps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  actualReps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rpe?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// src/workouts/dtos/update-set.dto.ts
import { IsOptional, IsNumber, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  actualReps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rpe?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
