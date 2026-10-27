import { Role, ScopeLevel } from '@prisma/client';
import { divisionWhereForScopes, hubWhereForScopes, propertyWhereForScopes } from './scope-query';
import type { UserScopeGrant } from './interfaces/user-context.interface';

describe('scope query filters', () => {
  it('includes only descendants of organization and division grants', () => {
    const scopes: UserScopeGrant[] = [
      { entityId: 'org-1', scopeLevel: ScopeLevel.ORGANIZATION, role: Role.OPERATOR, departmentIds: [] },
      { entityId: 'division-2', scopeLevel: ScopeLevel.DIVISION, role: Role.OPERATOR, departmentIds: [] },
    ];

    expect(propertyWhereForScopes(scopes)).toEqual({
      OR: [{ organizationId: 'org-1' }, { divisionId: 'division-2' }],
    });
    expect(hubWhereForScopes(scopes)).toEqual({
      OR: [
        { division: { is: { organizationId: 'org-1' } } },
        { divisionId: 'division-2' },
      ],
    });
    expect(divisionWhereForScopes(scopes)).toEqual({
      OR: [{ organizationId: 'org-1' }, { id: 'division-2' }],
    });
  });

  it('does not expose parent entities for Hub and property grants', () => {
    const scopes: UserScopeGrant[] = [
      { entityId: 'hub-1', scopeLevel: ScopeLevel.HUB, role: Role.OPERATOR, departmentIds: [] },
      { entityId: 'property-2', scopeLevel: ScopeLevel.PROPERTY, role: Role.OPERATOR, departmentIds: [] },
    ];

    expect(propertyWhereForScopes(scopes)).toEqual({
      OR: [{ hubs: { some: { id: 'hub-1' } } }, { id: 'property-2' }],
    });
    expect(hubWhereForScopes(scopes)).toEqual({ id: 'hub-1' });
    expect(divisionWhereForScopes(scopes)).toEqual({ id: { in: [] } });
  });

  it('matches nothing when there are no assigned scopes', () => {
    expect(propertyWhereForScopes([])).toEqual({ id: { in: [] } });
    expect(hubWhereForScopes([])).toEqual({ id: { in: [] } });
    expect(divisionWhereForScopes([])).toEqual({ id: { in: [] } });
  });
});