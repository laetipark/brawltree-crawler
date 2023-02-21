import Sequelize from "sequelize";
import Member from "./member.js";
import MemberBrawler from "./member_brawler.js";
import Brawler from "./brawler.js";
import BattleLog from "./battle_log.js";
import Friend from "./friend.js";
import Record from "./record.js";
import Rotation from "./rotation.js";
import Pick from "./pick.js";
import Season from "./season.js";

import configFile from "../config/config.js";

const config = configFile.development;
const db = {}

const sequelize =
    new Sequelize(config.database, config.username, config.password, config);
db.sequelize = sequelize;

db.Member = Member;
db.MemberBrawler = MemberBrawler;
db.Brawler = Brawler;
db.BattleLog = BattleLog;
db.Friend = Friend;
db.Record = Record;
db.Rotation = Rotation;
db.Pick = Pick;
db.Season = Season;

BattleLog.init(sequelize);
Member.init(sequelize);
MemberBrawler.init(sequelize);
Brawler.init(sequelize);
Friend.init(sequelize);
Record.init(sequelize);
Rotation.init(sequelize);
Pick.init(sequelize);
Season.init(sequelize);

Member.associate(db);
BattleLog.associate(db);
MemberBrawler.associate(db);
Brawler.associate(db);
Friend.associate(db);
Record.associate(db);
Rotation.associate(db);
Pick.associate(db);
Season.associate(db);

export {db, sequelize}