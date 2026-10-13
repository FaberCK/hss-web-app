import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { User, UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async inviteUser(inviteUserDto: InviteUserDto): Promise<User> {
    const { employeeId, email, organizationId, role, scopeLevel, entityId, departmentIds, firstName, lastName } = inviteUserDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { eid: employeeId }],
      },
    });

    if (existingUser) {
      throw new ConflictException(`User with email '${email}' or Employee ID '${employeeId}' already exists.`);
    }

    return this.prisma.user.create({
      data: {
        eid: employeeId,
        email,
        firstName,
        lastName,
        organizationId,
        status: UserStatus.PENDING,
        scopes: {
          create: {
            role,
            scopeLevel,
            entityId,
            departments: departmentIds && departmentIds.length > 0 ? {
              create: departmentIds.map((departmentId) => ({
                department: { connect: { id: departmentId } },
              })),
            } : undefined,
          },
        },
      },
      include: {
        scopes: {
          include: {
            departments: true,
          },
        },
      },
    });
  }

  async findAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: {
        scopes: {
          include: {
            departments: {
              include: { department: true },
            },
          },
        },
      },
    });
  }
}
