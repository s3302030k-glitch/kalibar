import cabinSmall from "@/assets/cabin-small.jpg";
import cabinLarge from "@/assets/cabin-large.jpg";

export interface Cabin {
  id: number;
  nameKey: string;
  size: number;
  capacity: number;
  price: number;
  priceUSD: number;
  image: string;
  featureKeys: string[];
  available: boolean;
}

export const cabins: Cabin[] = [
  {
    id: 1,
    nameKey: "cabinData.oak",
    size: 60,
    capacity: 2,
    price: 1500000,
    priceUSD: 30,
    image: cabinSmall,
    featureKeys: ["features.doubleBed", "features.privateBathroom", "features.forestTerrace"],
    available: true,
  },
  {
    id: 2,
    nameKey: "cabinData.maple",
    size: 60,
    capacity: 2,
    price: 1500000,
    priceUSD: 30,
    image: cabinSmall,
    featureKeys: ["features.doubleBed", "features.privateBathroom", "features.mountainView"],
    available: true,
  },
  {
    id: 3,
    nameKey: "cabinData.cypress",
    size: 60,
    capacity: 3,
    price: 1600000,
    priceUSD: 32,
    image: cabinSmall,
    featureKeys: ["features.doublePlusSingle", "features.privateBathroom", "features.smallKitchen"],
    available: false,
  },
  {
    id: 4,
    nameKey: "cabinData.elm",
    size: 60,
    capacity: 2,
    price: 1500000,
    priceUSD: 30,
    image: cabinSmall,
    featureKeys: ["features.doubleBed", "features.privateBathroom", "features.fireplace"],
    available: true,
  },
  {
    id: 5,
    nameKey: "cabinData.walnut",
    size: 60,
    capacity: 3,
    price: 1600000,
    priceUSD: 32,
    image: cabinSmall,
    featureKeys: ["features.doublePlusSingle", "features.privateBathroom", "features.largeTerrace"],
    available: true,
  },
  {
    id: 6,
    nameKey: "cabinData.juniper",
    size: 60,
    capacity: 2,
    price: 1500000,
    priceUSD: 30,
    image: cabinSmall,
    featureKeys: ["features.doubleBed", "features.privateBathroom", "features.bbq"],
    available: true,
  },
  {
    id: 7,
    nameKey: "cabinData.pineVilla",
    size: 110,
    capacity: 5,
    price: 2800000,
    priceUSD: 56,
    image: cabinLarge,
    featureKeys: ["features.twoBedrooms", "features.fullKitchen", "features.largeLounge", "features.forestTerrace"],
    available: true,
  },
  {
    id: 8,
    nameKey: "cabinData.poplarVilla",
    size: 110,
    capacity: 6,
    price: 3000000,
    priceUSD: 60,
    image: cabinLarge,
    featureKeys: ["features.twoBedrooms", "features.fullKitchen", "features.fireplace", "features.jacuzzi"],
    available: true,
  },
  {
    id: 9,
    nameKey: "cabinData.beechVilla",
    size: 110,
    capacity: 5,
    price: 2800000,
    priceUSD: 56,
    image: cabinLarge,
    featureKeys: ["features.twoBedrooms", "features.fullKitchen", "features.bbq", "features.parking"],
    available: false,
  },
  {
    id: 10,
    nameKey: "cabinData.alderVilla",
    size: 110,
    capacity: 6,
    price: 3200000,
    priceUSD: 64,
    image: cabinLarge,
    featureKeys: ["features.threeBedrooms", "features.fullKitchen", "features.largeLounge", "features.privateGarden"],
    available: true,
  },
];
