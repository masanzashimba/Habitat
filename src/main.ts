import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Activer CORS pour le front
  app.enableCors({
    origin: 'http://localhost:3001', // ton front
    credentials: true, // permet d'envoyer le cookie
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
