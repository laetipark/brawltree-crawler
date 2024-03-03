import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModeClassType } from '~/common/types/mode-class.type';

@Injectable()
export class UtilConfigService {
  constructor(private readonly configService: ConfigService) {}

  /** 게임 모드 반환 */
  getModeClass(): ModeClassType {
    return this.configService.get<any>('game.modeClass');
  }

  /** cdn 주소 반환 */
  getCdnUrl(): string {
    return this.configService.get<string>('axios.cdnURL');
  }
}
