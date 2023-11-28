import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModeClass } from '~/interfaces/types/mode-class';

@Injectable()
export default class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  /** 게임 모드 반환 */
  async getModeClass(): Promise<ModeClass> {
    return this.configService.get<any>('game.modeClass');
  }
}
