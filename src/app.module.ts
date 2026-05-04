import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PropertyModule } from './property/property.module';
import { BookingModule } from './booking/booking.module';
import { ReviewModule } from './review/review.module';
import { NotificationModule } from './notification/notification.module';
import { LeaseModule } from './lease/lease.module';
import { ContractModule } from './contract/contract.module';
import { AdminActionLogModule } from './admin-action-log/admin-action-log.module';
import { TemporaryBlockModule } from './temporary-block/temporary-block.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    UserModule,
    AuthModule,
    PropertyModule,
    BookingModule,
    ReviewModule,
    NotificationModule,
    LeaseModule,
    ContractModule,
    AdminActionLogModule,
    TemporaryBlockModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
