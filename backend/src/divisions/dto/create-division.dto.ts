import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateDivisionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly name: string;

  @IsUUID('4')
  readonly organizationId: string;
}