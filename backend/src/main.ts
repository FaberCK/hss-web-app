import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TenantContextInterceptor } from './shared/interceptors/tenant-context.interceptor';
import { PrismaService } from './shared/prisma/prisma.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Resolve PrismaService from the application container to pass into the global interceptor
  const prismaService = app.get(PrismaService);
  app.useGlobalInterceptors(new TenantContextInterceptor(prismaService));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();