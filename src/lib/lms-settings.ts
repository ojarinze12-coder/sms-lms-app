import { authFetch } from './auth-fetch';

export interface LMSSettings {
  examTimeLimit: number;
  passingScore: number;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
}

export async function getLMSSettings(): Promise<LMSSettings | null> {
  try {
    const res = await authFetch('/api/lms/settings');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}