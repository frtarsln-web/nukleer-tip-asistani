
import { DoseUnit, Isotope } from '../types';
import { CONVERSION_FACTOR } from '../constants';

export const convertDose = (value: number, from: DoseUnit, to: DoseUnit): number => {
  if (from === to) return value;
  if (from === DoseUnit.MCI && to === DoseUnit.MBQ) return value * CONVERSION_FACTOR;
  return value / CONVERSION_FACTOR;
};

export const calculateDecay = (
  initialActivity: number,
  halfLifeHours: number,
  elapsedHours: number
): number => {
  return initialActivity * Math.pow(0.5, elapsedHours / halfLifeHours);
};

export const formatActivity = (val: number): string => {
  return val.toLocaleString(undefined, { maximumFractionDigits: 3 });
};

export const getVialCurrentActivity = (vial: { initialAmount: number, receivedAt: Date }, halfLife: number, now: Date): number => {
  const hoursPassed = (now.getTime() - new Date(vial.receivedAt).getTime()) / (1000 * 60 * 60);
  return calculateDecay(vial.initialAmount, halfLife, hoursPassed);
};

/**
 * Mo-99 / Tc-99m Jeneratör Birikim Formülü
 * Tc-99m aktivitesi (N2), Mo-99 bozunmasından (N1) gelir.
 * Basitleştirilmiş denge denklemi.
 */
export const calculateTc99mAccumulation = (
  mo99Initial: number,
  hoursSinceLastElution: number,
  hoursSinceReceived: number,
  efficiency: number
): number => {
  const lambda1 = Math.log(2) / 66.02; // Mo-99
  const lambda2 = Math.log(2) / 6.0067; // Tc-99m

  // Mo-99 activity at the time of elution
  const currentMo99 = mo99Initial * Math.exp(-lambda1 * hoursSinceReceived);

  // Theoretical building up of Tc-99m since last elution
  // Fractional factor: (lambda2 / (lambda2 - lambda1)) * (e^-lambda1*t - e^-lambda2*t)
  const factor = (lambda2 / (lambda2 - lambda1)) * (Math.exp(-lambda1 * hoursSinceLastElution) - Math.exp(-lambda2 * hoursSinceLastElution));

  // For Tc-99m, typical max is around 94-95% of parent activity at equilibrium
  // We use the last elution timestamp to calculate what has grown since.
  const theoreticalTc = currentMo99 * factor;

  return theoreticalTc * (efficiency / 100);
};
