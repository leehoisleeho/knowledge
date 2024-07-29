import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';
import { VectorModule } from './vector/vector.module';
import { QueryModule } from './query/query.module';

@Module({
  imports: [UploadModule, VectorModule, QueryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
