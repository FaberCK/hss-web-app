import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Global interceptor that handles the PostgreSQL SET LOCAL app.current_organization_id logic.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // The Auth & Context middleware (Step 1.3) will eventually attach the user and scope to the request
    const organizationId = request.user?.organizationId;

    if (organizationId) {
      // Executes setting the session variable for RLS
      // Note: In production with connection pooling, this is best handled via Prisma interactive transactions or Client Extensions
      await this.prisma.$executeRawUnsafe(
        `SET LOCAL app.current_organization_id = '${organizationId}';`
      );
    }

    return next.handle();
  }
}