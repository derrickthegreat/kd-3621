export type Slot =
    | "Helmet"
    | "Chest"
    | "Weapon"
    | "Gloves"
    | "Legs"
    | "Boots"
    | "Accessory1"
    | "Accessory2";

export type Equipment = {
    name: string;
    slot: string;
    rarity: string;
    src: string;
    type: string;
    alt: string;
    attributes: {
        stat: string;
        value: number;
    }[];
    materials: {
        material: string;
        value: number;
    }[];
};
