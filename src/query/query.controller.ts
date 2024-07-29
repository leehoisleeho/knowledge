import { Controller, Post, Body } from '@nestjs/common';
import { QueryService } from './query.service';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}
  @Post()
  async query(@Body('question') question: string) {
    return await this.queryService.query(question);
  }
}
