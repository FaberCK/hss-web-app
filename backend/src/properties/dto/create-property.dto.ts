import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

/**
 * Data Transfer Object for creating a new Property.
 */
export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 5, { message: 'Property code must be exactly 5 characters long' })
  @Matches(/^[A-Z0-9]+$/, { message: 'Property code must be alphanumeric and uppercase' })
  readonly code: string; // e.g., HLD01

  @IsString()
  @IsNotEmpty()
  readonly divisionId: string;

  @IsString()
  @IsNotEmpty()
  readonly organizationId: string;
}