import Sequelize from "sequelize";
import Battle from "./table_battle.js";
import Member from "./table_member.js";
import MemberBrawler from "./table_member_brawler.js";
import MemberFriend from "./table_member_friend.js";
import MemberRecord from "./table_member_record.js";

import Rotation from "./view_rotation.js";
import InfoBrawler from "./view_info_brawler.js";
import InfoMap from "./view_info_map.js";
import InfoSeason from "./view_info_season.js";

import Config from "../config/config.js";
import BattlePick from "./view_battle_pick.js";

const config =
    Config.sequelize;
const db = {}

const sequelize =
    new Sequelize(config.database, config.username, config.password, config);
db.sequelize = sequelize;


db.Member = Member;
db.MemberBrawler = MemberBrawler;
db.Battle = Battle;

db.MemberFriend = MemberFriend;
db.MemberRecord = MemberRecord;

db.BattlePick = BattlePick;
db.Rotation = Rotation;
db.InfoBrawler = InfoBrawler;
db.InfoMap = InfoMap;
db.InfoSeason = InfoSeason;


Battle.init(sequelize);
Member.init(sequelize);
MemberBrawler.init(sequelize);

MemberFriend.init(sequelize);
MemberRecord.init(sequelize);

BattlePick.init(sequelize);
Rotation.init(sequelize);
InfoBrawler.init(sequelize);
InfoMap.init(sequelize);
InfoSeason.init(sequelize);


Battle.associate(db);
Member.associate(db);
MemberBrawler.associate(db);

MemberFriend.associate(db);
MemberRecord.associate(db);

Rotation.associate(db);
InfoBrawler.associate(db);
InfoMap.associate(db);

export {db, sequelize}