import { ArrayUnique, IsArray, IsNotEmpty, IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator';

export class UpdatePropertyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 5, { message: 'Property code must be exactly 5 characters long' })
  @Matches(/^[A-Z0-9]+$/, { message: 'Property code must be alphanumeric and uppercase' })
  readonly code: string;

  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  readonly departmentIds: string[];
}