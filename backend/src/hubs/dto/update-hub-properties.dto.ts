import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class UpdateHubPropertiesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  readonly propertyIds: string[];
}