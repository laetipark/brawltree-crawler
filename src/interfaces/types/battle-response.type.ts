import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';

export type BattleResponse = {
  id: string;
  request: Observable<AxiosResponse<any, any>>;
};
