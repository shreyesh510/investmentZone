import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { FirebaseDatabaseService } from '../database/firebase-database.service';
import { FirebaseConfig } from '../config/firebase.config';

@Module({
  controllers: [WalletsController],
  providers: [WalletsService, FirebaseDatabaseService, FirebaseConfig],
  exports: [WalletsService],
})
export class WalletsModule {}
