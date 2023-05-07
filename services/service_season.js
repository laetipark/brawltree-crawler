import {col, fn, literal, Op} from "sequelize";
import Battle from "../models/battle.js";
import Pick from "../models/pick.js";
import Record from "../models/record.js";
import Friend from "../models/friend.js";
import MapRotation from "../models/map_rotation.js";
import Season from "../models/season.js";

export class seasonService {
    static checkSeason = async () => {
        return await Season.findOne({
            raw: true,
            order: [["begin_date", "DESC"]],
        }).then(async result => {
            if (result === null) {
                await Season.create({
                    id: "10",
                    begin_date: "2022-01-03T18:00:00.000Z",
                    end_date: "2022-03-07T17:50:00.000Z",
                });

                return this.checkSeason();
            } else {
                return result;
            }
        });
    }

    static insertSeason = async () => {
        const recentSeason = await this.checkSeason();

        if (new Date().getTime() > recentSeason.end_date) {
            const id = `${parseInt(recentSeason.id) + 1}`;
            const beginDate = new Date(
                new Date(recentSeason.begin_date).setMonth(new Date(recentSeason.begin_date).getMonth() + 2)
            );
            const endDate = new Date(
                new Date(recentSeason.end_date).setMonth(new Date(recentSeason.end_date).getMonth() + 2)
            );
            const newDate = {
                beginDate: beginDate,
                endDate: endDate
            };

            if (beginDate.getMonth() % 2 === 0 && beginDate.getDate() + beginDate.getDay() < 12) {
                newDate.beginDate = beginDate.setDate(beginDate.getDate() + (8 % (beginDate.getDay() + 1) + 1));
            } else {
                newDate.beginDate = beginDate.setDate(beginDate.getDate() + (-5 - 8 % (beginDate.getDay() + 1) + 1));
            }

            if (endDate.getMonth() % 2 === 0 && endDate.getDate() + endDate.getDay() < 12) {
                newDate.endDate = endDate.setDate(endDate.getDate() + (8 % (endDate.getDay() + 1) + 1));
            } else {
                newDate.endDate = endDate.setDate(endDate.getDate() + (-5 - 8 % (endDate.getDay() + 1) + 1));
            }

            await this.updateSeason();

            await Season.create({
                id: id,
                begin_date: newDate.beginDate,
                end_date: newDate.endDate,
            });

            if (new Date().getTime() > newDate.endDate) {
                await this.insertSeason();
            }
        }
    }

    static insertPicks = async () => {
        const season = this.checkSeason();

        const picks = await Battle.findAll({
            attributes: ["map_id", "brawler_id", "raw_type", "match_grade",
                [fn("COUNT", "match_grade"), "match_count"],
                [fn("COUNT",
                    literal("CASE WHEN match_result = -1 THEN 1 END")
                ), "victory_count"]],
            group: ["map_id", "brawler_id", "raw_type", "match_grade"],
            where: {
                match_date: {
                    [Op.between]: [season.begin_date, season.end_date]
                },
            },
            raw: true
        });

        for (const pick of picks) {
            await Pick.upsert({
                map_id: pick.map_id,
                brawler_id: pick.brawler_id,
                match_type: pick.raw_type,
                match_grade: pick.match_grade,
                match_count: pick.match_count,
                victory_count: pick.victory_count
            });
        }
    }

