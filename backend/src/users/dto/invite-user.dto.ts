import { IsEmail, IsNotEmpty, IsEnum, IsString, IsArray, IsOptional } from 'class-validator';
import { Role, ScopeLevel } from '@prisma/client';

export class InviteUserDto {
  @IsString()
  @IsNotEmpty()
  readonly employeeId: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @IsString()
  @IsNotEmpty()
  readonly lastName: string;

  @IsString()
  @IsNotEmpty()
  readonly organizationId: string;

  @IsEnum(Role)
  @IsNotEmpty()
  readonly role: Role;

  @IsEnum(ScopeLevel)
  @IsNotEmpty()
  readonly scopeLevel: ScopeLevel;

  @IsString()
  @IsNotEmpty()
  readonly entityId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly departmentIds?: string[];
}
