import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UserContext } from '../interfaces/user-context.interface';

/**
 * Middleware that validates JWT bearer tokens, parses the x-hss-scope-id header,
 * and attaches the structured user context to the request object.
 */
@Injectable()
export class AuthContextMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed authorization token');
    }

    const token = authHeader.split(' ')[1];
    let payload: { sub: string; email: string; organizationId: string };

    try {
      payload = this.jwtService.verify(token);
    } catch (err: unknown) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    const activeScopeId = req.headers['x-hss-scope-id'] as string;

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        scopes: {
          include: {
            departments: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    let relevantScopes = user.scopes;
    if (activeScopeId) {
      const scopedMatch = user.scopes.filter((scope) => scope.entityId === activeScopeId);
      if (scopedMatch.length > 0) {
        relevantScopes = scopedMatch;
      }
    }

    const roles = relevantScopes.map((scope) => scope.role);
    const departmentIdSet = new Set<string>();
    relevantScopes.forEach((scope) => {
      scope.departments.forEach((dept) => {
        departmentIdSet.add(dept.departmentId);
      });
    });

    const userContext: UserContext = {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      activeScopeId,
      roles,
      allowedDepartments: Array.from(departmentIdSet),
      scopeLevel: relevantScopes[0]?.scopeLevel,
    };

    req.user = userContext;
    next();
  }
}