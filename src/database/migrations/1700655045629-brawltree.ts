import { MigrationInterface, QueryRunner } from 'typeorm';

export class Brawltree1700655045629 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE \`seasons\`
                             (
                                 \`id\`         tinyint unsigned NOT NULL,
                                 \`begin_date\` timestamp        NOT NULL,
                                 \`end_date\`   timestamp        NOT NULL,
                                 PRIMARY KEY (\`id\`)
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`brawlers\`
                             (
                                 \`id\`          char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`name\`        varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`rarity\`      varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci          DEFAULT NULL,
                                 \`role\`        varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci          DEFAULT NULL,
                                 \`gender\`      varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci          DEFAULT NULL,
                                 \`discord_pin\` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci          DEFAULT NULL,
                                 \`created_at\`  timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 \`updated_at\`  timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 PRIMARY KEY (\`id\`)
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`brawler_items\`
                             (
                                 \`id\`         char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`brawler_id\` char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`kind\`       varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
                                 \`name\`       varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
                                 \`created_at\` timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 \`updated_at\` timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 \`deleted_at\` timestamp                                                    NULL     DEFAULT NULL,
                                 PRIMARY KEY (\`id\`, \`brawler_id\`),
                                 KEY \`brawler_items_brawler_id_idx\` (\`brawler_id\`) USING BTREE,
                                 KEY \`brawler_items_kind_idx\` (\`kind\`) USING BTREE,
                                 CONSTRAINT \`brawler_items_fk1\` FOREIGN KEY (\`brawler_id\`) REFERENCES \`brawlers\` (\`id\`) ON DELETE CASCADE
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`maps\`
                             (
                                 \`id\`         char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`mode\`       varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`name\`       varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`created_at\` timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 \`updated_at\` timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 PRIMARY KEY (\`id\`)
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`map_rotation\`
                             (
                                 \`map_id\`           char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`is_trophy_league\` tinyint(1) DEFAULT NULL,
                                 \`is_power_league\`  tinyint(1) DEFAULT NULL,
                                 PRIMARY KEY (\`map_id\`)
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`events\`
                             (
                                 \`id\`         tinyint unsigned NOT NULL,
                                 \`start_time\` timestamp        NOT NULL,
                                 \`end_time\`   timestamp        NOT NULL,
                                 \`map_id\`     char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     DEFAULT NULL,
                                 \`modifiers\`  varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
                                 PRIMARY KEY (\`id\`, \`start_time\`),
                                 KEY \`events_fk1\` (\`map_id\`),
                                 CONSTRAINT \`events_fk1\` FOREIGN KEY (\`map_id\`) REFERENCES \`maps\` (\`id\`)
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`users\`
                             (
                                 \`id\`              varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`last_battled_on\` timestamp                                                    NOT NULL,
                                 \`crew\`            varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci          DEFAULT NULL,
                                 \`crew_name\`       varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci          DEFAULT NULL,
                                 \`is_cycle\`        tinyint(1)                                                   NOT NULL DEFAULT '0',
                                 \`created_at\`      timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 \`updated_at\`      timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 \`deleted_at\`      timestamp                                                    NULL     DEFAULT NULL,
                                 PRIMARY KEY (\`id\`)
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`user_profile\`
                             (
                                 \`user_id\`                  varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`name\`                     varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`profile_icon\`             char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`club_id\`                  varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci          DEFAULT NULL,
                                 \`club_name\`                varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci          DEFAULT NULL,
                                 \`current_trophies\`         int unsigned                                                 NOT NULL,
                                 \`highest_trophies\`         int unsigned                                                 NOT NULL,
                                 \`trio_match_victories\`     int unsigned                                                 NOT NULL,
                                 \`duo_match_victories\`      int unsigned                                                 NOT NULL,
                                 \`solo_match_victories\`     int unsigned                                                 NOT NULL,
                                 \`brawler_rank_25\`          tinyint unsigned                                                      DEFAULT '0',
                                 \`brawler_rank_30\`          tinyint unsigned                                                      DEFAULT '0',
                                 \`brawler_rank_35\`          tinyint unsigned                                                      DEFAULT '0',
                                 \`current_solo_league_rank\` tinyint                                                               DEFAULT '0',
                                 \`highest_solo_league_rank\` tinyint                                                               DEFAULT '0',
                                 \`current_team_league_rank\` tinyint                                                               DEFAULT '0',
                                 \`highest_team_league_rank\` tinyint                                                               DEFAULT '0',
                                 \`created_at\`               timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 \`updated_at\`               timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 \`deleted_at\`               timestamp                                                    NULL     DEFAULT NULL,
                                 PRIMARY KEY (\`user_id\`),
                                 CONSTRAINT \`user_profile_fk1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`user_battles\`
                             (
                                 \`user_id\`             varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`player_id\`           varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`brawler_id\`          char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`battle_time\`         timestamp                                                    NOT NULL,
                                 \`map_id\`              char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`mode_code\`           tinyint                                                      NOT NULL,
                                 \`match_type\`          tinyint                                                      NOT NULL,
                                 \`match_grade\`         tinyint                                                      NOT NULL,
                                 \`duration\`            tinyint unsigned                                                      DEFAULT NULL,
                                 \`game_rank\`           tinyint                                                               DEFAULT NULL,
                                 \`game_result\`         tinyint                                                      NOT NULL,
                                 \`trophy_change\`       tinyint                                                      NOT NULL,
                                 \`duels_trophy_change\` tinyint                                                      NOT NULL,
                                 \`player_name\`         varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`team_number\`         tinyint                                                      NOT NULL,
                                 \`is_star_player\`      tinyint(1)                                                            DEFAULT NULL,
                                 \`brawler_power\`       tinyint                                                      NOT NULL,
                                 \`brawler_trophies\`    smallint                                                     NOT NULL,
                                 \`created_at\`          timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 \`updated_at\`          timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 PRIMARY KEY (\`user_id\`, \`player_id\`, \`brawler_id\`, \`battle_time\`),
                                 KEY \`user_battles_brawler_id_idx\` (\`brawler_id\`) USING BTREE,
                                 KEY \`user_battles_battle_time_idx\` (\`battle_time\` DESC),
                                 KEY \`user_battles_match_type_idx\` (\`match_type\`) USING BTREE,
                                 KEY \`user_battles_map_id_idx\` (\`map_id\`) USING BTREE,
                                 KEY \`user_battles_brawler_trophy_begin_idx\` (\`brawler_id\`, \`battle_time\`) USING BTREE,
                                 KEY \`user_battles_battle_trio_idx\` (\`battle_time\` DESC, \`team_number\`) USING BTREE,
                                 CONSTRAINT \`user_battles_fk1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT,
                                 CONSTRAINT \`user_battles_fk2\` FOREIGN KEY (\`brawler_id\`) REFERENCES \`brawlers\` (\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`user_brawlers\`
                             (
                                 \`user_id\`          varchar(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`brawler_id\`       char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`brawler_power\`    tinyint                                                      NOT NULL,
                                 \`begin_trophies\`   smallint                                                              DEFAULT NULL,
                                 \`current_trophies\` smallint                                                     NOT NULL,
                                 \`highest_trophies\` smallint                                                     NOT NULL,
                                 \`brawler_rank\`     tinyint unsigned                                             NOT NULL,
                                 \`created_at\`       timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 \`updated_at\`       timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 PRIMARY KEY (\`user_id\`, \`brawler_id\`),
                                 CONSTRAINT \`user_brawlers_fk1\` FOREIGN KEY (\`user_id\`) REFERENCES \`user_profile\` (\`user_id\`) ON DELETE CASCADE
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`user_brawler_battles\`
                             (
                                 \`user_id\`         varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`brawler_id\`      char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`map_id\`          char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`match_type\`      tinyint                                                      NOT NULL,
                                 \`match_grade\`     tinyint                                                      NOT NULL,
                                 \`match_count\`     int unsigned                                                 NOT NULL DEFAULT '0',
                                 \`victories_count\` int unsigned                                                 NOT NULL DEFAULT '0',
                                 \`defeats_count\`   int unsigned                                                 NOT NULL DEFAULT '0',
                                 \`created_at\`      timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 \`updated_at\`      timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 PRIMARY KEY (\`user_id\`, \`brawler_id\`, \`map_id\`, \`match_type\`, \`match_grade\`),
                                 KEY \`user_brawler_battles_fk1\` (\`brawler_id\`),
                                 KEY \`user_brawler_battles_fk2\` (\`map_id\`),
                                 CONSTRAINT \`user_brawler_battles_fk1\` FOREIGN KEY (\`brawler_id\`) REFERENCES \`brawlers\` (\`id\`) ON DELETE CASCADE,
                                 CONSTRAINT \`user_brawler_battles_fk2\` FOREIGN KEY (\`map_id\`) REFERENCES \`maps\` (\`id\`) ON DELETE CASCADE
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`user_brawler_items\`
                             (
                                 \`user_id\`    varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`brawler_id\` char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`item_id\`    char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`created_at\` timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 \`updated_at\` timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 PRIMARY KEY (\`user_id\`, \`brawler_id\`, \`item_id\`),
                                 KEY \`user_brawler_items_fk1\` (\`brawler_id\`),
                                 KEY \`user_brawler_items_fk2\` (\`item_id\`, \`brawler_id\`),
                                 CONSTRAINT \`user_brawler_items_fk1\` FOREIGN KEY (\`brawler_id\`) REFERENCES \`brawlers\` (\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT,
                                 CONSTRAINT \`user_brawler_items_fk2\` FOREIGN KEY (\`item_id\`, \`brawler_id\`) REFERENCES \`brawler_items\` (\`id\`, \`brawler_id\`) ON DELETE CASCADE
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`battle_stats\`
                             (
                                 \`map_id\`          char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`brawler_id\`      char(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci     NOT NULL,
                                 \`match_type\`      tinyint                                                      NOT NULL,
                                 \`match_grade\`     tinyint                                                      NOT NULL,
                                 \`mode_name\`       varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`match_count\`     int unsigned                                                 NOT NULL DEFAULT '0',
                                 \`victories_count\` int unsigned                                                 NOT NULL DEFAULT '0',
                                 \`defeats_count\`   int unsigned                                                 NOT NULL DEFAULT '0',
                                 \`created_at\`      timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 \`updated_at\`      timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 PRIMARY KEY (\`map_id\`, \`brawler_id\`, \`match_type\`, \`match_grade\`),
                                 KEY \`battle_stats_fk1\` (\`brawler_id\`),
                                 CONSTRAINT \`battle_stats_fk1\` FOREIGN KEY (\`brawler_id\`) REFERENCES \`brawlers\` (\`id\`) ON DELETE CASCADE
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`user_friends\`
                             (
                                 \`user_id\`         varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`friend_id\`       varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`match_type\`      tinyint                                                      NOT NULL,
                                 \`match_grade\`     tinyint                                                      NOT NULL,
                                 \`mode_name\`       varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`friend_name\`     varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`match_count\`     int unsigned                                                 NOT NULL DEFAULT '0',
                                 \`victories_count\` int unsigned                                                 NOT NULL DEFAULT '0',
                                 \`defeats_count\`   int unsigned                                                 NOT NULL DEFAULT '0',
                                 \`friend_point\`    float                                                        NOT NULL DEFAULT '0',
                                 \`created_at\`      timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 \`updated_at\`      timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 PRIMARY KEY (\`user_id\`, \`friend_id\`, \`match_type\`, \`match_grade\`,
                                              \`mode_name\`),
                                 KEY \`FRIEND_ID\` (\`friend_id\`),
                                 CONSTRAINT \`user_friends_fk1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);

    await queryRunner.query(`CREATE TABLE \`user_records\`
                             (
                                 \`user_id\`         varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`match_type\`      tinyint                                                      NOT NULL,
                                 \`match_grade\`     tinyint                                                      NOT NULL,
                                 \`mode_name\`       varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                                 \`trophy_change\`   int                                                                   DEFAULT '0',
                                 \`match_count\`     int unsigned                                                          DEFAULT '0',
                                 \`victories_count\` int unsigned                                                          DEFAULT '0',
                                 \`defeats_count\`   int unsigned                                                          DEFAULT '0',
                                 \`created_at\`      timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                 \`updated_at\`      timestamp                                                    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                 PRIMARY KEY (\`user_id\`, \`match_type\`, \`match_grade\`, \`mode_name\`),
                                 CONSTRAINT \`user_records_fk1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
                             ) ENGINE = InnoDB
                               DEFAULT CHARSET = utf8mb4
                               COLLATE = utf8mb4_unicode_ci;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`user_records\`;`);
    await queryRunner.query(`DROP TABLE \`user_friends\`;`);
    await queryRunner.query(`DROP TABLE \`battle_stats\`;`);
    await queryRunner.query(`DROP TABLE \`user_brawler_items\`;`);
    await queryRunner.query(`DROP TABLE \`user_brawler_battles\`;`);
    await queryRunner.query(`DROP TABLE \`user_brawlers\`;`);
    await queryRunner.query(`DROP TABLE \`user_battles\`;`);
    await queryRunner.query(`DROP TABLE \`user_profile\`;`);
    await queryRunner.query(`DROP TABLE \`users\`;`);
    await queryRunner.query(`DROP TABLE \`events\`;`);
    await queryRunner.query(`DROP TABLE \`map_rotation\`;`);
    await queryRunner.query(`DROP TABLE \`maps\`;`);
    await queryRunner.query(`DROP TABLE \`brawler_items\`;`);
    await queryRunner.query(`DROP TABLE \`brawlers\`;`);
    await queryRunner.query(`DROP TABLE \`seasons\`;`);
  }
}
