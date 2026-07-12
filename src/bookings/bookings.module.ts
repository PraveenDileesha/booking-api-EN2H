import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { ServicesModule } from '../services/services.module.js';

@Module({
  imports: [
    AuthModule, 
    ServicesModule, 
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}