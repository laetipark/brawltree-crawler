import { Injectable } from '@nestjs/common';
import { SeasonDto } from './dto/season.dto';

@Injectable()
export default class SeasonService {
  constructor() {}

  /** 현재 시즌 정보 반환 */
  getRecentSeason(): SeasonDto {
    const date = new Date();

    // 주어진 날짜에 해당하는 월의 첫째날을 찾음
    const thisMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    // 해당 달의 첫째주 목요일을 찾음
    const beginTime = new Date(thisMonth);
    beginTime.setDate(1 + ((11 - thisMonth.getDay() + 7) % 7));
    beginTime.setHours(18, 0, 0, 0);

    // 현재 날짜가 해당 달의 첫째주 목요일 이전인 경우
    if (date.getTime() < beginTime.getTime()) {
      // 이전 달의 첫째주 목요일 찾기
      thisMonth.setMonth(thisMonth.getMonth() - 1);
      thisMonth.setDate(1);
      beginTime.setTime(thisMonth.getTime());
      beginTime.setDate(1 + ((11 - thisMonth.getDay() + 7) % 7));
      beginTime.setHours(18, 0, 0, 0);
    }

    // 다음 달을 찾음
    const nextMonth = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth() + 1,
      1,
    );
    // 다음 달의 첫째주 목요일을 찾음
    const endTime = new Date(nextMonth);
    endTime.setDate(1 + ((11 - nextMonth.getDay() + 7) % 7));
    endTime.setHours(18, 0, 0, 0);

    return {
      beginTime,
      endTime,
    };
  }
}
