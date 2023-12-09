export type BrawlerType = {
  id: string;
  name: string;
  starPowers: BrawlerItemType[];
  gadgets: BrawlerItemType[];
};

export type BrawlerItemType = {
  id: string;
  name: string;
};
