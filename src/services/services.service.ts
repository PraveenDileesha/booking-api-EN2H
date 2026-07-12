import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../database/schema';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  async create(dto: CreateServiceDto, userId: string) {
    const [newService] = await this.db
      .insert(schema.services)
      .values({
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        price: dto.price.toString(),
        isActive: dto.isActive ?? true,
        createdById: userId,
      })
      .returning();

    return newService;
  }

  async findAll(pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const offset = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.db.query.services.findMany({
        limit,
        offset,
      }),
      this.db.$count(schema.services),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const service = await this.db.query.services.findFirst({
      where: eq(schema.services.id, id),
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.price !== undefined) {
      updateData.price = dto.price.toString();
    }
    updateData.updatedAt = new Date();

    const [updatedService] = await this.db
      .update(schema.services)
      .set(updateData)
      .where(eq(schema.services.id, id))
      .returning();

    return updatedService;
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      await this.db.delete(schema.services).where(eq(schema.services.id, id));
      return { message: 'Service deleted successfully' };
    } catch (error: any) {
      if (error?.cause?.code === '23503') {
        throw new ConflictException(
          'Cannot delete this service because it has existing bookings. ' +
            'Services with booking history cannot be removed to preserve records.',
        );
      }
      throw error;
    }
  }
}