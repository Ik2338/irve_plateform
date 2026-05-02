import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('IRVE Platform API')
    .setDescription('API de mise en relation installateurs IRVE / clients')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentification')
    .addTag('requests', 'Demandes d\'installation')
    .addTag('installers', 'Installateurs IRVE')
    .addTag('quotes', 'Devis')
    .addTag('matching', 'Matching géographique')
    .addTag('admin', 'Administration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  // Dans main.ts, avant app.listen()
  
  (BigInt.prototype as any).toJSON = function () {
  return Number(this);
};
  await app.listen(process.env.PORT || 3001);
  console.log(`\n🔌 IRVE API running on http://localhost:${process.env.PORT || 3001}`);
  console.log(`📖 Swagger docs: http://localhost:${process.env.PORT || 3001}/docs\n`);
}
bootstrap();
