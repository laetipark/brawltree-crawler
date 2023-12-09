import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModeClassType } from '~/interfaces/types/mode-class.type';

@Injectable()
export default class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  /** 게임 모드 반환 */
  async getModeClass(): Promise<ModeClassType> {
    return this.configService.get<any>('game.modeClass');
  }
}
