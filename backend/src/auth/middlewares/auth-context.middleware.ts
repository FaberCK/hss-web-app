import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ScopeLevel } from '@prisma/client';
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

    const requestedScopeId = req.headers['x-hss-scope-id'] as string | undefined;
    const requestedScopeLevel = req.headers['x-hss-scope-level'] as ScopeLevel | undefined;

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

    const entityIds = (scopeLevel: ScopeLevel) => [
      ...new Set(user.scopes.filter((scope) => scope.scopeLevel === scopeLevel).map((scope) => scope.entityId)),
    ];
    const [organizations, divisions, hubs, properties] = await Promise.all([
      this.prisma.organization.findMany({
        where: { id: { in: entityIds(ScopeLevel.ORGANIZATION) } },
        select: { id: true, name: true },
      }),
      this.prisma.division.findMany({
        where: { id: { in: entityIds(ScopeLevel.DIVISION) } },
        select: { id: true, name: true },
      }),
      this.prisma.hub.findMany({
        where: { id: { in: entityIds(ScopeLevel.HUB) } },
        select: { id: true, name: true },
      }),
      this.prisma.property.findMany({
        where: { id: { in: entityIds(ScopeLevel.PROPERTY) } },
        select: { id: true, name: true, code: true },
      }),
    ]);
    const scopeNames = new Map<string, string>();
    organizations.forEach((entity) => scopeNames.set(`${ScopeLevel.ORGANIZATION}:${entity.id}`, entity.name));
    divisions.forEach((entity) => scopeNames.set(`${ScopeLevel.DIVISION}:${entity.id}`, entity.name));
    hubs.forEach((entity) => scopeNames.set(`${ScopeLevel.HUB}:${entity.id}`, entity.name));
    properties.forEach((entity) => scopeNames.set(`${ScopeLevel.PROPERTY}:${entity.id}`, `${entity.name} (${entity.code})`));

    const relevantScopes = requestedScopeId && requestedScopeLevel
      ? user.scopes.filter((scope) => scope.entityId === requestedScopeId && scope.scopeLevel === requestedScopeLevel)
      : [];
    const assignedScopes = user.scopes.map((scope) => ({
      entityId: scope.entityId,
      scopeLevel: scope.scopeLevel,
      name: scopeNames.get(`${scope.scopeLevel}:${scope.entityId}`)
        ?? `${scope.scopeLevel} (${scope.entityId.slice(0, 8)})`,
      role: scope.role,
      departmentIds: scope.departments.map((department) => department.departmentId),
    }));
    const activeScopes = relevantScopes.map((scope) => ({
      entityId: scope.entityId,
      scopeLevel: scope.scopeLevel,
      role: scope.role,
      departmentIds: scope.departments.map((department) => department.departmentId),
    }));

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
      activeScopeId: relevantScopes[0]?.entityId,
      assignedScopes,
      activeScopes,
      roles,
      allowedDepartments: Array.from(departmentIdSet),
      scopeLevel: relevantScopes[0]?.scopeLevel,
    };

    req.user = userContext;
    next();
  }
}