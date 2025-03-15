export type SkinType = 'OILY' | 'COMBINATION' | 'DRY' | 'NORMAL';

export interface RoutineStep {
  step: string;
  description: string;
  categoryIds: string[];
  frequency: string;
}

export interface SkincarePlan {
  _id: string;
  name: string;
  skinType: SkinType;
  steps: RoutineStep[];
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}