// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { AuthModule } from './auth/auth.module';
// import { OrganizationsModule } from './organizations/organizations.module';
// import { PropertiesModule } from './properties/properties.module';
// import { UsersModule } from './users/users.module';
// import { SharedModule } from './shared/shared.module';

// @Module({
//   imports: [AuthModule, OrganizationsModule, PropertiesModule, UsersModule, SharedModule],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}

import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { UsersModule } from './users/users.module';
import { HubsModule } from './hubs/hubs.module';
import { DepartmentsModule } from './departments/departments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DivisionsModule } from './divisions/divisions.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuthContextMiddleware } from './auth/middlewares/auth-context.middleware';

@Module({
  imports: [
    SharedModule, 
    AuthModule,
    PropertiesModule, 
    UsersModule, 
    HubsModule, 
    DepartmentsModule, 
    DashboardModule,
    DivisionsModule,
    OrganizationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthContextMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST }, // Skip for login route once created
        { path: '', method: RequestMethod.GET },          // Public health checks if any
      )
      .forRoutes('*'); // Apply globally across all other endpoints
  }
}