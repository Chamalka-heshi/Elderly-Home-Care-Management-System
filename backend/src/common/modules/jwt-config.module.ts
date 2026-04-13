import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../../modules/users/users.module';

/**
 * @Global — imported once in AppModule.
 * JwtModule is available everywhere without re-importing.
 * JwtAuthGuard and RolesGuard are registered as APP_GUARD in AppModule
 * so they run globally with correct DI resolution.
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => {
        const secret = cs.get<string>('app.jwt.secret');
        const expiresIn = cs.get<string>('app.jwt.expiresIn');

        if (!secret) throw new Error('JWT_SECRET is not defined');
        if (!expiresIn) throw new Error('JWT_EXPIRATION is not defined');

        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
    UsersModule,
  ],
  exports: [JwtModule, UsersModule],
})
export class JwtConfigModule {}
