import { PartialType } from '@nestjs/mapped-types';
import { CreateTradingWalletDto } from './create-trading-wallet.dto';

export class UpdateTradingWalletDto extends PartialType(CreateTradingWalletDto) {}
