/** Rotating leadership quotes rendered in footer and empty states (Slovenian). */
export const QUOTES: string[] = [
  "Disciplina je izbira med tem, kar si želiš zdaj, in tem, kar si želiš najbolj.",
  "Voditelj svojega življenja si takrat, ko nehaš čakati na popoln trenutek.",
  "Reci 'in' namesto 'ampak' in spremenil boš svojo zgodbo.",
  "Majhna dnevna dejanja gradijo velike voditelje.",
  "Tvoja energija ustvarja tvojo resničnost.",
  "Doslednost premaga intenzivnost vsakič znova.",
  "Ne čakaj na motivacijo. Ustvari jo z izvedbo.",
  "Najtežji boj je tisti med tem, kdo si, in tem, kdo lahko postaneš.",
  "Vsak dan je nov krog. Vstopi vanj kot voditelj.",
  "Tvoji cilji se ne bojijo - bojijo se tvoje doslednosti.",
  "Resnica do sebe je prvi korak vodenja.",
  "Fokus je supermoč v svetu motenj.",
  "Padel si v Drift? Dobro. Zdaj pokaži, kako se vrneš v Flow.",
  "Hvaležnost spremeni to, kar imaš, v dovolj.",
  "Veliki ljudje gradijo navade, ki jih manjši ljudje opustijo.",
];

export function quoteForIndex(i: number): string {
  return QUOTES[i % QUOTES.length];
}
