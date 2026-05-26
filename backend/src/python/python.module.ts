import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { PythonController } from './python.controller';
import { PythonService } from './python.service';

@Module({
  imports: [HttpModule],
  controllers: [PythonController],
  providers: [PythonService],
  exports: [PythonService],
})
export class PythonModule {}
