import Sequelize from "sequelize";
import Member from "./member.js";
import MemberBrawler from "./member_brawler.js";
import Brawler from "./brawler.js";
import Battle from "./battle.js";
import Friend from "./friend.js";
import Record from "./record.js";
import Map from "./map.js";
import MapRotation from "./map_rotation.js";
import Pick from "./pick.js";
import Season from "./season.js";

import Config from "../config/config.js";
import SeasonSummary from "./season_summary.js";

const config =
    Config.sequelize;
const db = {}

const sequelize =
    new Sequelize(config.database, config.username, config.password, config);
db.sequelize = sequelize;

db.Member = Member;
db.MemberBrawler = MemberBrawler;
db.Brawler = Brawler;
db.Battle = Battle;
db.Friend = Friend;
db.Record = Record;
db.Map = Map;
db.MapRotation = MapRotation;
db.Pick = Pick;
db.Season = Season;
db.SeasonSummary = SeasonSummary;

Battle.init(sequelize);
Member.init(sequelize);
MemberBrawler.init(sequelize);
Brawler.init(sequelize);
Friend.init(sequelize);
Record.init(sequelize);
Map.init(sequelize);
MapRotation.init(sequelize);
Pick.init(sequelize);
Season.init(sequelize);
SeasonSummary.init(sequelize);

Battle.associate(db);
Member.associate(db);
MemberBrawler.associate(db);
Brawler.associate(db);
Friend.associate(db);
Record.associate(db);
Map.associate(db);
MapRotation.associate(db);
Pick.associate(db);
Season.associate(db);
SeasonSummary.associate(db);

export {db, sequelize}