import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BookingStatusDto } from './update-booking-status.dto';

export class BookingQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(BookingStatusDto, {
    message: 'status must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED',
  })
  status?: BookingStatusDto;

  @IsOptional()
  @IsString()
  search?: string;
}