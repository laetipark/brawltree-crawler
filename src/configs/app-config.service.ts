import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export default class AppConfigService {
  constructor(private configService: ConfigService) {}

  async getModeList() {
    return this.configService.get<string[]>('game.modeList');
  }

  async getTypeList() {
    return this.configService.get<number[]>('game.typeList');
  }

  async getModeClass(): Promise<{
    tripleModes: string[];
    duoModes: string[];
    soloModes: any;
  }> {
    return this.configService.get<any>('game.modeClass');
  }
}
