import axios from "axios";
import config from "../config/config.js";
import crewJSON from "../public/json/crew.json" assert {type: "json"};

import {col, fn, literal, Op} from "sequelize";

export class memberService {

    /** 멤버 정보 최신화 */
    static updateMembers = async () => {
        const clubMembers = await axios({
            url: `${config.url}/clubs/%23C2RCY8C2/members`,
            method: "GET",
            headers: config.headers,
        }).then(res => {
            const members = res.data;
            return members.items.map(member => {
                return {
                    USER_ID: member.tag,
                    USER_LST_CK: new Date(0),
                    USER_LST_BT: new Date(0),
                    USER_CR: "Blossom",
                    USER_CR_NM: member.name
                };
            });
        }).catch(err => console.error(err));

        const crewMembers = crewJSON.map(member => {
            return {
                USER_ID: member.tag,
                USER_LST_CK: new Date(0),
                USER_LST_BT: new Date(0),
                USER_CR: "Team",
                USER_CR_NM: member.name
            };
        });

        const memberGroup = crewMembers.concat(clubMembers);

        const members = memberGroup.filter((item1, idx1) => {
            return memberGroup.findIndex((item2) => {
                return item1.USER_ID === item2.USER_ID;
            }) === idx1;
        });
        const memberIDs = members.map(member => member.USER_ID);

        await axios({
            url: `http://localhost:${config.port}/blossom/members`,
            params: {
                members: JSON.stringify(members),
            },
            method: "PUT"
        });

        return memberIDs;
    };

    static updateMemberProfiles = async (members) => {
        await axios({
            url: `http://localhost:${config.port}/blossom/members/profile`,
            params: {
                members: JSON.stringify(members),
            },
            method: "PUT"
        });
    };

    static updateMemberFriends = async (members) => {
        await axios({
            url: `http://localhost:${config.port}/blossom/friends`,
            params: {
                members: JSON.stringify(members),
            },
            method: "PUT"
        });
    };

    static updateMemberRecords = async (members) => {
        await axios({
            url: `http://localhost:${config.port}/blossom/records`,
            params: {
                members: JSON.stringify(members),
            },
            method: "PUT"
        });
    };
}