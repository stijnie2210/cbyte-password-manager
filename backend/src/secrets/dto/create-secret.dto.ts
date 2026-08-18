import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateSecretDto {
  @IsString()
  @MinLength(1)
  password!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10080) // max 7 dagen in minuten
  expiresInMinutes?: number;
}
