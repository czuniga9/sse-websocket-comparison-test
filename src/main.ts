import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import expressLayouts from 'express-ejs-layouts';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  //layouts
  app.useStaticAssets(join(__dirname, '..', 'public')); // static files (css, js, images)
  app.setBaseViewsDir(join(__dirname, '..', 'views')); // views directory
  app.setViewEngine('ejs');
  // Enable layouts
  app.set('layout', 'layouts/layout'); // default layout
  app.use(expressLayouts);
  app.set('view cache', false);

  app.useWebSocketAdapter(new IoAdapter(app));
  await app.listen(4000);
}
bootstrap();
