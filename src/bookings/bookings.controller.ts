import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { BookingQueryDto } from './dto/booking-query.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { ApiQuery } from '@nestjs/swagger';
import { BookingStatusDto } from './dto/update-booking-status.dto.js';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  // Public — "Customers can create bookings without authentication"
  // Stricter limit than the global default (10/min) since this endpoint is public and unauthenticated
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new booking (public, no auth required)' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed (e.g. past date)' })
  @ApiResponse({ status: 404, description: 'Referenced service does not exist' })
  @ApiResponse({ status: 409, description: 'Duplicate booking for this service/date/time' })
  @ApiResponse({ status: 429, description: 'Too many booking attempts, try again later' })
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  // Protected — assumption: viewing ALL bookings is a staff/admin action
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Get all bookings (requires authentication). Supports pagination, status filter, and search.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatusDto })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'jane' })
  @ApiResponse({ status: 200, description: 'Returns a paginated list of bookings' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  findAll(@Query() query: BookingQueryDto) {
    return this.bookingsService.findAll(query);
  }

  // Public — assumption: a customer should be able to look up their own
  @Get(':id')
  @ApiOperation({ summary: 'Get a single booking by ID (public)' })
  @ApiResponse({ status: 200, description: 'Returns the requested booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  // Protected — status changes (confirming, completing) are staff actions
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update a booking status (requires authentication)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, dto);
  }

  // Protected — same reasoning as status updates
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking (requires authentication)' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Booking cannot be cancelled from its current status' })
  @ApiResponse({ status: 401, description: 'Missing or invalid access token' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }
}