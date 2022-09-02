import { AvengerDTO } from './avenger.dto';
import { AvengerService } from './avenger.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

@Controller('avenger')
export class AvengerController {
  constructor(private readonly avengerService: AvengerService) {}

  @Get()
  async findAll(): Promise<any> {
    return await this.avengerService.getAllAvengers();
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<any> {
    return await this.avengerService.selectAvenger(id);
  }

  @Post()
  async addAvenger(@Body() avenger: AvengerDTO): Promise<string> {
    return await this.avengerService.createAvenger(avenger);
  }

  @Put(':id')
  async changeAvenger(
    @Param('id') id: string,
    @Body() newInfo: AvengerDTO,
  ): Promise<string> {
    return await this.avengerService.modifyAvenger(id, newInfo);
  }

  @Delete(':id')
  async deleteAvenger(@Param('id') id: string): Promise<string> {
    return await this.avengerService.deleteAvenger(id);
  }
}
