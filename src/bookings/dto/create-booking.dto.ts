import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { IsNotPastDate } from '../validators/is-not-past-date.validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  customerName!: string;

  @IsEmail({}, { message: 'Please provide a valid customer email' })
  customerEmail!: string;

  @IsString()
  @IsNotEmpty({ message: 'Customer phone is required' })
  customerPhone!: string;

  @IsUUID('4', { message: 'serviceId must be a valid UUID' })
  serviceId!: string;

  // Expecting ISO date format: "2026-08-15"
  @IsNotPastDate()
  bookingDate!: string;

  // Expecting 24-hour time format: "14:30" or "14:30:00"
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/, {
    message: 'bookingTime must be in HH:MM or HH:MM:SS format',
  })
  bookingTime!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}