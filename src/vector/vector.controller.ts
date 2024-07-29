import { Body, Controller, Get, Post } from '@nestjs/common';
import { VectorService } from './vector.service';

@Controller('vector')
export class VectorController {
  constructor(private readonly vectorService: VectorService) {}

  @Post()
  vector(@Body('fileName') fileName: string) {
    return this.vectorService.vector(fileName);
  }
}
