import {Op} from 'sequelize';
import fetch from 'node-fetch';
import Rotation from '../models/rotation.js';
import config from '../config/config.js';
import rotationJSON from "../public/json/rotation.json" assert {type: "json"};

const url = `https://api.brawlstars.com/v1`;

const convertDateFormat = (date) => {
    return `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}T${date.substring(9, 11)}:${date.substring(11, 13)}:${date.substring(13, 15)}${date.substring(15, 19)}`;
}

export default async () => {
    console.log('🌸 GET START : ROTATION');

    const controller = new AbortController;
    const timeout = setTimeout(() => {
        controller.abort();
    }, 150);

    const responseEvent = await fetch(`${url}/events/rotation`, {
        method: 'GET',
        headers: config.headers,
    })
        .then(res => res.json())
        .catch(err => console.error(err))
        .finally(() => clearTimeout(timeout));

    await Rotation.update({
        slot: null,
    }, {
        where: {
            slot: {
                [Op.ne]: null
            }
        }
    });

    for (const item of responseEvent) {
        const mapID = item.event.id;
        const mapMode = rotationJSON.rotation.find((element) => {
            return element.id === item.event.id.toString();
        }).mode;
        const mapName = rotationJSON.rotation.find((element) => {
            return element.id === item.event.id.toString();
        }).name;
        const image = `${item.event.mode}/${(item.event.map).replace(/ /g, '-')}`;

        const startTime = convertDateFormat(item.startTime);
        const endTime = convertDateFormat(item.endTime);
        const slotID = item.slotId;

        await Rotation.upsert({
            id: mapID,
            mode: mapMode,
            name: mapName,
            start_time: startTime,
            end_time: endTime,
            slot: slotID,
            image: image
        });
    }
}