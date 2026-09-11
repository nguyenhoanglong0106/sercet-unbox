import { defineStore } from 'pinia';
import { DIVISION_OPTIONS, getDivisionMeta, normalizeForMatch } from '@/data/divisions';
import { deleteClassRow, deleteClassRows, fetchClasses, insertClass, updateClassRow, upsertClasses } from '@/services/classesApi';

const divisionOrder = new Map(DIVISION_OPTIONS.map((division, index) => [division.key, index]));
const classNameCollator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });

function createId() {
  return crypto.randomUUID?.() || `class-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getDivisionOrder(division) {
  return divisionOrder.get(division) ?? divisionOrder.size;
}

function compareClasses(a, b) {
  const divisionDiff = getDivisionOrder(a.division) - getDivisionOrder(b.division);
  if (divisionDiff) return divisionDiff;

  const nameDiff = classNameCollator.compare(String(a.className || '').trim(), String(b.className || '').trim());
  if (nameDiff) return nameDiff;

  return (a.order || 0) - (b.order || 0);
}

function normalizeClass(input = {}, index = 0) {
  const meta = getDivisionMeta(input.division);
  return {
    id: input.id || createId(),
    className: input.className || 'Lớp Giáo Lý',
    division: input.division || 'THIEU_NHI',
    group: input.group || meta.label,
    teacherName: input.teacherName || 'Giáo Lý Viên A',
    assistantName: input.assistantName || '',
    teacherImage: input.teacherImage || '',
    assistantImage: input.assistantImage || '',
    slogan: input.slogan || '',
    primaryColor: input.primaryColor || meta.color,
    notes: input.notes || '',
    order: Number.isFinite(input.order) ? input.order : index + 1,
    revealed: Boolean(input.revealed),
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const useClassesStore = defineStore('classes', {
  state: () => ({
    classes: [],
    hydrated: false,
    busy: false,
    error: '',
  }),
  getters: {
    orderedClasses: (state) => [...state.classes].sort(compareClasses),
    byId: (state) => (id) => state.classes.find((classItem) => classItem.id === id),
    revealCandidates: (state) => (onlyUnrevealed = true) => {
      const ordered = [...state.classes].sort(compareClasses);
      return onlyUnrevealed ? ordered.filter((item) => !item.revealed) : ordered;
    },
    // Tra cứu GLV theo tên đầy đủ (tên thánh + họ + tên). Lớp có 2 GLV thì dò
    // cả teacherName lẫn assistantName. Ưu tiên trùng khớp tuyệt đối; nếu không
    // có mới lấy các kết quả khớp một phần để người dùng chọn lại.
    findGlvMatches: (state) => (query) => {
      const needle = normalizeForMatch(query);
      if (!needle) return [];

      const matches = [];
      const ordered = [...state.classes].sort(compareClasses);

      for (const classItem of ordered) {
        for (const role of ['teacherName', 'assistantName']) {
          const glvName = classItem[role];
          const normalized = normalizeForMatch(glvName);
          if (!normalized) continue;

          let score = -1;
          if (normalized === needle) score = 0;
          else if (normalized.includes(needle)) score = 1;
          else if (needle.includes(normalized)) score = 2;
          if (score < 0) continue;

          matches.push({ classItem, glvName, role, score });
        }
      }

      const exact = matches.filter((match) => match.score === 0);
      return (exact.length ? exact : matches).sort((a, b) => a.score - b.score);
    },
  },
  actions: {
    async init() {
      if (this.hydrated) return;
      this.busy = true;
      this.error = '';

      try {
        this.classes = await fetchClasses();
      } catch (error) {
        this.error = error.message;
      } finally {
        this.hydrated = true;
        this.busy = false;
      }
    },
    async refresh() {
      this.classes = await fetchClasses();
    },
    async addClass(payload) {
      const classItem = normalizeClass(payload, this.classes.length);
      const saved = await insertClass(classItem);
      this.classes.push(saved);
      return saved;
    },
    async updateClass(id, payload) {
      const index = this.classes.findIndex((item) => item.id === id);
      if (index < 0) return null;

      const merged = normalizeClass(
        { ...this.classes[index], ...payload, id, updatedAt: new Date().toISOString() },
        index,
      );
      const saved = await updateClassRow(id, merged);
      this.classes[index] = saved;
      return saved;
    },
    async deleteClass(id) {
      await deleteClassRow(id);
      this.classes = this.classes.filter((item) => item.id !== id);
    },
    async deleteAllClasses() {
      const ids = this.classes.map((item) => item.id);
      if (!ids.length) return;
      await deleteClassRows(ids);
      this.classes = [];
    },
    async duplicateClass(id) {
      const source = this.byId(id);
      if (!source) return null;

      const copy = normalizeClass(
        {
          ...source,
          id: createId(),
          className: `${source.className} Copy`,
          revealed: false,
          order: this.classes.length + 1,
          createdAt: new Date().toISOString(),
        },
        this.classes.length,
      );

      const saved = await insertClass(copy);
      this.classes.push(saved);
      return saved;
    },
    async moveClass(sourceId, targetId) {
      if (sourceId === targetId) return;

      const ordered = this.orderedClasses;
      const sourceIndex = ordered.findIndex((item) => item.id === sourceId);
      const targetIndex = ordered.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return;

      const [source] = ordered.splice(sourceIndex, 1);
      ordered.splice(targetIndex, 0, source);
      const reordered = ordered.map((item, index) => ({
        ...item,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      }));

      this.classes = reordered;
      await upsertClasses(reordered);
    },
    async markRevealed(id) {
      const classItem = this.byId(id);
      if (!classItem || classItem.revealed) return;

      const updated = { ...classItem, revealed: true, updatedAt: new Date().toISOString() };
      await updateClassRow(id, updated);
      const index = this.classes.findIndex((item) => item.id === id);
      this.classes[index] = updated;
    },
    async resetReveals() {
      const updated = this.classes.map((item) => ({
        ...item,
        revealed: false,
        updatedAt: new Date().toISOString(),
      }));

      this.classes = updated;
      await upsertClasses(updated);
    },
  },
});
