import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    console.log('🏥 Health check requested');
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Backend is running successfully!',
      version: '1.0.0',
      cors: 'enabled',
    };
    console.log('✅ Health check response:', response);
    return response;
  }
}
