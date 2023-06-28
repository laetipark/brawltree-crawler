import InfoSeason from "../models/view_info_season.js";

export class seasonService {

    /** 최근 시즌 불러오기 */
    static selectRecentSeason = async () => {
        return await InfoSeason.findOne({
            order: [['SEASON_BGN_DT', 'DESC']]
        });
    };

    /** 두 번째로 최근 시즌 불러오기 */
    static selectSecondRecentSeason = async () => {
        return await InfoSeason.findAll({
            limit: 2,
            order: [["SEASON_BGN_DT", "DESC"]],
        }).then(result => {
            return result[1];
        });
    };
}