/**
 * "What is this day?" notes for the occasion pages in the Gift Calendar app (/app/occasion/$slug).
 * Short, plain and respectful, so a customer can decide whether to mark the day.
 * Occasions without an entry fall back to their line and note in src/data/occasions.ts.
 */
export interface OccasionAbout {
  /** Two or three short paragraphs about the day. */
  about: string[];
  /** How people in Nigeria usually mark it. */
  marked?: string;
  /** A thoughtful gift idea for the day. */
  idea?: string;
}

export const OCCASION_ABOUT: Record<string, OccasionAbout> = {
  "new-year": {
    about: [
      "New Year's Day, 1 January, opens the calendar year. It is a public holiday across Nigeria.",
      "Many families start the day at a crossover service or a quiet prayer, then visit relatives and share a meal.",
    ],
    marked:
      "Church crossover services, family visits, small parties and New Year greetings to friends and clients.",
    idea: "A fresh-start box: a good journal, something sweet and a handwritten note with a wish for the year.",
  },
  "eid-al-fitr": {
    about: [
      "Eid-el-Fitr marks the end of Ramadan, the month of fasting. Nigeria gives two days of public holiday for it.",
      "The date follows the Islamic lunar calendar and is confirmed when the new moon is sighted, so it moves about 11 days earlier each year.",
    ],
    marked:
      "Eid prayers in the morning, new clothes, visits to family and neighbours, and food shared with those in need.",
    idea: "A generous food and treats box for the family table. Keep it alcohol-free.",
  },
  "good-friday": {
    about: [
      "Good Friday remembers the crucifixion of Jesus. It is the Friday before Easter Sunday and a public holiday in Nigeria.",
      "It is a solemn day for Christians, often with church services and quiet reflection.",
    ],
    marked: "Church services and a quieter day at home. Gifts are usually saved for Easter Sunday.",
    idea: "Order Easter boxes now so they arrive in time for Sunday.",
  },
  "easter-monday": {
    about: [
      "Easter Monday is the day after Easter Sunday, which celebrates the resurrection of Jesus. It is a public holiday in Nigeria.",
      "It rounds off the Easter weekend and is a popular day for outings and family time.",
    ],
    marked: "Picnics, beach trips, family visits and Easter treats.",
    idea: "A sharing box for an Easter Monday outing or visit.",
  },
  "workers-day": {
    about: [
      "Workers' Day, 1 May, honours working people and the labour movement. It is a public holiday in Nigeria.",
      "Unions hold rallies, and many employers use the day to thank their teams.",
    ],
    marked: "Labour rallies, a day off work and staff appreciation.",
    idea: "Staff appreciation boxes delivered the day before, with a thank-you card from the leadership.",
  },
  "eid-al-adha": {
    about: [
      "Eid-el-Kabir (Eid al-Adha) is the Festival of Sacrifice. It remembers Prophet Ibrahim's willingness to obey God, and comes after the Hajj pilgrimage.",
      "Nigeria gives two days of public holiday. The date follows the lunar calendar and is confirmed nearer the time.",
    ],
    marked:
      "Eid prayers, the sacrifice of a ram, and meat and food shared with family, friends and the poor.",
    idea: "A festive food box for the family, alcohol-free, delivered before the holiday.",
  },
  "democracy-day": {
    about: [
      "Democracy Day, 12 June, celebrates Nigeria's return to democracy. It recalls the 12 June 1993 election, widely seen as one of the country's freest.",
      "It has been a public holiday on 12 June since 2019 (it was 29 May before that).",
    ],
    marked: "A national broadcast, civic events and a day off for most workers.",
    idea: "A thank-you box for colleagues or clients before the long weekend.",
  },
  "eid-el-maulud": {
    about: [
      "Eid-el-Maulud (Mawlid) celebrates the birth of the Prophet Muhammad. It is a public holiday in Nigeria.",
      "The date follows the Islamic lunar calendar, so it changes each year and is confirmed nearer the time.",
    ],
    marked: "Prayers, lectures, processions in some places and gatherings with family and friends.",
    idea: "A sweet sharing box for family and neighbours, alcohol-free.",
  },
  "independence-day": {
    about: [
      "Independence Day, 1 October, marks Nigeria's independence from Britain in 1960. It is a national public holiday.",
      "It is a day of national pride, with a presidential broadcast and celebrations across the country.",
    ],
    marked: "Parades, green-white-green outfits, national broadcasts and gatherings with friends.",
    idea: "A proudly Nigerian box with locally made treats for your team or clients.",
  },
  "christmas-day": {
    about: [
      "Christmas Day, 25 December, celebrates the birth of Jesus. It is a public holiday in Nigeria and one of the biggest gifting days of the year.",
      "Many people travel home to be with family, so deliveries need planning early.",
    ],
    marked:
      "Church services, family feasts, visits and gifts for family, friends, staff and clients.",
    idea: "Order early: Christmas is the busiest delivery week of the year. Hampers for clients, boxes for family.",
  },
  "boxing-day": {
    about: [
      "Boxing Day, 26 December, is the day after Christmas and a public holiday in Nigeria.",
      "Its name comes from the custom of giving gifts, or 'Christmas boxes', to helpers and staff.",
    ],
    marked:
      "Rest, visits, outings and thanking the people who help you all year: drivers, house staff, security.",
    idea: "Small thank-you boxes for the people who make your year easier.",
  },
};
