import { useState } from "react";
import { sl } from "../i18n/sl";
import { PageHead } from "../components/ui";
import { IdentityHeaders } from "../components/IdentityHeaders";
import { PillarCard, PillarEditorModal } from "../components/PillarEditorModal";
import { PILLARS } from "../data/pillars";
import type { PillarDef } from "../data/pillars";

export function MapaZivljenja() {
  const [openPillar, setOpenPillar] = useState<PillarDef | null>(null);

  return (
    <div className="page">
      <PageHead title={sl.nav.mapa}>
        Tvoja celostna matrika življenja. Tapni področje za podroben vnos z več
        prostora za zapiske.
      </PageHead>

      <IdentityHeaders editable={false} />

      <div className="grid grid-4 pillar-grid-compact">
        {PILLARS.map((pillar) => (
          <PillarCard
            key={pillar.id}
            pillar={pillar}
            onOpen={() => setOpenPillar(pillar)}
          />
        ))}
      </div>

      {openPillar && (
        <PillarEditorModal
          pillar={openPillar}
          onClose={() => setOpenPillar(null)}
        />
      )}
    </div>
  );
}
