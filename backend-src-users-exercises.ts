// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [DatabaseModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}

// src/users/users.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserMetricsDto } from './dtos/user-metrics.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        height: true,
        weight: true,
        level: true,
        goals: true,
        injuries: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateProfileDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        age: true,
        height: true,
        weight: true,
        level: true,
        goals: true,
        injuries: true,
      },
    });

    this.logger.log(`Profile updated for user: ${userId}`);
    return user;
  }

  async addMetrics(userId: string, metricsDto: UserMetricsDto) {
    const metrics = await this.prisma.userMetrics.create({
      data: {
        userId,
        ...metricsDto,
      },
    });

    return metrics;
  }

  async getMetrics(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await this.prisma.userMetrics.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: 'asc' },
    });

    return metrics;
  }

  async getLatestMetrics(userId: string) {
    return this.prisma.userMetrics.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }
}

// src/users/users.controller.ts
import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Query,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { UserMetricsDto } from './dtos/user-metrics.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUser(@CurrentUser('userId') userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Post('me/metrics')
  @ApiOperation({ summary: 'Add user metrics (weight, sleep, etc.)' })
  async addMetrics(
    @CurrentUser('userId') userId: string,
    @Body() metricsDto: UserMetricsDto,
  ) {
    return this.usersService.addMetrics(userId, metricsDto);
  }

  @Get('me/metrics')
  @ApiOperation({ summary: 'Get user metrics history' })
  async getMetrics(
    @CurrentUser('userId') userId: string,
    @Query('days') days: number = 30,
  ) {
    return this.usersService.getMetrics(userId, days);
  }

  @Get('me/metrics/latest')
  @ApiOperation({ summary: 'Get latest user metrics' })
  async getLatestMetrics(@CurrentUser('userId') userId: string) {
    return this.usersService.getLatestMetrics(userId);
  }
}

// src/users/dtos/update-profile.dto.ts
import { IsOptional, IsString, IsInt, IsArray, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(150)
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(250)
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  goals?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  injuries?: string[];
}

// src/users/dtos/user-metrics.dto.ts
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserMetricsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bodyweight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60)
  bodyFat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sleepHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  fatigue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  mood?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ==================== EXERCISES MODULE ====================

// src/exercises/exercises.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ExercisesService } from './exercises.service';
import { ExercisesController } from './exercises.controller';

@Module({
  imports: [DatabaseModule],
  providers: [ExercisesService],
  controllers: [ExercisesController],
  exports: [ExercisesService],
})
export class ExercisesModule {}

// src/exercises/exercises.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateExerciseDto } from './dtos/create-exercise.dto';

@Injectable()
export class ExercisesService {
  private readonly logger = new Logger(ExercisesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createExerciseDto: CreateExerciseDto) {
    const exercise = await this.prisma.exercise.create({
      data: createExerciseDto,
    });

    this.logger.log(`Exercise created: ${exercise.name}`);
    return exercise;
  }

  async findAll(
    muscleGroup?: string,
    category?: string,
    equipment?: string,
    skip: number = 0,
    take: number = 20,
  ) {
    const where: any = {};

    if (muscleGroup) {
      where.muscleGroups = {
        hasSome: [muscleGroup],
      };
    }

    if (category) {
      where.category = category;
    }

    if (equipment) {
      where.equipment = {
        hasSome: [equipment],
      };
    }

    const [exercises, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        skip,
        take,
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return {
      exercises,
      total,
      skip,
      take,
    };
  }

  async findById(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    return exercise;
  }

  async search(query: string, take: number = 10) {
    return this.prisma.exercise.findMany({
      where: {
        name: {
          search: query,
          mode: 'insensitive',
        },
      },
      take,
    });
  }

  async addFavorite(userId: string, exerciseId: string) {
    return this.prisma.favoriteExercise.create({
      data: {
        userId,
        exerciseId,
      },
    });
  }

  async removeFavorite(userId: string, exerciseId: string) {
    return this.prisma.favoriteExercise.delete({
      where: {
        userId_exerciseId: {
          userId,
          exerciseId,
        },
      },
    });
  }

  async getFavorites(userId: string) {
    return this.prisma.favoriteExercise.findMany({
      where: { userId },
      include: { exercise: true },
    });
  }
}

// src/exercises/exercises.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExercisesService } from './exercises.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Exercises')
@Controller('exercises')
export class ExercisesController {
  private readonly logger = new Logger(ExercisesController.name);

  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all exercises with filters' })
  async findAll(
    @Query('muscleGroup') muscleGroup?: string,
    @Query('category') category?: string,
    @Query('equipment') equipment?: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 20,
  ) {
    return this.exercisesService.findAll(
      muscleGroup,
      category,
      equipment,
      skip,
      take,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search exercises by name' })
  async search(@Query('q') query: string, @Query('take') take: number = 10) {
    return this.exercisesService.search(query, take);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exercise by ID' })
  async findById(@Param('id') id: string) {
    return this.exercisesService.findById(id);
  }

  @Post('favorites/:exerciseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add exercise to favorites' })
  async addFavorite(
    @CurrentUser('userId') userId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.exercisesService.addFavorite(userId, exerciseId);
  }

  @Delete('favorites/:exerciseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove exercise from favorites' })
  async removeFavorite(
    @CurrentUser('userId') userId: string,
    @Param('exerciseId') exerciseId: string,
  ) {
    return this.exercisesService.removeFavorite(userId, exerciseId);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user favorite exercises' })
  async getFavorites(@CurrentUser('userId') userId: string) {
    return this.exercisesService.getFavorites(userId);
  }
}

// src/exercises/dtos/create-exercise.dto.ts
import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExerciseCategoryEnum {
  STRENGTH = 'STRENGTH',
  CARDIO = 'CARDIO',
  MOBILITY = 'MOBILITY',
  POWERLIFTING = 'POWERLIFTING',
  BODYBUILDING = 'BODYBUILDING',
}

export class CreateExerciseDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsArray()
  muscleGroups: string[];

  @ApiProperty({ enum: ExerciseCategoryEnum })
  @IsEnum(ExerciseCategoryEnum)
  category: string;

  @ApiProperty()
  @IsArray()
  equipment: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gifUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;
}
