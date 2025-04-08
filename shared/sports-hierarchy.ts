import { z } from "zod";

// Типы для иерархии спортивных событий
export type Country = {
  id: number;
  name: string;
  code: string; // ISO код страны
  flag: string; // URL флага
};

export type League = {
  id: number;
  name: string;
  countryId: number;
  sportId: number;
  logo: string;
  type: "league" | "cup" | "tournament" | "friendly";
  tier: number; // 1 = высший дивизион и т.д.
  isPopular: boolean;
  displayOrder: number;
  seasonYear: string; // Например "2024-2025"
};

export type Team = {
  id: number;
  name: string;
  shortName?: string;
  logo?: string; 
  countryId: number;
  leagueId?: number; // Опционально для национальных команд
  yearFounded?: number;
  stadiumName?: string;
  stadiumCapacity?: number;
};

// Схемы валидации
export const CountrySchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  flag: z.string().optional(),
});

export const LeagueSchema = z.object({
  id: z.number(),
  name: z.string(),
  countryId: z.number(),
  sportId: z.number(),
  logo: z.string().optional(),
  type: z.enum(["league", "cup", "tournament", "friendly"]).default("league"),
  tier: z.number().default(1),
  isPopular: z.boolean().default(false),
  displayOrder: z.number().default(0),
  seasonYear: z.string().optional(),
});

export const TeamSchema = z.object({
  id: z.number(),
  name: z.string(),
  shortName: z.string().optional(),
  logo: z.string().optional(),
  countryId: z.number(),
  leagueId: z.number().optional(),
  yearFounded: z.number().optional(),
  stadiumName: z.string().optional(),
  stadiumCapacity: z.number().optional(),
});

