/** Life pillars for "Mapa Življenja". Schema in English, labels in Slovenian. */

export interface PillarMetricDef {
  key: string;
  label: string;
  hint: string;
}

export interface PillarDef {
  id: string;
  title: string;
  subtitle: string;
  metrics: PillarMetricDef[];
}

export const PILLARS: PillarDef[] = [
  {
    id: "health",
    title: "ZDRAVJE IN DOBRO POČUTJE",
    subtitle: "Telo in um kot temelj vodenja",
    metrics: [
      { key: "sleep", label: "Spanje", hint: "Kakovost in ure spanca" },
      { key: "nutrition", label: "Hrana", hint: "Kakovost prehrane" },
      { key: "hydration", label: "Voda", hint: "Hidracija čez dan" },
      { key: "movement", label: "Gibanje", hint: "Telesna aktivnost" },
      {
        key: "mind_control",
        label: "Kontrola Uma",
        hint: "Wim Hof / hvaležnost / dihanje",
      },
    ],
  },
  {
    id: "relationships",
    title: "ODNOSI",
    subtitle: "Povezanost z ljudmi okoli sebe",
    metrics: [
      { key: "self", label: "Do sebe", hint: "Odnos do samega sebe" },
      { key: "family", label: "Družina", hint: "Čas in povezanost z družino" },
      { key: "friends", label: "Prijatelji", hint: "Kakovost prijateljstev" },
      { key: "romantic", label: "Romantični", hint: "Romantični odnosi" },
    ],
  },
  {
    id: "finance_career",
    title: "FINANCE IN KARIERA",
    subtitle: "Denar, vrednost in poklicna rast",
    metrics: [
      { key: "money_in", label: "Prilivi", hint: "Vir dohodka / žepnina" },
      { key: "money_out", label: "Odlivi", hint: "Poraba in stroški" },
      { key: "savings", label: "Prihranki", hint: "Kje hranim denar" },
      {
        key: "career_growth",
        label: "Karierna rast",
        hint: "Napredek v šoli, delu ali projektih",
      },
      {
        key: "skills",
        label: "Veščine",
        hint: "Kaj gradiš kot voditelj",
      },
      {
        key: "network",
        label: "Mreža",
        hint: "Povezave, mentorji, priložnosti",
      },
    ],
  },
  {
    id: "time",
    title: "ČAS",
    subtitle: "24h/dan razporeditev",
    metrics: [
      { key: "allocation_24h", label: "24h/dan", hint: "Razporeditev dneva" },
      {
        key: "solitude",
        label: "Umik",
        hint: "Samota / fleksibilnost / fokus",
      },
    ],
  },
];
