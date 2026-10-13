//  import { PrismaClient, Role, ScopeLevel, UserStatus } from '@prisma/client';

// const prisma = new PrismaClient();

import 'dotenv/config';
import { PrismaClient, Role, ScopeLevel, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const ids = {
  organization: '78f74918-f5e1-4c97-9d26-1b6c37f4a052',
  divisionNA: 'd2276a9c-a460-4cb8-b3f7-cbac65bb3194',
  divisionEU: 'f99b7d7d-77f1-4d77-b5f8-aca3b8e27e11',
  hubNA: 'b4f923d2-9643-4a7c-a557-3f9f7d2196a5',
  hubEU: '2cf1b727-3d18-4718-bf97-7c2ef35d130f',
  propertyDowntown: 'a0521c1e-f4c0-43f7-9b4b-4e8c9b2a68c2',
  propertyAirport: 'c7d14819-8395-4e06-8e6a-0f9fb3b18b9d',
  propertyGrand: '1f4a5f70-2d6c-4b9a-8fef-46d6c0b41f0c',
  deptHousekeeping: '7e66b1a2-8fb4-4b9c-9b1c-3380f3f6caf6',
  deptFrontDesk: '07090ab4-4ab1-4f55-b2ac-4f6731f4e65f',
  deptFoodBeverage: 'f6ac3b6d-9db0-40bb-9c32-7f51e93a3f90',
  deptEngineering: 'ad8b7975-d8c2-4b1f-8cb2-dd5b1f5b6ba1',
  deptSales: 'aea9e643-7f6c-448a-8bb1-1f7b4a2f4efe',
  userAdmin: '63edb739-d981-4a4f-9d6a-209e5b7b5981',
  userOperator: '8d9a6fdb-4a22-4e15-a5f6-6b1f8e9c4c7a',
  userViewer: '5b6c1df9-9c3b-4e79-a8f0-2f7c5a1f8362',
  userPending: 'f2c1e7b2-3ad4-4d7c-a786-f190c5ea0b58',
  scopeAdmin: 'ab00d8b3-303e-4b3b-8d10-9e9fe13c4e6f',
  scopeOperator: 'eb12c7b8-5a9a-4c5a-9a03-704e5318e51b',
  scopeViewer: 'cf39b0b1-97d7-4e71-a5e1-a336b45e5c1f',
};

async function main() {
  console.log('Cleaning existing seed data...');
  await prisma.userDepartment.deleteMany();
  await prisma.propertyDepartment.deleteMany();
  await prisma.userScope.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.property.deleteMany();
  await prisma.hub.deleteMany();
  await prisma.division.deleteMany();
  await prisma.organization.deleteMany();

  console.log('Seeding hotel chain demo data...');

  const organization = await prisma.organization.create({
    data: {
      id: ids.organization,
      name: 'Global Hotel Group',
      shortName: 'GHG',
    },
  });

  await prisma.division.createMany({
    data: [
      {
        id: ids.divisionNA,
        name: 'North America Region',
        organizationId: organization.id,
      },
      {
        id: ids.divisionEU,
        name: 'Europe Region',
        organizationId: organization.id,
      },
    ],
  });

  await prisma.hub.createMany({
    data: [
      {
        id: ids.hubNA,
        name: 'North America Operations Hub',
        divisionId: ids.divisionNA,
      },
      {
        id: ids.hubEU,
        name: 'Europe Operations Hub',
        divisionId: ids.divisionEU,
      },
    ],
  });

  await prisma.property.createMany({
    data: [
      {
        id: ids.propertyDowntown,
        name: 'Hilton Downtown',
        code: 'HLD01',
        divisionId: ids.divisionNA,
        organizationId: organization.id,
      },
      {
        id: ids.propertyAirport,
        name: 'Hilton Airport',
        code: 'HLD02',
        divisionId: ids.divisionNA,
        organizationId: organization.id,
      },
      {
        id: ids.propertyGrand,
        name: 'Grand Continental Hotel',
        code: 'GCH01',
        divisionId: ids.divisionEU,
        organizationId: organization.id,
      },
    ],
  });

  await prisma.department.createMany({
    data: [
      { id: ids.deptHousekeeping, name: 'Housekeeping' },
      { id: ids.deptFrontDesk, name: 'Front Desk' },
      { id: ids.deptFoodBeverage, name: 'Food & Beverage' },
      { id: ids.deptEngineering, name: 'Engineering' },
      { id: ids.deptSales, name: 'Sales' },
    ],
  });

  await prisma.propertyDepartment.createMany({
    data: [
      { propertyId: ids.propertyDowntown, departmentId: ids.deptHousekeeping },
      { propertyId: ids.propertyDowntown, departmentId: ids.deptFrontDesk },
      { propertyId: ids.propertyDowntown, departmentId: ids.deptFoodBeverage },
      { propertyId: ids.propertyAirport, departmentId: ids.deptFrontDesk },
      { propertyId: ids.propertyAirport, departmentId: ids.deptEngineering },
      { propertyId: ids.propertyGrand, departmentId: ids.deptHousekeeping },
      { propertyId: ids.propertyGrand, departmentId: ids.deptFrontDesk },
      { propertyId: ids.propertyGrand, departmentId: ids.deptSales },
    ],
  });

  await prisma.hub.update({
    where: { id: ids.hubNA },
    data: {
      properties: {
        connect: [
          { id: ids.propertyDowntown },
          { id: ids.propertyAirport },
        ],
      },
    },
  });

  await prisma.hub.update({
    where: { id: ids.hubEU },
    data: {
      properties: {
        connect: [{ id: ids.propertyGrand }],
      },
    },
  });

  await prisma.user.createMany({
    data: [
      {
        id: ids.userAdmin,
        eid: 'EID10001',
        email: 'alice.johnson@globalhotel.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        organizationId: organization.id,
        status: UserStatus.ACTIVE,
      },
      {
        id: ids.userOperator,
        eid: 'EID10002',
        email: 'bob.smith@globalhotel.com',
        firstName: 'Bob',
        lastName: 'Smith',
        organizationId: organization.id,
        status: UserStatus.ACTIVE,
      },
      {
        id: ids.userViewer,
        eid: 'EID10003',
        email: 'carmen.lee@globalhotel.com',
        firstName: 'Carmen',
        lastName: 'Lee',
        organizationId: organization.id,
        status: UserStatus.ACTIVE,
      },
      {
        id: ids.userPending,
        eid: 'EID10004',
        email: 'diana.greene@globalhotel.com',
        firstName: 'Diana',
        lastName: 'Greene',
        organizationId: organization.id,
        status: UserStatus.PENDING,
      },
    ],
  });

  await prisma.userScope.createMany({
    data: [
      {
        id: ids.scopeAdmin,
        userId: ids.userAdmin,
        role: Role.ADMIN,
        scopeLevel: ScopeLevel.ORGANIZATION,
        entityId: organization.id,
      },
      {
        id: ids.scopeOperator,
        userId: ids.userOperator,
        role: Role.OPERATOR,
        scopeLevel: ScopeLevel.PROPERTY,
        entityId: ids.propertyDowntown,
      },
      {
        id: ids.scopeViewer,
        userId: ids.userViewer,
        role: Role.VIEWER,
        scopeLevel: ScopeLevel.DIVISION,
        entityId: ids.divisionEU,
      },
    ],
  });

  await prisma.userDepartment.createMany({
    data: [
      { userScopeId: ids.scopeAdmin, departmentId: ids.deptHousekeeping },
      { userScopeId: ids.scopeAdmin, departmentId: ids.deptFrontDesk },
      { userScopeId: ids.scopeAdmin, departmentId: ids.deptFoodBeverage },
      { userScopeId: ids.scopeAdmin, departmentId: ids.deptEngineering },
      { userScopeId: ids.scopeAdmin, departmentId: ids.deptSales },
      { userScopeId: ids.scopeOperator, departmentId: ids.deptHousekeeping },
      { userScopeId: ids.scopeOperator, departmentId: ids.deptFrontDesk },
    ],
  });

  console.log('Seed data created successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });