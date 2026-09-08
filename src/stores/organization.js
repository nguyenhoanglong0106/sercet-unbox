import { defineStore } from 'pinia';
import { DEFAULT_ORGANIZATION, normalizeOrganization, validateOrganization } from '@/data/organization';
import { fetchOrganization, saveOrganization } from '@/services/organizationApi';

const STORAGE_KEY = 'giao-ly-organization';

function readCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (cache?.profile && typeof cache.profile === 'object') {
      return { profile: normalizeOrganization(cache.profile), pending: cache.pending === true };
    }
  } catch {
    // A blocked or damaged cache must not prevent loading server data.
  }
  return { profile: { ...DEFAULT_ORGANIZATION }, pending: false };
}

function writeCache(profile, pending) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, pending }));
    return true;
  } catch {
    return false;
  }
}

export const useOrganizationStore = defineStore('organization', {
  state: () => ({
    ...readCache(),
    hydrated: false,
    loading: false,
    saving: false,
    syncError: '',
  }),
  actions: {
    async init() {
      if (this.hydrated || this.loading) return;
      this.loading = true;
      try {
        const profile = await fetchOrganization();
        // Keep unsynced local edits until the user explicitly saves them online.
        if (profile && !this.pending) {
          this.profile = profile;
          writeCache(profile, false);
        }
        this.syncError = '';
      } catch (error) {
        this.syncError = error.message;
      } finally {
        this.loading = false;
        this.hydrated = true;
      }
    },
    async save(input) {
      if (this.loading || this.saving) return;
      const profile = normalizeOrganization(input);
      if (Object.keys(validateOrganization(profile)).length) {
        throw new Error('Vui lòng kiểm tra lại thông tin xứ đoàn.');
      }
      this.saving = true;
      try {
        let saved;
        try {
          saved = await saveOrganization(profile);
        } catch (error) {
          this.syncError = error.message;
          if (!writeCache(profile, true)) {
            throw new Error('Chưa lưu được thông tin: máy chủ không phản hồi và trình duyệt không cho phép lưu trên thiết bị.');
          }
          this.profile = profile;
          this.pending = true;
          return 'local';
        }
        this.profile = saved;
        this.pending = false;
        this.syncError = '';
        writeCache(saved, false);
        return 'online';
      } finally {
        this.saving = false;
      }
    },
  },
});
