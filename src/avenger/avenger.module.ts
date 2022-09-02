import { ReportController } from './report.controller';
import { Module } from '@nestjs/common';
import { AvengerController } from './avenger.controller';
import { AvengerService } from './avenger.service';

@Module({
  controllers: [AvengerController, ReportController],
  providers: [AvengerService],
})
export class AvengerModule {}
