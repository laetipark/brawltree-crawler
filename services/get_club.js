import fetch from 'node-fetch';
import config from '../config/config.js'

import crewJson from "../public/json/crew.json" assert {type: "json"};

const url = `https://api.brawlstars.com/v1`;

function removeDuplicates(inArray) {
    const arr = inArray.concat()
    for (let i = 0; i < arr.length; ++i) {
        for (let j = i + 1; j < arr.length; ++j) {
            if (arr[i] === arr[j]) {
                arr.splice(j, 1);
            }
        }
    }
    return arr;
}

export const updateMembers = async () => {
    const club = await fetch(`${url}/clubs/%23C2RCY8C2/members`, {
        method: 'GET',
        headers: config.headers,
    }).then(res => {
        return res.json();
    });

    const crew = crewJson.map(crew => crew.tag);

    const array = removeDuplicates(club.items.map(club => club.tag).concat(crew));
    return array;
}