export type UserResponseType = {
  club: {
    tag: string;
    name: string;
  };
  isQualifiedFromChampionshipChallenge: boolean;
  '3vs3Victories': number;
  icon: {
    id: string;
  };
  tag: string;
  name: string;
  trophies: number;
  expLevel: number;
  expPoints: number;
  highestTrophies: number;
  powerPlayPoints: number;
  highestPowerPlayPoints: number;
  soloVictories: number;
  duoVictories: number;
  bestRoboRumbleTime: number;
  bestTimeAsBigBrawler: number;
  brawlers: [
    {
      id: string;
      rank: number;
      trophies: number;
      highestTrophies: number;
      power: number;
      gadgets: [
        {
          name: string;
          id: string;
        },
      ];
      starPowers: [
        {
          name: string;
          id: string;
        },
      ];
      gears: [
        {
          name: string;
          id: string;
        },
      ];
    },
  ];
};
