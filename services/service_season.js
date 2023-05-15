import config from "../config/config.js";

import Season from "../models/season.js";
import SeasonSummary from "../models/season_summary.js";

export class seasonService {
    static checkSeason = async () => {
        return await Season.findOne({
            order: [["begin_date", "DESC"]],
            raw: true,
        }).then(async result => {
            if (result === null) {
                await Season.create({
                    id: "10",
                    begin_date: "2022-01-03T18:00:00",
                    end_date: "2022-03-07T17:50:00",
                });

                return this.checkSeason();
            } else {
                return result;
            }
        });
    }

    static insertSeason = async () => {
        const recentSeason = await this.checkSeason();

        if (Date.now() > new Date(recentSeason.end_date).getTime()) {
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

            await Season.create({
                id: id,
                begin_date: newDate.beginDate,
                end_date: newDate.endDate,
            });

            if (Date.now() > newDate.endDate) {
                await this.insertSeason();
            }
        }
    }

    static selectSeasonSummary = async (type, mode) => {
        const matchType = config.typeList.filter.includes(type) ? config.typeList[`${type}`] : config.typeList.all;
        const matchMode = config.modeList.includes(mode) ? Array(mode) : config.modeList;

        const season = await Season.findOne({
            order: [['begin_date', 'DESC']]
        });

        const members = await SeasonSummary.findAll({
            where: {
                season_id: season.id,
                match_type: matchType,
                map_mode: matchMode
            }
        });

        return [season, members];
    };
}