// Статическая структура иерархии для основных видов спорта и лиг
export const SportsHierarchy = {
  // Футбол
  football: {
    id: 1,
    name: "Футбол",
    icon: "sports_soccer",
    displayOrder: 1,
    isPopular: true,
    countries: [
      // Англия
      {
        id: 1,
        name: "Англия",
        code: "GB",
        flag: "https://flagcdn.com/gb.svg",
        leagues: [
          {
            id: 1,
            name: "Премьер-лига",
            logo: "https://assets.epl.com/dist/images/logo.png",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024-2025"
          },
          {
            id: 2,
            name: "Чемпионшип",
            logo: "https://www.efl.com/assets/svg/championship.svg",
            type: "league",
            tier: 2,
            isPopular: false,
            displayOrder: 2,
            seasonYear: "2024-2025"
          },
          {
            id: 3,
            name: "FA Cup",
            logo: "https://www.thefa.com/assets/svg/facup.svg",
            type: "cup",
            tier: 1,
            isPopular: true,
            displayOrder: 3,
            seasonYear: "2024-2025"
          }
        ]
      },
      // Испания
      {
        id: 2,
        name: "Испания",
        code: "ES",
        flag: "https://flagcdn.com/es.svg",
        leagues: [
          {
            id: 4,
            name: "La Liga",
            logo: "https://assets.laliga.com/assets/logos/laliga.png",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024-2025"
          },
          {
            id: 5,
            name: "La Liga 2",
            logo: "https://assets.laliga.com/assets/logos/laliga2.png",
            type: "league",
            tier: 2,
            isPopular: false,
            displayOrder: 2,
            seasonYear: "2024-2025"
          },
          {
            id: 6,
            name: "Copa del Rey",
            logo: "https://rfef.es/sites/default/files/logo-copa-del-rey.png",
            type: "cup",
            tier: 1,
            isPopular: true,
            displayOrder: 3,
            seasonYear: "2024-2025"
          }
        ]
      },
      // Италия
      {
        id: 3,
        name: "Италия",
        code: "IT",
        flag: "https://flagcdn.com/it.svg",
        leagues: [
          {
            id: 7,
            name: "Serie A",
            logo: "https://assets.legaseriea.it/assets/legaseriea_logo.png",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024-2025"
          },
          {
            id: 8,
            name: "Serie B",
            logo: "https://assets.legaserieb.it/assets/legaserieb_logo.png",
            type: "league",
            tier: 2,
            isPopular: false,
            displayOrder: 2,
            seasonYear: "2024-2025"
          },
          {
            id: 9,
            name: "Coppa Italia",
            logo: "https://i.imgur.com/TtOZKWd.png",
            type: "cup",
            tier: 1,
            isPopular: true,
            displayOrder: 3,
            seasonYear: "2024-2025"
          }
        ]
      },
      // Германия
      {
        id: 4,
        name: "Германия",
        code: "DE",
        flag: "https://flagcdn.com/de.svg",
        leagues: [
          {
            id: 10,
            name: "Bundesliga",
            logo: "https://bundesliga.com/assets/logo.png",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024-2025"
          },
          {
            id: 11,
            name: "2. Bundesliga",
            logo: "https://bundesliga.com/assets/2bundesliga.png",
            type: "league",
            tier: 2,
            isPopular: false,
            displayOrder: 2,
            seasonYear: "2024-2025"
          },
          {
            id: 12,
            name: "DFB-Pokal",
            logo: "https://dfb.de/fileadmin/_processed_/201808/csm_105508-pokal_90a4e59c3d.png",
            type: "cup",
            tier: 1,
            isPopular: true,
            displayOrder: 3,
            seasonYear: "2024-2025"
          }
        ]
      },
      // Франция
      {
        id: 5,
        name: "Франция",
        code: "FR",
        flag: "https://flagcdn.com/fr.svg",
        leagues: [
          {
            id: 13,
            name: "Ligue 1",
            logo: "https://assets.ligue1.fr/ligue1/img/logos/ligue1.png",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024-2025"
          },
          {
            id: 14,
            name: "Ligue 2",
            logo: "https://assets.ligue1.fr/ligue2/img/logos/ligue2.png",
            type: "league",
            tier: 2,
            isPopular: false,
            displayOrder: 2,
            seasonYear: "2024-2025"
          },
          {
            id: 15,
            name: "Coupe de France",
            logo: "https://www.fff.fr/assets/logo-coupe-france.png",
            type: "cup",
            tier: 1,
            isPopular: true,
            displayOrder: 3,
            seasonYear: "2024-2025"
          }
        ]
      },
      // Международные
      {
        id: 6,
        name: "Международные",
        code: "INT",
        flag: "https://flagcdn.com/eu.svg",
        leagues: [
          {
            id: 16,
            name: "UEFA Champions League",
            logo: "https://img.uefa.com/imgml/uefacom/ucl/social/og-default.jpg",
            type: "tournament",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024-2025"
          },
          {
            id: 17,
            name: "UEFA Europa League",
            logo: "https://img.uefa.com/imgml/uefacom/uel/social/og-default.jpg",
            type: "tournament",
            tier: 2,
            isPopular: true,
            displayOrder: 2,
            seasonYear: "2024-2025"
          },
          {
            id: 18,
            name: "FIFA World Cup",
            logo: "https://digitalhub.fifa.com/transform/3a170b69-b0b5-4d0c-bca0-85880a60ea1a/World-Cup-logo-landscape-on-dark?io=transform:fill&quality=75",
            type: "tournament",
            tier: 1,
            isPopular: true,
            displayOrder: 3,
            seasonYear: "2026"
          }
        ]
      }
    ]
  },
  // Баскетбол
  basketball: {
    id: 2,
    name: "Баскетбол",
    icon: "sports_basketball",
    displayOrder: 2,
    isPopular: true,
    countries: [
      // США
      {
        id: 7,
        name: "США",
        code: "US",
        flag: "https://flagcdn.com/us.svg",
        leagues: [
          {
            id: 19,
            name: "NBA",
            logo: "https://cdn.nba.com/logos/nba/nba-logoman-75-word_white.svg",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024-2025"
          },
          {
            id: 20,
            name: "NCAA",
            logo: "https://www.ncaa.org/assets/ncaa-logo.png",
            type: "league",
            tier: 2,
            isPopular: true,
            displayOrder: 2,
            seasonYear: "2024-2025"
          }
        ]
      },
      // Европа
      {
        id: 8,
        name: "Европа",
        code: "EU",
        flag: "https://flagcdn.com/eu.svg",
        leagues: [
          {
            id: 21,
            name: "EuroLeague",
            logo: "https://assets.euroleague.net/assets/euroleague-logo.png",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024-2025"
          },
          {
            id: 22,
            name: "EuroCup",
            logo: "https://assets.euroleague.net/assets/eurocup-logo.png",
            type: "league",
            tier: 2,
            isPopular: false,
            displayOrder: 2,
            seasonYear: "2024-2025"
          }
        ]
      }
    ]
  },
  // Теннис
  tennis: {
    id: 3,
    name: "Теннис",
    icon: "sports_tennis",
    displayOrder: 3,
    isPopular: true,
    countries: [
      // Международные
      {
        id: 9,
        name: "Международные",
        code: "INT",
        flag: "https://flagcdn.com/eu.svg",
        leagues: [
          {
            id: 23,
            name: "Grand Slam",
            logo: "https://www.atptour.com/-/media/images/atp-tour-logo.png",
            type: "tournament",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024"
          },
          {
            id: 24,
            name: "ATP Tour",
            logo: "https://www.atptour.com/-/media/images/atp-tour-logo.png",
            type: "tournament",
            tier: 1,
            isPopular: true,
            displayOrder: 2,
            seasonYear: "2024"
          },
          {
            id: 25,
            name: "WTA Tour",
            logo: "https://www.wtatennis.com/assets/images/wta-logo.png",
            type: "tournament",
            tier: 1,
            isPopular: true,
            displayOrder: 3,
            seasonYear: "2024"
          }
        ]
      }
    ]
  },
  // Хоккей
  hockey: {
    id: 4,
    name: "Хоккей",
    icon: "sports_hockey",
    displayOrder: 4,
    isPopular: true,
    countries: [
      // США/Канада
      {
        id: 10,
        name: "США/Канада",
        code: "US",
        flag: "https://flagcdn.com/us.svg",
        leagues: [
          {
            id: 26,
            name: "NHL",
            logo: "https://www.nhl.com/assets/logo.svg",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024-2025"
          }
        ]
      },
      // Россия
      {
        id: 11,
        name: "Россия",
        code: "RU",
        flag: "https://flagcdn.com/ru.svg",
        leagues: [
          {
            id: 27,
            name: "КХЛ",
            logo: "https://www.khl.ru/assets/khl-logo.png",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024-2025"
          }
        ]
      },
      // Международные
      {
        id: 12,
        name: "Международные",
        code: "INT",
        flag: "https://flagcdn.com/eu.svg",
        leagues: [
          {
            id: 28,
            name: "IIHF World Championship",
            logo: "https://www.iihf.com/assets/iihf-logo.png",
            type: "tournament",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2025"
          }
        ]
      }
    ]
  },
  // Бокс
  boxing: {
    id: 5,
    name: "Бокс",
    icon: "sports_mma",
    displayOrder: 5,
    isPopular: true,
    countries: [
      // Международные
      {
        id: 13,
        name: "Международные",
        code: "INT",
        flag: "https://flagcdn.com/eu.svg",
        leagues: [
          {
            id: 29,
            name: "WBC",
            logo: "https://www.wbcboxing.com/assets/wbc-logo.png",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024"
          },
          {
            id: 30,
            name: "WBA",
            logo: "https://www.wbaboxing.com/assets/wba-logo.png",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 2,
            seasonYear: "2024"
          },
          {
            id: 31,
            name: "IBF",
            logo: "https://www.ibf-usba-boxing.com/assets/ibf-logo.png",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 3,
            seasonYear: "2024"
          },
          {
            id: 32,
            name: "WBO",
            logo: "https://www.wboboxing.com/assets/wbo-logo.png",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 4,
            seasonYear: "2024"
          }
        ]
      }
    ]
  },
  // MMA/UFC
  mma: {
    id: 6,
    name: "MMA",
    icon: "sports_kabaddi",
    displayOrder: 6,
    isPopular: true,
    countries: [
      // Международные
      {
        id: 14,
        name: "Международные",
        code: "INT",
        flag: "https://flagcdn.com/eu.svg",
        leagues: [
          {
            id: 33,
            name: "UFC",
            logo: "https://www.ufc.com/themes/custom/ufc/assets/img/logo.svg",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024"
          },
          {
            id: 34,
            name: "Bellator",
            logo: "https://www.bellator.com/assets/bellator-logo.png",
            type: "league",
            tier: 2,
            isPopular: false,
            displayOrder: 2,
            seasonYear: "2024"
          },
          {
            id: 35,
            name: "PFL",
            logo: "https://www.pflmma.com/assets/pfl-logo.png",
            type: "league",
            tier: 2,
            isPopular: false,
            displayOrder: 3,
            seasonYear: "2024"
          }
        ]
      }
    ]
  },
  // Американский футбол
  americanFootball: {
    id: 7,
    name: "Американский футбол",
    icon: "sports_football",
    displayOrder: 7,
    isPopular: false,
    countries: [
      // США
      {
        id: 15,
        name: "США",
        code: "US",
        flag: "https://flagcdn.com/us.svg",
        leagues: [
          {
            id: 36,
            name: "NFL",
            logo: "https://static.www.nfl.com/image/upload/v1554321393/league/nvfr7ogywskqrfaiu38m.svg",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024-2025"
          },
          {
            id: 37,
            name: "NCAA Football",
            logo: "https://www.ncaa.org/assets/ncaa-logo.png",
            type: "league",
            tier: 2,
            isPopular: false,
            displayOrder: 2,
            seasonYear: "2024-2025"
          }
        ]
      }
    ]
  },
  // Бейсбол
  baseball: {
    id: 8,
    name: "Бейсбол",
    icon: "sports_baseball",
    displayOrder: 8,
    isPopular: false,
    countries: [
      // США
      {
        id: 16,
        name: "США",
        code: "US",
        flag: "https://flagcdn.com/us.svg",
        leagues: [
          {
            id: 38,
            name: "MLB",
            logo: "https://www.mlb.com/assets/mlb-logo.svg",
            type: "league",
            tier: 1,
            isPopular: true,
            displayOrder: 1,
            seasonYear: "2024"
          }
        ]
      },
      // Япония
      {
        id: 17,
        name: "Япония",
        code: "JP",
        flag: "https://flagcdn.com/jp.svg",
        leagues: [
          {
            id: 39,
            name: "NPB",
            logo: "https://www.npb.or.jp/assets/npb-logo.png",
            type: "league",
            tier: 1,
            isPopular: false,
            displayOrder: 1,
            seasonYear: "2024"
          }
        ]
      }
    ]
  }
};

