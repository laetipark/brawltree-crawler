import {col, fn, literal, Op} from "sequelize";
import BattlePick from "../models/view_battle_pick.js";
import InfoBrawler from "../models/view_info_brawler.js";
import InfoMap from "../models/view_info_map.js";

export class mapService {

    /** 맵 정보 반환 */
    static selectMapInfo = async (id) => {
        return await InfoMap.findOne({
            attributes: ["MAP_ID", "MAP_MD", "MAP_NM", "ROTATION_TL_BOOL", "ROTATION_PL_BOOL"],
            where: {
                MAP_ID: id
            }
        });
    };

    /** 맵에 대한 브롤러 승률 정보 반환
     * @param id 맵 ID
     * @param type 매치 타입
     * @param grade 매치 랭크
     */
    static selectMapBattlePick = async (id, type, grade) => {
        const matchGrade = type => {
            if (type === "0") {
                return grade;
            } else {
                const array = []
                grade?.map(num => {
                    array.push(num * 3 + 1);
                    if (num !== "6") {
                        array.push(num * 3 + 2);
                        array.push(num * 3 + 3);
                    }
                });

                return array;
            }
        };

        return await BattlePick.findAll({
            include: [
                {
                    model: InfoBrawler,
                    required: true,
                    attributes: []
                },
            ],
            attributes: ["MAP_ID", "BRAWLER_ID",
                [fn("ROUND", literal("SUM(`MATCH_CNT`) * 100 / SUM(SUM(`MATCH_CNT`)) OVER()"), 2), "MATCH_CNT_RATE"],
                [fn("ROUND", literal("SUM(`MATCH_CNT_VIC`) * 100 / (SUM(`MATCH_CNT_VIC`) + SUM(`MATCH_CNT_DEF`))"), 2), "MATCH_CNT_VIC_RATE"],
                [col("InfoBrawler.BRAWLER_NM"), "BRAWLER_NM"]],
            where: {
                MAP_ID: id,
                MATCH_TYP: type,
                MATCH_GRD: {
                    [Op.in]: matchGrade(type)
                }
            },
            group: ["BRAWLER_ID"],
            order: [["MATCH_CNT_RATE", "DESC"], ["MATCH_CNT_VIC_RATE", "DESC"]]
        });
    };
}
