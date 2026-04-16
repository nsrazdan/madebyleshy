import { supabase } from '../lib/supabase-client';

export interface SetlistItem {
  name: string;
  bpm: number;
  beatsPerMeasure: number;
  subdivision: 1 | 2 | 3 | 4;
  accentFirst: boolean;
  // Tempo trainer
  tempoTrainer?: {
    enabled: boolean;
    increaseBpm: number;
    everyBars: number;
    targetBpm: number;
  };
  // Internal tempo trainer
  internalTrainer?: {
    enabled: boolean;
    playBars: number;
    muteBars: number;
  };
}

export interface Setlist {
  id?: string;
  name: string;
  items: SetlistItem[];
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_ITEM: SetlistItem = {
  name: 'Untitled',
  bpm: 120,
  beatsPerMeasure: 4,
  subdivision: 1,
  accentFirst: true,
};

export function createDefaultItem(overrides?: Partial<SetlistItem>): SetlistItem {
  return { ...DEFAULT_ITEM, ...overrides };
}

export function createDefaultSetlist(name = 'My Setlist'): Setlist {
  return { name, items: [createDefaultItem()] };
}

// ── Supabase persistence ──────────────────────────

export async function loadSetlists(): Promise<Setlist[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('metronome_setlists')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    items: row.items as SetlistItem[],
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function saveSetlist(setlist: Setlist): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  if (setlist.id) {
    await supabase
      .from('metronome_setlists')
      .update({
        name: setlist.name,
        items: setlist.items as unknown as Record<string, unknown>[],
        updated_at: new Date().toISOString(),
      })
      .eq('id', setlist.id);
    return setlist.id;
  }

  const { data } = await supabase
    .from('metronome_setlists')
    .insert({
      user_id: user.id,
      name: setlist.name,
      items: setlist.items as unknown as Record<string, unknown>[],
    })
    .select('id')
    .single();

  return data?.id ?? null;
}

export async function deleteSetlist(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('metronome_setlists').delete().eq('id', id);
}