// Транслятор для преобразования плоской структуры в иерархическую
export function buildSportsHierarchy(
  sports: any[],
  countries: any[] = [],
  leagues: any[] = [],
  teams: any[] = []
) {
  const hierarchyMap = new Map();

  // Добавляем виды спорта
  sports.forEach(sport => {
    hierarchyMap.set(sport.id, {
      ...sport,
      countries: []
    });
  });

  // Добавляем страны к видам спорта
  countries.forEach(country => {
    const countriesMap = new Map();
    for (const [sportId, sport] of hierarchyMap.entries()) {
      sport.countries.push({
        ...country,
        leagues: []
      });
      countriesMap.set(country.id, sport.countries[sport.countries.length - 1]);
    }

    // Добавляем лиги к странам
    leagues.forEach(league => {
      if (league.countryId === country.id) {
        const sport = hierarchyMap.get(league.sportId);
        if (sport) {
          const country = sport.countries.find(c => c.id === league.countryId);
          if (country) {
            country.leagues.push({
              ...league,
              teams: []
            });
          }
        }
      }
    });

    // Добавляем команды к лигам
    teams.forEach(team => {
      if (team.leagueId) {
        for (const [sportId, sport] of hierarchyMap.entries()) {
          for (const country of sport.countries) {
            if (country.id === team.countryId) {
              for (const league of country.leagues) {
                if (league.id === team.leagueId) {
                  league.teams.push(team);
                }
              }
            }
          }
        }
      }
    });
  });

  return Array.from(hierarchyMap.values());
}

