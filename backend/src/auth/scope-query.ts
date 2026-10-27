import { ScopeLevel, type Prisma } from '@prisma/client';
import type { UserScopeGrant } from './interfaces/user-context.interface';

export function propertyWhereForScopes(scopes: UserScopeGrant[]): Prisma.PropertyWhereInput {
  const filters: Prisma.PropertyWhereInput[] = scopes.map(({ entityId, scopeLevel }) => {
    switch (scopeLevel) {
      case ScopeLevel.ORGANIZATION:
        return { organizationId: entityId };
      case ScopeLevel.DIVISION:
        return { divisionId: entityId };
      case ScopeLevel.HUB:
        return { hubs: { some: { id: entityId } } };
      case ScopeLevel.PROPERTY:
        return { id: entityId };
    }
  });

  return filters.length > 0 ? { OR: filters } : { id: { in: [] } };
}

export function hubWhereForScopes(scopes: UserScopeGrant[]): Prisma.HubWhereInput {
  const filters: Prisma.HubWhereInput[] = [];
  for (const { entityId, scopeLevel } of scopes) {
    switch (scopeLevel) {
      case ScopeLevel.ORGANIZATION:
        filters.push({ division: { is: { organizationId: entityId } } });
        break;
      case ScopeLevel.DIVISION:
        filters.push({ divisionId: entityId });
        break;
      case ScopeLevel.HUB:
        filters.push({ id: entityId });
        break;
      case ScopeLevel.PROPERTY:
        break;
    }
  }

  return filters.length > 0 ? { OR: filters } : { id: { in: [] } };
}

export function divisionWhereForScopes(scopes: UserScopeGrant[]): Prisma.DivisionWhereInput {
  const filters: Prisma.DivisionWhereInput[] = [];
  for (const { entityId, scopeLevel } of scopes) {
    switch (scopeLevel) {
      case ScopeLevel.ORGANIZATION:
        filters.push({ organizationId: entityId });
        break;
      case ScopeLevel.DIVISION:
        filters.push({ id: entityId });
        break;
      case ScopeLevel.HUB:
      case ScopeLevel.PROPERTY:
        break;
    }
  }

  return filters.length > 0 ? { OR: filters } : { id: { in: [] } };
}

export function userScopeWhereForScopes(scopes: UserScopeGrant[]): Prisma.UserScopeWhereInput {
  const filters: Prisma.UserScopeWhereInput[] = scopes.map(({ entityId, scopeLevel }) => ({
    entityId,
    scopeLevel,
  }));

  return filters.length > 0 ? { OR: filters } : { id: { in: [] } };
}