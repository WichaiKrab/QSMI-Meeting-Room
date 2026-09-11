import { UserAccount } from '../types';

/**
 * Remove sensitive credentials (such as password) from a user object
 * before saving to localStorage, sessionStorage, or browser state logs.
 */
export function sanitizeUserForStorage<T extends Partial<UserAccount> | null | undefined>(
  user: T
): T extends null | undefined ? T : Omit<NonNullable<T>, 'password'> {
  if (!user || typeof user !== 'object') {
    return user as any;
  }
  const { password, ...safeUser } = user as any;
  return safeUser as any;
}

/**
 * Remove sensitive credentials from an array of user objects
 * before persisting to localStorage / sessionStorage.
 */
export function sanitizeUsersForStorage(
  users: UserAccount[] | null | undefined
): Omit<UserAccount, 'password'>[] {
  if (!Array.isArray(users)) return [];
  return users.map((u) => {
    if (!u || typeof u !== 'object') return u;
    const { password, ...safeUser } = u;
    return safeUser;
  });
}

/**
 * Automatically inspects and purges legacy plaintext passwords stored in
 * localStorage and sessionStorage to prevent security leaks in DevTools.
 * Safe to call repeatedly and runs on initial app boot.
 */
export function cleanupStorageCredentials(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Completely purge sensitive large plain-text dumps from localStorage
    try {
      localStorage.removeItem('meeting_app_users');
      localStorage.removeItem('meeting_app_audit_logs');
    } catch (_) {}

    // 2. Clean 'meeting_app_sso_user' in both localStorage and sessionStorage
    const storages: { name: string; storage: Storage }[] = [
      { name: 'localStorage', storage: localStorage },
      { name: 'sessionStorage', storage: sessionStorage }
    ];

    for (const { name, storage } of storages) {
      const rawUser = storage.getItem('meeting_app_sso_user');
      if (rawUser) {
        try {
          const parsed = JSON.parse(rawUser);
          if (parsed && typeof parsed === 'object' && 'password' in parsed) {
            const { password, ...safe } = parsed;
            storage.setItem('meeting_app_sso_user', JSON.stringify(safe));
            console.log(`🔒 [Security] Auto-purged password from meeting_app_sso_user in ${name}`);
          }
        } catch {
          storage.removeItem('meeting_app_sso_user');
        }
      }

      // Check meeting_app_auth_signal if any
      const rawSignal = storage.getItem('meeting_app_auth_signal');
      if (rawSignal) {
        try {
          const parsed = JSON.parse(rawSignal);
          if (parsed && typeof parsed === 'object' && parsed.user && 'password' in parsed.user) {
            const { password, ...safe } = parsed.user;
            parsed.user = safe;
            storage.setItem('meeting_app_auth_signal', JSON.stringify(parsed));
          }
        } catch {
          storage.removeItem('meeting_app_auth_signal');
        }
      }
    }

    // 3. Remove deprecated or obsolete keys
    if (localStorage.getItem('meeting_rooms_corporate_users')) {
      localStorage.removeItem('meeting_rooms_corporate_users');
    }
  } catch (err) {
    console.warn('Security storage cleanup notice:', err);
  }
}

/**
 * Completely purge session and cached plain-text data upon user logout
 * to ensure that shared computers or DevTools do not expose private corporate data.
 */
export function clearAllSensitiveStorageOnLogout(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('meeting_app_sso_user');
    sessionStorage.clear();

    const keysToPurge = [
      'meeting_app_sso_user',
      'meeting_app_admin_auth',
      'meeting_app_last_activity',
      'meeting_app_audit_logs',
      'meeting_app_users',
      'meeting_app_bookings',
      'meeting_app_emails',
      'meeting_app_departments',
      'meeting_app_notif_sync'
    ];

    for (const key of keysToPurge) {
      try {
        localStorage.removeItem(key);
      } catch (_) {}
    }
  } catch (err) {
    console.warn('Error clearing sensitive storage on logout:', err);
  }
}

