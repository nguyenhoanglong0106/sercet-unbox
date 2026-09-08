import { supabase } from '@/services/supabaseClient';

const TABLE = 'classes';

function toRow(classItem) {
  return {
    id: classItem.id,
    class_name: classItem.className,
    division: classItem.division,
    group_name: classItem.group,
    teacher_name: classItem.teacherName,
    assistant_name: classItem.assistantName,
    teacher_image: classItem.teacherImage,
    assistant_image: classItem.assistantImage,
    slogan: classItem.slogan,
    primary_color: classItem.primaryColor,
    notes: classItem.notes,
    order_index: classItem.order,
    revealed: classItem.revealed,
    created_at: classItem.createdAt,
    updated_at: classItem.updatedAt,
  };
}

function fromRow(row) {
  return {
    id: row.id,
    className: row.class_name,
    division: row.division,
    group: row.group_name,
    teacherName: row.teacher_name,
    assistantName: row.assistant_name,
    teacherImage: row.teacher_image,
    assistantImage: row.assistant_image,
    slogan: row.slogan,
    primaryColor: row.primary_color,
    notes: row.notes,
    order: row.order_index,
    revealed: row.revealed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function assertNoError(error, action) {
  if (error) {
    throw new Error(`${action} thất bại: ${error.message}`);
  }
}

export async function fetchClasses() {
  const { data, error } = await supabase.from(TABLE).select('*').order('order_index', { ascending: true });
  assertNoError(error, 'Tải danh sách lớp');
  return (data || []).map(fromRow);
}

export async function insertClass(classItem) {
  const { data, error } = await supabase.from(TABLE).insert(toRow(classItem)).select().single();
  assertNoError(error, 'Thêm lớp');
  return fromRow(data);
}

export async function updateClassRow(id, classItem) {
  const { data, error } = await supabase.from(TABLE).update(toRow(classItem)).eq('id', id).select().single();
  assertNoError(error, 'Cập nhật lớp');
  return fromRow(data);
}

export async function deleteClassRow(id) {
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  assertNoError(error, 'Xóa lớp');
}

export async function upsertClasses(classItems) {
  if (!classItems.length) return;
  const { error } = await supabase.from(TABLE).upsert(classItems.map(toRow));
  assertNoError(error, 'Cập nhật danh sách lớp');
}
