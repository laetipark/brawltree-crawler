import {fn, literal, Op} from "sequelize";
import fetch from 'node-fetch';
import config from '../config/config.js';
import rotationJSON from "../public/json/map.json" assert {type: "json"};

import Map from '../models/map.js';
import MapRotation from '../models/map_rotation.js';

const convertDateFormat = (date) => {
    return `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}T${date.substring(9, 11)}:${date.substring(11, 13)}:${date.substring(13, 15)}${date.substring(15, 19)}`;
};

export class rotationService {

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

            const beginTime = convertDateFormat(item.startTime);
            const endTime = convertDateFormat(item.endTime);
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
                map_id: mapID,
                begin_time: beginTime,
                end_time: endTime,
            });
        }
    }

    static deleteRotation = async () => {
        await MapRotation.destroy({
            where: {
                begin_time: {
                    [Op.lt]: fn("DATE_FORMAT", fn("DATE_SUB", fn("NOW"), literal("INTERVAL 14 DAY")), "%Y-%m-%d")
                }
            },
        });
    }
}