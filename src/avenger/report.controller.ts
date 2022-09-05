import { AvengerService } from './avenger.service';
import { Controller, Get, Header, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';

@Controller('report')
export class ReportController {
  constructor(private readonly avengerService: AvengerService) {}

  @Get('pdf')
  async getPDF(@Res() response: Response) {
    const file = await this.avengerService.getPDFReport();
    response.contentType('pdf');
    response.attachment('avengers.pdf');
    response.send(file);
  }

  @Get('xls')
  async getXLS(@Res() response: Response) {
    const file = await this.avengerService.getExcelReport();
    response.contentType(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.attachment();
    response.send(file);
  }
}
