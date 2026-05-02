import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InstallersModule } from './installers/installers.module';
import { RequestsModule } from './requests/requests.module';
import { MatchingModule } from './matching/matching.module';
import { QuotesModule } from './quotes/quotes.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({ isGlobal: true, ttl: 60 * 5 }),
    PrismaModule,
    AuthModule,
    UsersModule,
    InstallersModule,
    RequestsModule,
    MatchingModule,
    QuotesModule,
    AdminModule,
  ],
})
export class AppModule {}
