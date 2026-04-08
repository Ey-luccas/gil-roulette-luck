export const MAX_SPIN_ATTEMPTS_PER_CPF = 3;

export function getRemainingSpinAttempts(spinAttempts: number) {
  return Math.max(MAX_SPIN_ATTEMPTS_PER_CPF - spinAttempts, 0);
}

export function hasAvailableSpinAttempts(spinAttempts: number) {
  return spinAttempts < MAX_SPIN_ATTEMPTS_PER_CPF;
}

