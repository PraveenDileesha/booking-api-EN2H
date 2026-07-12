import { IsEnum } from 'class-validator';

export enum BookingStatusDto {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatusDto, {
    message: 'status must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED',
  })
  status!: BookingStatusDto;
}