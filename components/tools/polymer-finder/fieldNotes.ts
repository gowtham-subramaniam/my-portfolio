/**
 * Field notes: real-world manufacturing experience submitted by engineers.
 *
 * Submissions from the "Share a field note" form arrive by email (see
 * app/api/field-note/route.ts) with a ready-to-paste entry. Review each one,
 * then add it here. Nothing is published automatically.
 */

export type FieldNoteCategory =
  | 'Molding'
  | 'Machining'
  | '3D printing'
  | 'Assembly & bonding'
  | 'Sterilization'
  | 'Chemical exposure'
  | 'Field failure'
  | 'Other';

export const FIELD_NOTE_CATEGORIES: FieldNoteCategory[] = [
  'Molding',
  'Machining',
  '3D printing',
  'Assembly & bonding',
  'Sterilization',
  'Chemical exposure',
  'Field failure',
  'Other',
];

export interface FieldNote {
  /** Polymer id from polymers.ts */
  polymerId: string;
  category: FieldNoteCategory;
  note: string;
  /** Display attribution as approved by the contributor, e.g. "J. Doe, Process Engineer" */
  attribution?: string;
  /** YYYY-MM */
  date: string;
}

export const FIELD_NOTES: FieldNote[] = [
  // Example of the shape (paste approved submissions below):
  // { polymerId: 'pc', category: 'Assembly & bonding', note: '…', attribution: 'A. Engineer, Medical devices', date: '2026-10' },
];

export function notesFor(polymerId: string): FieldNote[] {
  return FIELD_NOTES.filter((n) => n.polymerId === polymerId);
}
