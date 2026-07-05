/**
 * Slovenian UI string registry.
 * Back-end logic stays in English; everything the teenager reads lives here.
 */

export const sl = {
  app: {
    name: "ZaLife DailyOS",
    version: "",
    tagline: "Voditelj svojega življenja",
  },

  auth: {
    welcome: "Dobrodošel v ZaLife Daily OS",
    welcomeSub:
      "Tvoj gamificiran kokpit vodenja. Prijavi se in prevzemi nadzor nad svojim dnem.",
    loginTab: "Prijava",
    signupTab: "Registracija",
    google: "Nadaljuj z Google",
    googleHint: "Hitra prijava z Gmail / Google računom",
    orEmail: "ali z e-pošto",
    name: "Ime in priimek",
    namePlaceholder: "Tvoje ime",
    email: "E-pošta (Gmail)",
    emailPlaceholder: "ime@gmail.com",
    password: "Geslo",
    passwordPlaceholder: "Vsaj 6 znakov",
    loginBtn: "Prijavi se",
    signupBtn: "Ustvari račun",
    haveAccount: "Že imaš račun? Prijavi se",
    noAccount: "Nimaš računa? Registriraj se",
    connecting: "Povezujem ...",
    googleNotConfigured:
      "Google prijava ni nastavljena na strežniku. V Vercel dodaj VITE_GOOGLE_CLIENT_ID in ponovno objavi (Redeploy).",
    googleInvalidClient:
      "Google OAuth klient ni najden. V Google Cloud Console dodaj produkcijski URL (npr. https://tvoja-app.vercel.app) med Authorized JavaScript origins.",
    googleDenied: "Google prijava preklicana. Poskusi znova.",
    googleFailed: "Google prijava ni uspela. Poskusi znova.",
    legal:
      "Z nadaljevanjem se strinjaš z disciplino voditelja: iskrenost, doslednost in 'IN namesto AMPAK'.",
    logout: "Odjava",
  },

  tasks: {
    title: "Naloge",
    subtitle: "Tvoj tedenski načrt izvedbe. Naloge se sinhronizirajo z Google Koledarjem.",
    executionPlan: "Načrt izvedbe",
    addPlaceholder: "Dodaj nalogo ...",
    add: "Dodaj",
    priority: "Top prioriteta (visok XP)",
    recurring: "Vsak dan",
    duration: "Trajanje",
    priorityTag: "PRIORITETA",
    dailyTag: "Vsak dan",
    empty: "Za ta dan še ni nalog. Začni z eno odločno akcijo.",
    syncedToCalendar: "Dodano v Google Koledar",
    syncDay: "Pošlji v koledar",
    syncDayDone: (n: number) => `${n} nalog sinhroniziranih v Google Koledar.`,
    syncDayNone: "Ni odprtih nalog za sinhronizacijo.",
    pullFromCalendar: "Uvozi iz koledarja",
    pullFromCalendarDone: (n: number) =>
      n > 0 ? `${n} nalog uvoženih iz Google Koledarja.` : "Koledar je že usklajen.",
    calendarReconnectNeeded: "Koledar potrebuje ponovno povezavo. Odpri Profil.",
    calendarTag: "KOLEDAR",
    top3Tag: "TOP 3",
    top3Source: "Jutranji plan",
    todayTag: "DANES",
    // Identity-driven task prefix template
    identityIntro: "Vsaka naloga izhaja iz tega, kdo si.",
    pillarSelect: "Izberi steber",
    pillarSelectPlaceholder: "— Izberi področje —",
    traitLabel: "Tvoja lastnost / identiteta",
    traitPlaceholder: "npr. discipliniran, radoveden, pogumen",
    descriptionLabel: "Opis naloge",
    prefixSemNa: "Jaz sem na področju:",
    prefixZato: "zato bom izvedel nalogo:",
    needPillar: "Izberi steber, da dodaš nalogo.",
    needTrait: "Vpiši svojo lastnost / identiteto.",
    identityIntroMapa:
      "Identiteta na področju se avtomatsko prevzame iz Mapa Življenja. Vpišeš le opis naloge in čas.",
    identityFromMapa: "Kakšen sem / postajam (iz Mapa Življenja)",
    identityMapaEmpty:
      "Na tem področju še nisi zapisal identitete. Odpri Mapa Življenja in jo dopolni.",
    subareaSelect: "Izberi podpodročje",
    subareaSelectPlaceholder: "— Izberi podpodročje —",
    identityFromMapaSub: "Identiteta za izbrano podpodročje (iz Mapa Življenja)",
    identityMapaEmptySub:
      "Za to podpodročje še nisi zapisal identitete. Odpri Mapa Življenja in jo dopolni.",
    needSubarea: "Izberi podpodročje stebra.",
    addTask: "Dodaj nalogo",
    editTask: "Uredi nalogo",
    newTask: "Nova naloga",
    dayOverview: "Pregled dneva",
    timeStart: "Začetek",
    timeEnd: "Konec",
  },

  locks: {
    middayTitle: "Opoldanski Check-In je zaklenjen",
    middayMsg: "Na voljo bo ob 12:00. Vrni se ob opoldnevu.",
    nightTitle: "Večerna Refleksija je zaklenjena",
    nightMsg: "Na voljo bo ob 20:00. Najprej izvedi svoj dan.",
    opensAt: "Odpre se ob",
  },

  clock: {
    zone: "GMT+2",
  },

  award: {
    title: "Skrivnostna nagrada za zmagovalca",
    subtitle:
      "Voditelj z največ XP in najdaljšim nizom ob koncu bootcampa osvoji skrivnostno nagrado.",
    locked: "Nagrada je zaklenjena do konca bootcampa",
    endsLabel: "Bootcamp se zaključi",
    countdownDays: "dni",
    countdownHours: "ur",
    countdownMinutes: "min",
    countdownSeconds: "sek",
    reveal: "Razkritje",
    winner: "Zmagovalec",
    leadingNow: "Trenutno vodi",
    mystery: "?",
  },

  nav: {
    sectionDaily: "Dnevni OS",
    sectionGrowth: "Rast",
    sectionCommunity: "Skupnost",
    dashboard: "Nadzorna plošča",
    tasks: "Naloge",
    mapa: "Mapa Življenja",
    morning: "Jutranji Plan",
    midday: "Opoldanski Check-In",
    night: "Večerna Refleksija",
    sunday: "Nedeljski Reset",
    goals: "SMART Cilji",
    mentor: "AI Mentor",
    leaderboard: "Lestvica",
    publicChat: "Skupinski klepet",
    admin: "Nadzorna Soba",
    profile: "Profil",
  },

  status: {
    flow: "FLOW",
    drift: "DRIFT",
    flowDesc: "Si v toku vodenja. Nadaljuj z momentumom.",
    driftDesc: "Si v zaniku. Vrni se na pot vodenja.",
  },

  common: {
    save: "Shrani",
    submit: "Oddaj",
    submitted: "Oddano",
    cancel: "Prekliči",
    back: "Nazaj",
    close: "Zapri",
    add: "Dodaj",
    edit: "Uredi",
    delete: "Izbriši",
    confirm: "Potrdi",
    continue: "Nadaljuj",
    locked: "Zaklenjeno",
    completed: "Zaključeno",
    inProgress: "V teku",
    today: "Danes",
    level: "Nivo",
    xp: "XP",
    streak: "Niz",
    days: "dni",
    minutes: "min",
    of: "od",
    optional: "neobvezno",
  },

  ampak: {
    title: "IN namesto AMPAK!",
    message:
      "Besedo 'ampak' zamenjaj z 'in'. Ostani voditelj svojega življenja!",
    blocked: "Najprej popravi besedo 'ampak', preden oddaš.",
  },

  identity: {
    purposeLabel: "Moj smisel življenja",
    purpose:
      "MOJ SMISEL ŽIVLJENJA, KI GA IZUMLJAM ZASE IN ZA SVOJE ŽIVLJENJE JE, DA SO LJUDJE SREČNI IN POVEZANI.",
    subIdentity: "JAZ SEM MOTIVIRAN, KOMUNIKATIVEN, SREČEN, MIREN",
    // Editable dynamic purpose headers (dashboard)
    editTitle: "Moja identiteta in smisel",
    editHint: "Uredi neposredno. Tvoje besede oblikujejo tvoj dan.",
    purposeFieldLabel:
      "Moj smisel življenja, ki ga izumljam zase in za svoje življenje je...",
    purposePlaceholder: "Moj smisel življenja je ...",
    jazSemLabel: "Jaz sem...",
    jazSemPlaceholder: "Jaz sem ...",
    saved: "Shranjeno",
    saveAndLock: "Shrani in zakleni",
    saveChange: "Shrani spremembo",
    lockedHint: "Tvoja identiteta je zaklenjena. Za spremembo klikni Spremeni.",
    editingHint: "Uredi svojo identiteto in shrani spremembo.",
    lockedBadge: "Identiteta zaklenjena",
    changeBtn: "Spremeni",
    changeTitle: "Sprememba identitete",
    changeQuestion:
      "Zakaj želiš spremeniti svoj smisel življenja ali opis sebe? Bodi iskren — to je pomemben trenutek rasti.",
    changeReasonLabel: "Razlog za spremembo",
    changeReasonPlaceholder: "Spremenjujem, ker ...",
    changeConfirm: "Potrdi in uredi",
    reasonTooShort: "Razlog mora imeti vsaj 10 znakov.",
    // Per-pillar future self (Mapa Življenja)
    futureSelfLabel: "Kakšen sem in postajam v prihodnosti na tem področju?",
    futureSelfPlaceholder: "V prihodnosti na tem področju postajam ...",
    jazSemSubareaLabel: "Kakšen sem na tem podpodročju?",
    jazSemSubareaPlaceholder: "Na tem podpodročju sem ...",
  },

  dashboard: {
    title: "Nadzorna plošča",
    greetingMorning: "Dobro jutro",
    greetingDay: "Pozdravljen",
    greetingEvening: "Dober večer",
    subtitle: "Tvoj dnevni kokpit vodenja.",
    todayProgress: "Današnji napredek",
    weeklyXp: "XP ta teden",
    tasksDone: "Opravljene naloge",
    consistency: "Doslednost",
    nextStep: "Tvoj naslednji korak",
    dayPipeline: "Dnevni cikel",
    quickActions: "Hitre akcije",
  },

  morning: {
    title: "Jutranji Plan",
    subtitle:
      "Postavi temelje dneva pred 10:00 in si prisluži zagon. Najprej hvaležnost, nato izvedba.",
    gratitudeTitle: "Hvaležnost",
    gratitudeSub: "Zapiši natanko 3 stvari, za katere si hvaležen.",
    gratitudePlaceholder: "Hvaležen sem za ...",
    top3Title: "Top 3 cilji dneva",
    top3Sub: "3 ključne akcije, ki danes res štejejo. Dodaj trajanje.",
    taskPlaceholder: "Npr. Globoko delo: Strateški dokument",
    durationPlaceholder: "min",
    submit: "Zaključi jutranji plan",
    beforeTenBonus: "Oddaj pred 10:00 za +50 XP",
    doneTitle: "Jutranji plan je postavljen.",
    doneSub: "Tvoj dan ima smer. Zdaj izvedi.",
    // Identity validation panel
    identityTitle: "Kdo danes ustvarja ta dan?",
    identitySub:
      "Preden izvedeš, definiraj sebe. Razmisli prek različnih področij življenja.",
    identityDoneTitle: "Moja identiteta danes",
    creatorLabel: "Kdo sem jaz in kdo bo danes to ustvarjal?",
    creatorPlaceholder: "Danes sem ... in to ustvarjam kot ...",
    feelingLabel: "Kako se bom počutil, ko izpolnim današnje obveznosti?",
    feelingPlaceholder: "Ko izpolnim obveznosti, se bom počutil ...",
    alignmentLabel:
      "Kako ti trije ključni cilji aktivno ustvarjajo to izboljšano verzijo mene?",
    alignmentPlaceholder:
      "Ti cilji gradijo boljšo verzijo mene, ker ...",
  },

  midday: {
    title: "Opoldanski Check-In",
    subtitle:
      "Aktiven med 12:00 in 14:00. Preveri svoj utrip in napredek jutranjega plana.",
    moodTitle: "Kako se počutiš?",
    energyTitle: "Raven energije",
    focusTitle: "Raven fokusa",
    progressTitle: "Napredek jutranjega plana",
    progressSub: "Odkljukaj, kar si že opravil.",
    submit: "Oddaj check-in (+30 XP)",
    window: "Okno: 12:00 - 14:00",
    deadlineWarn: "Oddaj pred 14:00, sicer padeš v Drift!",
    doneTitle: "Check-in oddan.",
  },

  night: {
    title: "Večerna Refleksija",
    subtitle:
      "Aktivna ob 20:00. Zaključi dan z resnico. Oddaja je zaklenjena, dokler ne vpišeš 3 zmag.",
    winsTitle: "3 zmage dneva",
    winsSub: "3 zmage dneva, kjer sem dal vse od sebe.",
    winPlaceholder: "Danes sem zmagal, ko sem ...",
    reflectionTitle: "Misel ob koncu dneva",
    reflectionPlaceholder: "Kaj si se danes naučil o sebi?",
    submit: "Zaključi dan (+50 XP)",
    locked: "Vpiši vse 3 zmage za odklep oddaje.",
    doneTitle: "Dan zaključen. Počij. Jutri spet vodiš.",
  },

  sunday: {
    title: "Nedeljski Reset",
    subtitle: "Obvezna tedenska evaluacija. Na voljo ob nedeljah od 18:00.",
    lockMsg: "Nedelja 18:00+. Reden tok je zamrznjen, dokler ne zaključiš tedenskega reseta.",
    lockedTitle: "Nedeljski Reset je zaklenjen",
    lockedMsg: "Na voljo bo ob nedeljah ob 18:00. Do takrat nadaljuj z dnevnim ciklom.",
    summaryTitle: "Pregled tedna",
    xpEarned: "Zaslužen XP",
    tasksCompleted: "Opravljene naloge",
    consistencyScore: "Ocena doslednosti",
    lessonLabel: "Moja največja lekcija tega tedna",
    lessonPlaceholder: "Ta teden sem se naučil ...",
    driftLabel: "Kje sem ostal v 'Zaniku' in zakaj?",
    driftPlaceholder: "V zanik sem padel, ko ...",
    ratingLabel: "Ocena moje iskrenosti in izvedbe (1-10)",
    submit: "Zaključi teden (+300 XP)",
    finishTitle: "Teden zaključen!",
    finishMsg: "Odklenil si načrtovanje naslednjega tedna.",
    planningTitle: "Načrtovanje naslednjega tedna",
    planningSub: "Odklenjeno. Zariši naloge za teden, ki prihaja.",
    planPlaceholder: "Naslednji teden bom ...",
    planSubmit: "Shrani načrt v naloge",
    planSubmitDone: "Načrt je shranjen v naloge za prihajajoči teden.",
    planningLocked: "Zaključi nedeljski reset za odklep načrtovanja.",
  },

  goals: {
    title: "SMART Cilji",
    subtitle: "Veliki cilji, jasno definirani. Vsak zaključen cilj = +500 XP.",
    newGoal: "Nov SMART cilj",
    specific: "Specifičen — Kaj točno boš dosegel?",
    measurable: "Merljiv — Kako boš meril napredek?",
    achievable: "Dosegljiv — Je cilj realen?",
    relatable: "Pomemben — Zakaj ti je pomemben?",
    timeRelevant: "Časovno določen — Rok izvedbe",
    rewardImage: "Slika moje nagrade ob doseženem cilju",
    rewardHint: "Prilepi povezavo do slike (URL) ali naloži datoteko.",
    identityLabel:
      "Kdo jaz bom, ko delam na tem cilju in katero verzijo sebe s tem gradim?",
    identityPlaceholder: "Z delom na tem cilju postajam ...",
    identityTag: "IDENTITETA",
    create: "Ustvari cilj",
    markComplete: "Označi kot doseženo (+500 XP)",
    lockedReward: "Nagrada se odklene ob doseženem cilju",
    empty: "Še nimaš ciljev. Veliki voditelji najprej zarišejo cilj.",
    activeGoals: "Aktivni cilji",
    completedGoals: "Doseženi cilji",
  },

  mentor: {
    title: "AI Mentor",
    subtitle: "Tvoj ZaLife vodja. Brez mehčanja. Drži te odgovornega.",
    comingSoonBadge: "V razvoju",
    comingSoonBody:
      "Kakav AI bre? Pomisli malo! Ajde back to work. ...comming soon.",
    placeholder: "Vprašaj svojega mentorja ...",
    send: "Pošlji",
    thinking: "Mentor razmišlja ...",
    apiNote:
      "Povezan z GPT-4o mini. Dodaj OPENAI_API_KEY v .env za lokalni razvoj.",
  },

  mapa: {
    openPillar: "Odpri področje",
  },

  leaderboard: {
    title: "Lestvica",
    subtitle: "Pravi uporabniki tega cikla. Rangirano po XP tedna in nizu.",
    byXp: "XP ta teden",
    byStreak: "Niz dni",
    empty: "Še ni drugih udeležencev. Tvoji podatki se sinhronizirajo v oblak.",
  },

  publicChat: {
    title: "Skupinski klepet",
    subtitle:
      "Javna soba za vse voditelje v bootcampu. Deli zmage, vprašanja in momentum.",
    placeholder: "Napiši sporočilo skupnosti ...",
    send: "Pošlji",
    sending: "Pošiljam ...",
    loading: "Nalagam sporočila ...",
    empty: "Še ni sporočil. Bodi prvi, ki pozdravi skupnost!",
    hint: "Bodi spoštljiv. Brez »ampak« — samo »IN«. Sporočila vidijo vsi.",
    notConfigured:
      "Skupinski klepet potrebuje Supabase. Dodaj VITE_SUPABASE_URL in VITE_SUPABASE_ANON_KEY.",
  },

  admin: {
    title: "Nadzorna Soba",
    subtitle: "Super-admin pregled vseh udeležencev.",
    student: "Udeleženec",
    state: "Stanje",
    xpLevel: "XP / Nivo",
    warnings: "Opozorila",
    goalsResets: "Cilji / Reseti",
    activeGoals: "Aktivni cilji",
    resets: "Reseti",
    gateTitle: "Nadzorna Soba — Zaščiteno",
    gateSub: "Vnesi administratorsko kodo za dostop.",
    gateCode: "Administratorska koda",
    gateEnter: "Vstopi",
    gateError: "Napačna koda.",
    backToApp: "Nazaj v aplikacijo",
    lockOut: "Zakleni",
  },

  profile: {
    title: "Profil",
    subtitle: "Tvoja identiteta in povezave.",
    avatar: "Profilna slika",
    avatarHint: "Prilepi URL slike ali naloži datoteko.",
    name: "Ime",
    age: "Starost",
    email: "E-pošta",
    calendar: "Google Koledar",
    calendarDesc:
      "Poveži se z enim klikom. Dnevne Top 3 in vse naloge na strani Naloge se sinhronizirajo v Google Koledar.",
    connectCalendar: "Poveži Google Koledar",
    calendarConnected: "Koledar povezan",
    calendarConnectedAs: "Povezano kot",
    calendarNote:
      "Ob povezavi te Google prosi za vsa potrebna dovoljenja (prijava + dogodki koledarja).",
    calendarSynced: (n: number) => `${n} nalog dodanih v Google Koledar.`,
    calendarReconnect: "Ponovno poveži",
    calendarTokenExpired: "Seja je potekla. Klikni za ponovno povezavo.",
    stats: "Statistika",
    save: "Shrani profil",
  },

  drift: {
    warnTitle: "Pozor: Vstopil si v DRIFT.",
    warnMsg: "Kaj je tvoj specifični plan, da se vrneš v FLOW?",
    planPlaceholder: "Moj plan za vrnitev v FLOW ...",
    warningCount: "Opozorilo",
    lockTitle: "Sistem zaklenjen",
    lockMsg:
      "Dosegel si 5/5 opozoril. Potrebna je intervencija mentorja za odklep.",
    backToFlow: "Nazaj v FLOW",
  },

  levelup: {
    title: "Čestitke!",
    msg: (lvl: number) =>
      `Napredoval si na Nivo ${lvl}. Tvoj vodstveni potencial raste!`,
  },

  streak: {
    title: (n: number) => `${n}-dnevni niz!`,
    msg: (n: number) =>
      `${n} dni zapored si vodil svoje življenje. Doslednost je tvoja supermoč.`,
  },

  // Proactive Mindset Reminder Engine
  reminder: {
    identityTitle: "Trenutek resnice",
    identityQuestion: (vision: string) =>
      `Ali tvoja trenutna dejanja odražajo verzijo tebe, ki želi biti: ${vision}?`,
    pillarTag: "Področje",
    aligned: "Da, usklajen sem (+40 XP)",
    notYet: "Ne še — popravim se",
    deadlineGoalTitle: "Cilj se zaključuje",
    deadlineGoalToday: "Tvoj cilj ima rok DANES. Naredi odločilen korak.",
    deadlineGoalOverdue: "Rok cilja je potekel. Ukrepaj zdaj ali ga prenovi.",
    deadlineGoalSoon: (d: number) =>
      `Tvoj cilj se zaključuje čez ${d} ${d === 1 ? "dan" : "dni"}. Ostani na poti.`,
    deadlineTaskTitle: "Odprte dnevne prioritete",
    deadlineTaskMsg:
      "Dan se izteka, te ključne naloge pa so še odprte. Zaključi jih, preden padeš v Zanik:",
    deadlinePlannerTitle: "Zamujene naloge",
    deadlinePlannerMsg:
      "Načrtovani čas za te naloge je že minil. Ukrepaj zdaj ali jih prestavi:",
    cycleTitle: (phase: string) => {
      if (phase === "midday") return "Opoldanski check-in čaka";
      if (phase === "night") return "Večerna refleksija čaka";
      return "Jutranji plan še ni oddan";
    },
    cycleMsg: (phase: string) => {
      if (phase === "midday")
        return "Opoldne je za nami — še nisi oddal opoldanskega check-ina. Vrni se v tok vodenja.";
      if (phase === "night")
        return "Dan se zaključuje — večerna refleksija še ni oddana. Zapri dan z jasnostjo.";
      return "Jutro je mimo — še nisi postavil jutranjega plana. Določi 3 prioritete in identiteto dneva.";
    },
    gotoCycle: (phase: string) => {
      if (phase === "midday") return "Odpri opoldanski check-in";
      if (phase === "night") return "Odpri večerno refleksijo";
      return "Odpri jutranji plan";
    },
    gotoTasks: "Pojdi na naloge",
    dismiss: "Razumem",
  },

  // Terminal Night Reflection summary modal
  summary: {
    title: "Dnevni pregled uspešnosti",
    subtitle: "Dan je zaključen. Tukaj je tvoj rezultat.",
    xpToday: "XP danes",
    rank: "Tvoj rang",
    rankOf: (rank: number, total: number) => `${rank}. od ${total}`,
    identityMirror: (jazSem: string) => `Ne pozabi, kdo si: ${jazSem}`,
    close: "Zaključi dan",
  },

  onboarding: {
    friend: "voditelj",
    welcome: (name: string) => `Dobrodošel, ${name}!`,
    start: "Začni svoj dan",
    statusHint:
      "V FLOW si, ko izvajaš svoj načrt. V DRIFT, ko zamudiš ključne korake.",
    cycle: [
      "☀ Jutranji plan — 3 prioritete + identiteta",
      "✓ Naloge — tedenski načrt + koledar",
      "◎ Opoldanski check-in ob 12:00",
      "☾ Večerna refleksija ob 20:00",
      "↻ Nedeljski reset ob 18:00",
    ],
    steps: [
      {
        title: "Dobrodošel v ZaLife Daily OS",
        body: "To je tvoj gamificiran kokpit vodenja. Vsak dan gradiš disciplino, identiteto in rezultate.",
      },
      {
        title: "Tvoja identiteta",
        body: "Najprej definiraj svoj smisel in kdo si. To ostane zaklenjeno — spremembe zahtevajo razlog.",
      },
      {
        title: "Dnevni cikel",
        body: "Sledi ritmu vodenja. Vsaka faza odklene XP in te ohranja v Toku.",
      },
      {
        title: "FLOW in DRIFT",
        body: "Tvoj status se meri v realnem času. Ohranjaj Tok z doslednostjo.",
      },
      {
        title: "Google Koledar (opcijsko)",
        body: "Poveži koledar, da se naloge sinhronizirajo avtomatsko. Lahko tudi kasneje v Profilu.",
      },
    ],
  },
};

export type Strings = typeof sl;
