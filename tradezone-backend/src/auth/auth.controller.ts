import {
  Controller,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: any) {
    return this.authService.register(registerDto);
  }

  // Admin endpoint to toggle AI feature for a user
  @Patch('toggle-ai/:email')
  @UseGuards(JwtAuthGuard)
  async toggleAiFeature(
    @Param('email') email: string,
    @Body('enabled') enabled: boolean,
  ) {
    return this.authService.toggleUserAiFeature(email, enabled);
  }
}
