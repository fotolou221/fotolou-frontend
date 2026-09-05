export type RelativeRelation = 'mere' | 'pere' | 'enfant' | 'frere' | 'soeur' | 'ami' | 'autre';

export interface Relative {
  readonly id: string;
  readonly name: string;
  readonly relation: RelativeRelation;
  readonly phone?: string;
}

export const RELATION_LABELS: Record<RelativeRelation, string> = {
  mere: 'Mère',
  pere: 'Père',
  enfant: 'Enfant',
  frere: 'Frère',
  soeur: 'Sœur',
  ami: 'Ami(e)',
  autre: 'Autre'
};