// Функция для получения плоского списка
export function getFlatList(type: 'sports' | 'countries' | 'leagues' | 'teams') {
  let result: any[] = [];
  
  const addSport = (sport: any) => {
    result.push({
      id: sport.id,
      name: sport.name,
      icon: sport.icon,
      displayOrder: sport.displayOrder,
      isPopular: sport.isPopular
    });
  };
  
  const addCountry = (country: any, sportId: number) => {
    result.push({
      id: country.id,
      name: country.name,
      code: country.code,
      flag: country.flag,
      sportId
    });
  };
  
  const addLeague = (league: any, countryId: number, sportId: number) => {
    result.push({
      id: league.id,
      name: league.name,
      countryId,
      sportId,
      logo: league.logo,
      type: league.type,
      tier: league.tier,
      isPopular: league.isPopular,
      displayOrder: league.displayOrder,
      seasonYear: league.seasonYear
    });
  };
  
  Object.values(SportsHierarchy).forEach(sport => {
    if (type === 'sports') {
      addSport(sport);
    }
    
    sport.countries.forEach(country => {
      if (type === 'countries') {
        addCountry(country, sport.id);
      }
      
      country.leagues.forEach(league => {
        if (type === 'leagues') {
          addLeague(league, country.id, sport.id);
        }
      });
    });
  });
  
  return result;
}

// Экспортируем плоские списки для простого доступа
// Инициализируем результаты функции getFlatList
const flatListsCache: Record<string, any[]> = {
  sports: [],
  countries: [],
  leagues: [],
  teams: []
};

// Заполняем кэш при инициализации модуля
// Спорты
for (const sport of Object.values(SportsHierarchy)) {
  flatListsCache.sports.push({
    id: sport.id,
    name: sport.name, 
    icon: sport.icon,
    displayOrder: sport.displayOrder,
    isPopular: sport.isPopular
  });
  
  // Страны для каждого спорта
  for (const country of sport.countries) {
    // Проверяем, не добавлена ли уже эта страна
    if (!flatListsCache.countries.some(c => c.id === country.id)) {
      flatListsCache.countries.push({
        id: country.id,
        name: country.name,
        code: country.code,
        flag: country.flag,
        sportId: sport.id
      });
    }
    
    // Лиги для каждой страны
    for (const league of country.leagues) {
      flatListsCache.leagues.push({
        id: league.id,
        name: league.name,
        sportId: sport.id,
        countryId: country.id,
        logo: league.logo,
        type: league.type,
        tier: league.tier,
        isPopular: league.isPopular,
        displayOrder: league.displayOrder,
        seasonYear: league.seasonYear
      });
    }
  }
}

export const Sports = flatListsCache.sports;
export const Countries = flatListsCache.countries;
export const Leagues = flatListsCache.leagues;