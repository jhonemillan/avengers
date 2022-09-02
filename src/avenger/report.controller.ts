import { AvengerService } from './avenger.service';
import { Controller, Get, Header, Res, StreamableFile } from '@nestjs/common';

@Controller('report')
export class ReportController {
  constructor(private readonly avengerService: AvengerService) {}

  @Get('pdf')
  async getPDF(): Promise<string> {
    return 'pdf';
  }

  @Get('xls')
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async getXLS(): Promise<StreamableFile> {
    return this.avengerService.getExcelReport();
  }
}
