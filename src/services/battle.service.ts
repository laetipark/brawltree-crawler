import { Repository } from 'typeorm';
import { BattleTrio, BrawlerStats } from '~/entities/brawler-stats.entity';
import { Maps } from '~/entities/maps.entity';
import { UserBattles } from '~/entities/users.entity';
import dataSource from '~/configs/database.config';

export default class BattleService {
  constructor(
    private battleTrio: Repository<BattleTrio>,
    private brawlerStats: Repository<BrawlerStats>,
    private maps: Repository<Maps>,
    private userBattles: Repository<UserBattles>,
  ) {}

  async updateBattleTrio(date: string) {
    const battleTrios = await dataSource
      .createQueryBuilder()
      .select(`CAST("${date}" AS DATETIME)`, 'aggregationDate')
      .addSelect('sq.mapID', 'mapID')
      .addSelect('sq.matchType', 'matchType')
      .addSelect('sq.matchGrade', 'matchGrade')
      .addSelect('sq.trio', 'trio')
      .addSelect('SUM(CAST(sq.matchCount AS UNSIGNED))', 'matchCount')
      .addSelect('SUM(CAST(sq.victoryCount AS UNSIGNED))', 'victoryCount')
      .addSelect('SUM(CAST(sq.defeatCount AS UNSIGNED))', 'defeatCount')
      .addSelect('sq.mode', 'mode')
      .from((subQuery) => {
        return subQuery
          .select('ub.mapID', 'mapID')
          .addSelect('ub.matchType', 'matchType')
          .addSelect('ub.matchGrade', 'matchGrade')
          .addSelect('m.mode', 'mode')
          .addSelect(
            'GROUP_CONCAT(DISTINCT ub.brawlerID ORDER BY ub.brawlerID ASC)',
            'trio',
          )
          .addSelect('ub.teamNumber', 'teamNumber')
          .addSelect('COUNT(*)', 'matchCount')
          .addSelect(
            'COUNT(CASE WHEN ub.matchResult = -1 THEN 1 ELSE NULL END)',
            'victoryCount',
          )
          .addSelect(
            'COUNT(CASE WHEN ub.matchResult = 1 THEN 1 ELSE NULL END)',
            'defeatCount',
          )
          .from(UserBattles, 'ub')
          .innerJoin(Maps, 'm', 'ub.mapID = m.mapID')
          .where('ub.modeCode = 3')
          .andWhere('ub.matchDate BETWEEN :begin AND :end', {
            begin: new Date(new Date(date).getTime() - 70 * 60 * 1000),
            end: new Date(new Date(date).getTime() - 10 * 60 * 1000),
          })
          .groupBy('ub.matchDate')
          .addGroupBy('ub.mapID')
          .addGroupBy('ub.matchType')
          .addGroupBy('ub.matchGrade')
          .addGroupBy('ub.teamNumber')
          .addGroupBy('m.mode');
      }, 'sq')
      .where('LENGTH(sq.trio) - LENGTH(REPLACE(sq.trio, ",", "")) + 1 = 3')
      .addGroupBy('sq.mapID')
      .addGroupBy('sq.matchType')
      .addGroupBy('sq.matchGrade')
      .addGroupBy('sq.teamNumber')
      .addGroupBy('sq.mode')
      .addGroupBy('sq.trio')
      .getRawMany()
      .then((result) => {
        return result?.map((item) => {
          const trio = [...new Set(item.trio.split(','))];
          item.brawlerID1 = trio[0];
          item.brawlerID2 = trio[1];
          item.brawlerID3 = trio[2];

          return {
            aggregationDate: item.aggregationDate,
            mapID: item.mapID,
            brawlerID1: item.brawlerID1,
            brawlerID2: item.brawlerID2,
            brawlerID3: item.brawlerID3,
            matchType: item.matchType,
            matchGrade: item.matchGrade,
            mode: item.mode,
            matchCount: item.matchCount,
            victoryCount: item.victoryCount,
            defeatCount: item.defeatCount,
          };
        });
      });

    battleTrios && (await this.battleTrio.save(battleTrios));
  }

  async updateBrawlerStats(date: string) {
    const brawlerStats = await this.userBattles
      .createQueryBuilder('ub')
      .select(`CAST("${date}" AS DATETIME)`, 'aggregationDate')
      .addSelect('ub.brawlerID', 'brawlerID')
      .addSelect('ub.mapID', 'mapID')
      .addSelect('ub.matchType', 'matchType')
      .addSelect('ub.matchGrade', 'matchGrade')
      .addSelect('COUNT(*)', 'matchCount')
      .addSelect(
        'COUNT(CASE WHEN ub.matchResult = -1 THEN 1 ELSE NULL END)',
        'victoryCount',
      )
      .addSelect(
        'COUNT(CASE WHEN ub.matchResult = 1 THEN 1 ELSE NULL END)',
        'defeatCount',
      )
      .addSelect('m.mode', 'mode')
      .innerJoin(Maps, 'm', 'ub.mapID = m.mapID')
      .where('ub.matchType IN (0, 2, 3)')
      .andWhere('ub.modeCode = 3')
      .andWhere('ub.matchDate BETWEEN :begin AND :end', {
        begin: new Date(new Date(date).getTime() - 70 * 60 * 1000),
        end: new Date(new Date(date).getTime() - 10 * 60 * 1000),
      })
      .groupBy('ub.brawlerID')
      .addGroupBy('ub.mapID')
      .addGroupBy('ub.matchType')
      .addGroupBy('ub.matchGrade')
      .addGroupBy('m.mode')
      .getRawMany();

    brawlerStats && (await this.brawlerStats.save(brawlerStats));
  }

  /** 이전 시즌 전투 기록 백업 */
  /*static backupBattles = async (season) => {
        await UserBattles.findAll({
            where: {
                MATCH_DT: {
                    [Op.lt]: season.SEASON_BGN_DT
                }
            },
            raw: true
        }).then(async (result) => {
            fs.writeFileSync(`./backup/battle-${Date.now()}.json`, JSON.stringify(result));
            await UserBattles.destroy({
                where: {
                    MATCH_DT: {
                        [Op.lt]: season.SEASON_BGN_DT
                    }
                }
            });
        });
    };*/
}