    static insertRecords = async (members) => {
        const season = await this.checkSeason();

        const records = await Battle.findAll({
            include: [
                {
                    model: MapRotation,
                    required: true,
                    attributes: []
                },
            ],
            attributes: ["member_id", "match_type", "match_grade", "MapRotation.mode",
                [fn("SUM", literal("CASE WHEN match_type = 0 THEN match_change + raw_change ELSE 0 END")), "match_change"],
                [fn("COUNT", literal("*")), "match_count"],
                [fn("COUNT", literal("CASE WHEN match_result = -1 THEN 0 END")), "victory_count"],
                [fn("COUNT", literal("CASE WHEN match_result = 1 THEN 0 END")), "defeat_count"]],
            group: ["member_id", "match_type", "match_grade", "MapRotation.mode"],
            where: {
                player_id: {
                    [Op.ne]: col("Battle.member_id"),
                    [Op.in]: members,
                },
                match_date: {
                    [Op.between]: [season.begin_date, season.end_date]
                },
                [Op.or]: [{
                    match_type: {
                        [Op.in]: [0, 2, 3]
                    },
                    match_mode: {
                        [Op.in]: [2, 3]
                    },
                }, {
                    match_type: 0,
                    match_grade: {
                        [Op.lt]: 7
                    },
                }]
            },
            raw: true
        });

        for (const record of records) {
            await Record.upsert({
                member_id: record.member_id,
                map_mode: record.mode,
                match_type: record.match_type,
                match_grade: record.match_grade,
                match_change: record.match_change,
                match_count: record.match_count,
                victory_count: record.victory_count,
                defeat_count: record.defeat_count
            });
        }
    }

    static insertFriends = async (members) => {
        const season = await this.checkSeason();

        const friends = await Battle.findAll({
            include: [
                {
                    model: MapRotation,
                    required: true,
                    attributes: []
                },
            ],
            attributes: ["member_id", "player_id", "player_name", "match_type", "match_grade", "MapRotation.mode",
                [fn("COUNT", literal("*")), "match_count"],
                [fn("COUNT", literal("CASE WHEN match_result = -1 THEN 1 END")), "victory_count"],
                [fn("COUNT", literal("CASE WHEN match_result = 1 THEN 1 END")), "defeat_count"]],
            group: ["member_id", "player_id", "player_name", "match_type", "match_grade", "MapRotation.mode"],
            where: {
                player_id: {
                    [Op.ne]: col("Battle.member_id"),
                    [Op.in]: members,
                },
                match_date: {
                    [Op.between]: [season.begin_date, season.end_date]
                },
                [Op.or]: [{
                    match_type: {
                        [Op.in]: [0, 2, 3]
                    },
                    match_mode: {
                        [Op.in]: [2, 3]
                    },
                }, {
                    match_type: 0,
                    match_grade: {
                        [Op.lt]: 7
                    },
                }]
            },
            raw: true,
            logging: true
        });

        for (const friend of friends) {
            const calculatePoint = () => {
                if ([0, 4, 5].includes(friend.match_type)) {
                    const victoryPoint = (friend.victory_count * (friend.match_grade + 1)) / 200;
                    const matchPoint = (friend.victory_count * (friend.match_grade + 1)) / 1000;
                    return isNaN(victoryPoint + matchPoint) ? 0 : (victoryPoint + matchPoint).toFixed(2);
                } else if (friend.match_type === 6) {
                    const victoryPoint = (friend.victory_count) / 100;
                    const matchPoint = (friend.victory_count) / 500;
                    return isNaN(victoryPoint + matchPoint) ? 0 : (victoryPoint + matchPoint).toFixed(2);
                } else {
                    const victoryPoint = (friend.victory_count * friend.match_grade) / 100;
                    const matchPoint = (friend.victory_count * friend.match_grade) / 500;
                    return isNaN(victoryPoint + matchPoint) ? 0 : (victoryPoint + matchPoint).toFixed(2);
                }
            }
            const point = calculatePoint()

            await Friend.upsert({
                member_id: friend.member_id,
                friend_id: friend.player_id,
                map_mode: friend.mode,
                match_type: friend.match_type,
                match_grade: friend.match_grade,
                friend_name: friend.player_name,
                match_count: friend.match_count,
                victory_count: friend.victory_count,
                defeat_count: friend.defeat_count,
                point: point
            });
        }
    }

    static updateSeason = async () => {
        await Record.destroy();
        await Friend.destroy();
    }
}