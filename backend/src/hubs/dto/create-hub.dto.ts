import { IsNotEmpty, IsString } from 'class-validator';

export class CreateHubDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  readonly divisionId: string;
}