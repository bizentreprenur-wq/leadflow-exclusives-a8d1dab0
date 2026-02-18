export type DripSettingsSource = 'step3' | 'step4' | 'compose';

export interface DripSettings {
  enabled: boolean;
  emailsPerHour: number;
  intervalSeconds: number;
  updatedAt: string;
  source?: DripSettingsSource;
}

export const DRIP_SETTINGS_KEY = 'bamlead_drip_settings';

const DEFAULT_SETTINGS: DripSettings = {
  enabled: true,
  emailsPerHour: 80,
  intervalSeconds: Math.round(3600 / 80),
  updatedAt: new Date(0).toISOString(),
  source: 'step3',
};

export const loadDripSettings = (): DripSettings => {
  try {
    const raw = sessionStorage.getItem(DRIP_SETTINGS_KEY) || localStorage.getItem(DRIP_SETTINGS_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw) as Partial<DripSettings>;
    const emailsPerHour = Number(parsed.emailsPerHour);
    const normalizedEmails = Number.isFinite(emailsPerHour) && emailsPerHour > 0 ? emailsPerHour : DEFAULT_SETTINGS.emailsPerHour;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      emailsPerHour: normalizedEmails,
      intervalSeconds: Number.isFinite(parsed.intervalSeconds) && (parsed.intervalSeconds as number) > 0
        ? parsed.intervalSeconds as number
        : Math.round(3600 / normalizedEmails),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveDripSettings = (next: Partial<DripSettings>): DripSettings => {
  const current = loadDripSettings();
  const merged: DripSettings = {
    ...current,
    ...next,
    emailsPerHour: Number.isFinite(next.emailsPerHour as number) && (next.emailsPerHour as number) > 0
      ? (next.emailsPerHour as number)
      : current.emailsPerHour,
    intervalSeconds: Number.isFinite(next.intervalSeconds as number) && (next.intervalSeconds as number) > 0
      ? (next.intervalSeconds as number)
      : Math.round(3600 / (Number.isFinite(next.emailsPerHour as number) && (next.emailsPerHour as number) > 0 ? (next.emailsPerHour as number) : current.emailsPerHour)),
    updatedAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(DRIP_SETTINGS_KEY, JSON.stringify(merged));
    localStorage.setItem(DRIP_SETTINGS_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage failures
  }

  return merged;
};
