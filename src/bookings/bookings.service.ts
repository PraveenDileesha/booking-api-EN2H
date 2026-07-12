import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, SQL, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module.js';
import * as schema from '../database/schema.js';
import { ServicesService } from '../services/services.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { BookingQueryDto } from './dto/booking-query.dto.js';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';


const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  CANCELLED: [], // terminal state — cannot transition to anything else
  COMPLETED: [], // terminal state — cannot transition to anything else
};

@Injectable()
export class BookingsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase<typeof schema>,
    private readonly servicesService: ServicesService,
  ) {}

  async create(dto: CreateBookingDto) {
    await this.servicesService.findOne(dto.serviceId);

    try {
      const [newBooking] = await this.db
        .insert(schema.bookings)
        .values({
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          serviceId: dto.serviceId,
          bookingDate: dto.bookingDate,
          bookingTime: dto.bookingTime,
          notes: dto.notes,
        })
        .returning();

      return newBooking;
    } catch (error: any) {
      if (error?.cause?.code === '23505') {
        throw new ConflictException(
          'A booking already exists for this service at the selected date and time',
        );
      }
      throw error; 
    }
  }

  async findAll(query: BookingQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;
    const conditions: SQL<boolean>[] = [];

    if (query.status) {
      conditions.push(eq(schema.bookings.status, query.status) as SQL<boolean>);
    }

    if (query.search) {
      conditions.push(
        sql<boolean>`"bookings"."search_vector" @@ plainto_tsquery('english', ${query.search})`,
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const [data, total] = await Promise.all([
      this.db.query.bookings.findMany({
        where: whereClause,
        limit,
        offset,
      }),
      whereClause
        ? this.db.$count(schema.bookings, whereClause)
        : this.db.$count(schema.bookings),
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
    const booking = await this.db.query.bookings.findFirst({
      where: eq(schema.bookings.id, id),
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = await this.findOne(id);
    
    const allowedNextStatuses = ALLOWED_TRANSITIONS[booking.status] ?? [];
    if (!allowedNextStatuses.includes(dto.status)) {
        throw new BadRequestException(
            `Cannot change booking status from ${booking.status} to ${dto.status}`,
        );
    }
    
    const [updatedBooking] = await this.db
        .update(schema.bookings)
        .set({ status: dto.status, updatedAt: new Date() })
        .where(
            and(
                eq(schema.bookings.id, id),
                eq(schema.bookings.status, booking.status),
            ),
        )
        .returning();
        
    if (!updatedBooking) {
        throw new ConflictException(
            'Booking status was changed by another request; please retry',
        );
    }
    
    return updatedBooking;
  }

  async cancel(id: string) {
    const booking = await this.findOne(id);
    try {
        return await this.updateStatus(id, { status: 'CANCELLED' } as UpdateBookingStatusDto);
    } catch (err) {
        if (err instanceof BadRequestException) {
            throw new BadRequestException(
                `Cannot cancel a booking that is already ${booking.status}`,
            );
        }
        throw err;
    }
  }
}