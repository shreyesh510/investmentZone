import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get allowed origins from environment variable or use defaults
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3001',
        'https://tradezone-2kfy.onrender.com',
      ];

  // Enable CORS with dynamic origin validation
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Check if origin is from Render (*.onrender.com)
      if (origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }

      // In production, be strict; in development, be permissive
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Log rejected origin for debugging
      console.warn(`⚠️ CORS: Rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // No global prefix for now to keep existing endpoints working

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(`🌐 CORS configured for:`, allowedOrigins);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
