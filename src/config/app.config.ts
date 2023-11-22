const tripleModes = [
  'gemGrab',
  'brawlBall',
  'bounty',
  'heist',
  'hotZone',
  'knockout',
  'basketBrawl',
  'volleyBrawl',
  'wipeout',
  'payload',
  'siege',
  'presentPlunder',
  'holdTheTrophy',
  'botDrop',
  'snowtelThieves',
];
const soloModes = {
  battle: ['duel'],
  survive: ['soloShowdown', 'takedown', 'loneStar', 'hunters'],
};
const duoModes = ['duoShowdown'];

export default () => ({
  axios: {
    baseURL: `https://api.brawlstars.com/v1`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.API_KEY,
    },
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  game: {
    modeClass: {
      tripleModes: tripleModes,
      soloModes: soloModes,
      duoModes: duoModes,
    },
    typeList: [0, 2, 3, 4, 5, 6],
    modeList: [
      ...tripleModes,
      ...soloModes.battle,
      ...soloModes.survive,
      ...duoModes,
    ],
  },
  database: {
    type: 'mysql' as const,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    timezone: process.env.DATABASE_TIMEZONE,
    entities: ['dist/**/**/*.entity.{ts,js}'],
    synchronize: false,
  },
});
