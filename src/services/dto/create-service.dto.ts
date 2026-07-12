import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title!: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsInt({ message: 'Duration must be a whole number of minutes' })
  @Min(1, { message: 'Duration must be at least 1 minute' })
  duration!: number;
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must be a valid amount with up to 2 decimal places' },
  )
  @Min(0, { message: 'Price cannot be negative' })
  price!: number;
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}