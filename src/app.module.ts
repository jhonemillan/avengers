import { Module } from '@nestjs/common';
import { AvengerModule } from './avenger/avenger.module';

@Module({
  imports: [AvengerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
