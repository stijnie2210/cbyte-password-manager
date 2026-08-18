import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateSecretDto } from './dto/create-secret.dto';
import { SecretsService } from './secrets.service';

@Controller('secrets')
export class SecretsController {
  constructor(private readonly secrets: SecretsService) {}

  @Post()
  async create(@Body() dto: CreateSecretDto) {
    const row = await this.secrets.create(dto.password, dto.expiresInMinutes);
    return { id: row.id, expiresAt: row.expiresAt };
  }

  @Get(':id')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async consume(@Param('id', ParseUUIDPipe) id: string) {
    const password = await this.secrets.consume(id);
    return { password };
  }
}
