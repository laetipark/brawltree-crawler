import fetch from 'node-fetch';
import config from '../config/config.js';
import mapJSON from "../public/json/map.json" assert {type: "json"};
import rotationJSON from "../public/json/map.json" assert {type: "json"};

import {fn, literal, Op} from "sequelize";
import Map from '../models/map.js';
import MapRotation from '../models/map_rotation.js';

const convertDateFormat = (date) => {
    return Date.UTC(parseInt(date.substring(0, 4)),
        parseInt(date.substring(4, 6)) - 1,
        parseInt(date.substring(6, 8)),
        parseInt(date.substring(9, 11)),
        parseInt(date.substring(11, 13)),
        parseInt(date.substring(13, 15)));
};

export class rotationService {

    /** 전투 맵 데이터베이스에 업데이트 및 추가 */
    static updateMaps = async () => {
        for (const item of mapJSON.rotation) {
            const mapID = item.id;
            const mapMode = item.mode;
            const mapName = item.name;

            await Map.upsert({
                id: mapID,
                mode: mapMode,
                name: mapName
            });
        }
    }

    static updateIsRotation = async () => {
        const rotationMaps = await MapRotation.findAll({
            attributes: ["map_id"],
        }).then(result => {
            return result.map(map => map.map_id);
        });

        await Map.update({
            is_rotation: true
        }, {
            where: {
                id: {
                    [Op.in]: rotationMaps
                }
            }
        });

        await Map.update({
            is_rotation: false
        }, {
            where: {
                id: {
                    [Op.notIn]: rotationMaps
                }
            }
        });
    }

    static insertRotation = async () => {
        const responseEvent = await fetch(`${config.url}/events/rotation`, {
            method: 'GET',
            headers: config.headers,
        })
            .then(res => res.json())
            .catch(err => console.error(err));

        for (const item of responseEvent) {
            const mapID = item.event.id;
            const mapMode = item.event.mode;
            const mapName = rotationJSON.rotation.find((element) => {
                return element.id === item.event.id.toString();
            }) !== undefined ? rotationJSON.rotation.find((element) => {
                return element.id === item.event.id.toString();
            }).name : item.event.map;

            const beginTime = new Date(convertDateFormat(item.startTime));
            const endTime = new Date(convertDateFormat(item.endTime));
            const modifiers = item.event.modifiers?.at(0);

            const slotID = item.slotId;

            await Map.findOrCreate({
                where: {
                    id: mapID,
                },
                defaults: {
                    mode: mapMode,
                    name: mapName
                }
            });

            await MapRotation.upsert({
                slot_id: slotID,
                begin_time: beginTime,
                end_time: endTime,
                map_id: mapID,
                modifiers: modifiers
            });
        }
    }

    static deleteRotation = async () => {
        await MapRotation.destroy({
            where: {
                [Op.or]: [{
                    begin_time: {
                        [Op.lt]: fn("DATE_FORMAT", fn("DATE_SUB", fn("NOW"), literal("INTERVAL 360 HOUR")), "%Y-%m-%d")
                    },
                    slot_id: {
                        [Op.or]: [4, 6]
                    }
                }, {
                    begin_time: {
                        [Op.lt]: fn("DATE_FORMAT", fn("DATE_SUB", fn("NOW"), literal("INTERVAL 168 HOUR")), "%Y-%m-%d")
                    },
                    slot_id: {
                        [Op.notIn]: [4, 6]
                    }
                },{
                    begin_time: {
                        [Op.lt]: fn("DATE_FORMAT", fn("DATE_SUB", fn("NOW"), literal("INTERVAL 144 HOUR")), "%Y-%m-%d")
                    },
                    slot_id: 8
                }, {
                    end_time: {
                        [Op.lt]: fn("DATE_FORMAT", fn("NOW"), "%Y-%m-%d")
                    },
                    slot_id: {
                        [Op.between]: [20, 26]
                    }
                }]
            }
        });
    }

    static selectRotation = async () => {

        const groupBy = (data, key) =>
            data.reduce(function (carry, el) {
                const group = el[key];

                if (carry[group] === undefined) {
                    carry[group] = [];
                }

                carry[group].push(el);
                return carry;
            }, {})

        const rotation = await MapRotation.findAll({
            include: [{
                model: Map,
                required: true,
                attributes: ["mode", "name"]
            }],
            order: [["begin_time", "DESC"]],
            raw: true
        }).then(result => {
            return groupBy(result, "slot_id");
        });

        return [rotation];
    };
}