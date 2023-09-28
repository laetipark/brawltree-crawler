import axios from "axios";
import crewJSON from "../public/json/crew.json" assert { type: "json" };

import { col, fn, literal, Op } from "sequelize";
import {
  sequelize,
  Maps,
  UserBattles,
  UserFriends,
  UserRecords,
  Users,
} from "../models/index.js";
import { authService } from "./auth_service.js";

import config from "../config/config.js";

export class blossomService {
  /** 멤버 정보 최신화 */
  static updateMembers = async () => {
    const clubMembers = await axios({
      url: `${config.url}/clubs/%23C2RCY8C2/members`,
      method: "GET",
      headers: config.headers,
    })
      .then((res) => {
        const members = res.data;
        return members.items.map((member) => {
          return {
            USER_ID: member.tag,
            USER_LST_CK: new Date(0),
            USER_LST_BT: new Date(0),
            USER_CR: "Blossom",
            USER_CR_NM: member.name,
          };
        });
      })
      .catch((err) => console.error(err));

    const crewMembers = crewJSON.map((member) => {
      return {
        USER_ID: member.tag,
        USER_LST_CK: new Date(0),
        USER_LST_BT: new Date(0),
        USER_CR: "Team",
        USER_CR_NM: member.name,
      };
    });

    const memberGroup = crewMembers.concat(clubMembers);
    const members = memberGroup.filter((item1, idx1) => {
      return (
        memberGroup.findIndex((item2) => {
          return item1.USER_ID === item2.USER_ID;
        }) === idx1
      );
    });
    const memberIDs = members.map((member) => member.USER_ID);

    await sequelize.transaction(async (t) => {
      await Users.bulkCreate(members, {
        ignoreDuplicates: true,
        updateOnDuplicate: ["USER_CR", "USER_CR_NM"],
        transaction: t,
      });

      await Users.update(
        {
          USER_CR: null,
          USER_CR_NM: null,
        },
        {
          where: {
            USER_ID: {
              [Op.notIn]: memberIDs,
            },
          },
          transaction: t,
        }
      );
    }); // transaction 종료
    return memberIDs;
  };

  static updateMemberProfiles = async (members) => {
    await Promise.all(
      members.map(async (member) => {
        const user = await authService.fetchUserRequest(
          member.replace("#", "")
        );

        if (user !== undefined) {
          await authService.updateUserProfile(user);
        }
      })
    );
  };

  static updateMemberFriends = async (members, season) => {
    const friends = [];

    await sequelize.transaction(async (t) => {
      await Promise.all(
        members.map(async (member) => {
          await UserBattles.findAll({
            include: [
              {
                model: Maps,
                required: true,
                attributes: [],
              },
            ],
            attributes: [
              "USER_ID",
              [col("PLAYER_ID"), "FRIEND_ID"],
              "MATCH_TYP",
              "MATCH_GRD",
              [col("PLAYER_NM"), "FRIEND_NM"],
              [fn("COUNT", literal("*")), "MATCH_CNT"],
              [
                fn("COUNT", literal("CASE WHEN MATCH_RES = -1 THEN 1 END")),
                "MATCH_CNT_VIC",
              ],
              [
                fn("COUNT", literal("CASE WHEN MATCH_RES = 1 THEN 1 END")),
                "MATCH_CNT_DEF",
              ],
              [
                fn(
                  "ROUND",
                  fn(
                    "SUM",
                    literal(
                      "CASE WHEN MATCH_RES = -1 THEN 0.005 * CAST(MATCH_GRD AS UNSIGNED) WHEN MATCH_RES = 0 THEN 0.0025 * CAST(MATCH_GRD AS UNSIGNED)  ELSE 0.001 * CAST(MATCH_GRD AS UNSIGNED) END"
                    )
                  ),
                  2
                ),
                "FRIEND_PT",
              ],
              [col("Map.MAP_MD"), "MAP_MD"],
            ],
            where: {
              USER_ID: member,
              PLAYER_ID: {
                [Op.and]: {
                  [Op.not]: member,
                  [Op.in]: members,
                },
              },
              MATCH_DT: {
                [Op.gt]: season.SEASON_BGN_DT,
              },
              [Op.or]: {
                MATCH_TYP: 0,
                [Op.and]: {
                  MATCH_TYP: 3,
                  MATCH_TYP_RAW: 3,
                },
              },
            },
            group: [
              "USER_ID",
              "FRIEND_ID",
              "MATCH_TYP",
              "MATCH_GRD",
              "PLAYER_NM",
              "MAP_MD",
            ],
            raw: true,
            transaction: t,
          }).then((result) => {
            result.length > 0 && friends.push(...result);
          });
        })
      );

      await UserFriends.bulkCreate(friends, {
        ignoreDuplicates: true,
        updateOnDuplicate: [
          "MATCH_CNT",
          "MATCH_CNT_VIC",
          "MATCH_CNT_DEF",
          "FRIEND_PT",
        ],
        transaction: t,
      });
    });
  };

  static updateMemberRecords = async (members, season) => {
    const records = [];

    await sequelize.transaction(async (t) => {
      await Promise.all(
        members.map(async (member) => {
          await UserBattles.findAll({
            include: [
              {
                model: Maps,
                required: true,
                attributes: [],
              },
            ],
            attributes: [
              "USER_ID",
              "MATCH_TYP",
              "MATCH_GRD",
              [
                fn(
                  "SUM",
                  literal(
                    "CASE WHEN MATCH_TYP = 0 THEN MATCH_CHG + MATCH_CHG_RAW ELSE 0 END"
                  )
                ),
                "MATCH_CHG",
              ],
              [fn("COUNT", literal("*")), "MATCH_CNT"],
              [
                fn("COUNT", literal("CASE WHEN MATCH_RES = -1 THEN 1 END")),
                "MATCH_CNT_VIC",
              ],
              [
                fn("COUNT", literal("CASE WHEN MATCH_RES = 1 THEN 1 END")),
                "MATCH_CNT_DEF",
              ],
              [col("Map.MAP_MD"), "MAP_MD"],
            ],
            where: {
              [Op.or]: [
                {
                  USER_ID: member,
                  PLAYER_ID: member,
                  MATCH_DT: {
                    [Op.gt]: season.SEASON_BGN_DT,
                  },
                },
                {
                  USER_ID: member,
                  PLAYER_ID: member,
                  MATCH_DT: {
                    [Op.gt]: season.SEASON_BGN_DT,
                  },
                  MATCH_TYP: 3,
                  MATCH_TYP_RAW: 3,
                },
              ],
            },
            group: ["USER_ID", "MATCH_TYP", "MATCH_GRD", "MAP_MD"],
            raw: true,
            transaction: t,
          }).then((result) => {
            result.length > 0 && records.push(...result);
          });
        })
      );

      await UserRecords.bulkCreate(records, {
        ignoreDuplicates: true,
        updateOnDuplicate: [
          "MATCH_CHG",
          "MATCH_CNT",
          "MATCH_CNT_VIC",
          "MATCH_CNT_DEF",
        ],
        transaction: t,
      });
    });
  };
}