import fetch from 'node-fetch';
import config from '../config/config.js'

const url = `https://api.brawlstars.com/v1`;

const merge = (...arrays) => {
    const merged = {};

    arrays.forEach(data => {
        if (data !== undefined) {
            data.forEach(o => Object.assign(merged[o.name] ??= {}, o));
        }
    });

    return Object.values(merged);
}

const club_member = await fetch(`${url}/clubs/%23C2RCY8C2/members`, {
    method: 'GET',
    headers: config.headers,
}).then(res => {
    return res.json();
});

/*
const club_member_2nd = await fetch(`${url}/clubs/%232GUG89CYV/members`, {
    method: 'GET',
    headers: config.headers,
}).then(res => {
    return res.json();
});
*/

export default merge(club_member.items);