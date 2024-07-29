import { Controller, Post, Body } from '@nestjs/common';
import { QueryService } from './query.service';

@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}
  @Post()
  async query(@Body('question') question: string) {
    const res = await this.queryService.queryAndAnswer(question);
    return {
      code: 0,
      msg: 'success',
      data: res,
    };
  }
}
