import type { TuningType } from "@/lib/types";

interface Props {
  types: TuningType[];
}

/* Tags shown on gain-focused types */
const GAIN_TAGS: Record<string, string> = {
  "stage-1": "+30 %",
  "stage-2": "+45 %",
  "stage-3": "sur devis",
};

export function TuningTypes({ types }: Props) {
  if (types.length === 0) {
    return (
      <p className="text-mute text-[14.5px] py-8 text-center">
        Aucun type de tuning disponible pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-[14px] max-[940px]:grid-cols-2 max-[560px]:grid-cols-1">
      {types.map((t) => {
        const tag = GAIN_TAGS[t.slug];
        return (
          <div
            key={t.id}
            className="bg-card border border-line rounded-lg p-5 relative shadow-card hover:-translate-y-[3px] hover:shadow-card-lg hover:border-line2 transition-[transform,box-shadow,border-color] duration-[220ms]"
          >
            {tag && (
              <span className="absolute top-[19px] right-[18px] text-[11.5px] text-ember-ink bg-ember-soft border border-[#FFD9C9] px-2 py-[2px] rounded-full font-medium">
                {tag}
              </span>
            )}
            <h3 className="font-display text-[20px] mb-[7px] pr-14">{t.nom_fr}</h3>
            <p className="text-[13.5px] text-ink2">{t.description}</p>
          </div>
        );
      })}
    </div>
  );
}
