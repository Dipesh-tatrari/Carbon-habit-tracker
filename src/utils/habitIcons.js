/**
 * habitIcons.js
 * --------------
 * Maps habit categories/types to lucide-react icons and display units.
 * Centralized here so Dashboard, LogHabit, and Insights all render the
 * same icon for the same habit type.
 */

import { Car, Bus, TrainFront, Bike, Footprints, Beef, Drumstick, Salad, Sprout, Zap, Leaf } from "lucide-react";

const TRANSPORT_ICONS = {
  car: Car,
  bus: Bus,
  train: TrainFront,
  bicycle: Bike,
  walk: Footprints,
};

const FOOD_ICONS = {
  beef: Beef,
  chicken: Drumstick,
  vegetarian: Salad,
  vegan: Sprout,
};

/** Returns the lucide icon component for a given category/type. */
export function habitIcon(category, type) {
  if (category === "transport") return TRANSPORT_ICONS[type] || Car;
  if (category === "food") return FOOD_ICONS[type] || Salad;
  if (category === "electricity") return Zap;
  return Leaf;
}

/** Returns the display unit for a category (km, meal(s), kWh). */
export function unitFor(category) {
  if (category === "transport") return "km";
  if (category === "food") return "meal(s)";
  if (category === "electricity") return "kWh";
  return "";
}
