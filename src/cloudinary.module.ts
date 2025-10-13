import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService], // ⚡ important pour l’utiliser ailleurs
})
export class CloudinaryModule {}
