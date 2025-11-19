import { createClient } from '@supabase/supabase-js';
import type { SavedVersion } from '../store';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Version sharing will not work.');
  console.warn('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.warn('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Log Supabase connection status
if (supabase) {
  console.log('✅ Supabase connected:', supabaseUrl);
  // Test connection on load
  supabase
    .from('versions')
    .select('count', { count: 'exact', head: true })
    .then(({ error }) => {
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        console.error('This means versions will NOT be shared across browsers!');
        console.error('Check:');
        console.error('1. Is the "versions" table created?');
        console.error('2. Are RLS policies set correctly?');
        console.error('3. Are you using the correct API key (Publishable key, not legacy)?');
      } else {
        console.log('✅ Supabase connection test passed - table is accessible');
      }
    })
    .catch((err) => {
      console.error('❌ Supabase connection test error:', err);
    });
} else {
  console.warn('❌ Supabase not connected - versions will be stored locally only');
}

// Version storage API
export const versionsApi = {
  // Get all versions
  async getAll(): Promise<SavedVersion[]> {
    if (!supabase) {
      console.warn('⚠️ Supabase not configured, falling back to localStorage');
      console.warn('This means versions will NOT be shared across browsers!');
      return loadVersionsFromLocalStorage();
    }

    try {
      console.log('🔍 Fetching versions from Supabase...');
      const { data, error } = await supabase
        .from('versions')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ Supabase fetch error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('⚠️ Falling back to localStorage - versions will NOT be shared!');
        return loadVersionsFromLocalStorage();
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} versions from Supabase`);
      return (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        timestamp: row.timestamp,
        state: row.state,
      }));
    } catch (error) {
      console.error('❌ Unexpected error fetching versions:', error);
      console.error('⚠️ Falling back to localStorage - versions will NOT be shared!');
      return loadVersionsFromLocalStorage();
    }
  },

  // Save a version (create or update)
  async save(version: SavedVersion): Promise<SavedVersion> {
    if (!supabase) {
      console.warn('⚠️ Supabase not configured, saving to localStorage only');
      console.warn('This means versions will NOT be shared across browsers!');
      saveVersionToLocalStorage(version);
      return version;
    }

    try {
      console.log(`💾 Saving version "${version.name}" to Supabase...`);
      const { data, error } = await supabase
        .from('versions')
        .upsert({
          id: version.id,
          name: version.name,
          timestamp: version.timestamp,
          state: version.state,
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase save error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('⚠️ Falling back to localStorage - versions will NOT be shared!');
        saveVersionToLocalStorage(version);
        return version;
      }

      console.log(`✅ Successfully saved version "${version.name}" to Supabase`);
      return {
        id: data.id,
        name: data.name,
        timestamp: data.timestamp,
        state: data.state,
      };
    } catch (error) {
      console.error('❌ Unexpected error saving version:', error);
      console.error('⚠️ Falling back to localStorage - versions will NOT be shared!');
      saveVersionToLocalStorage(version);
      return version;
    }
  },

  // Delete a version
  async delete(id: string): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not configured, falling back to localStorage');
      deleteVersionFromLocalStorage(id);
      return;
    }

    try {
      const { error } = await supabase
        .from('versions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting version:', error);
        deleteVersionFromLocalStorage(id);
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      deleteVersionFromLocalStorage(id);
    }
  },
};

// Fallback to localStorage functions
const VERSIONS_STORAGE_KEY = 'product-penetration-versions';

function loadVersionsFromLocalStorage(): SavedVersion[] {
  try {
    const stored = localStorage.getItem(VERSIONS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading versions from localStorage:', error);
    return [];
  }
}

function saveVersionToLocalStorage(version: SavedVersion): void {
  try {
    const versions = loadVersionsFromLocalStorage();
    const existingIndex = versions.findIndex(v => v.id === version.id);
    if (existingIndex >= 0) {
      versions[existingIndex] = version;
    } else {
      versions.push(version);
    }
    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(versions));
  } catch (error) {
    console.error('Error saving version to localStorage:', error);
  }
}

function deleteVersionFromLocalStorage(id: string): void {
  try {
    const versions = loadVersionsFromLocalStorage();
    const filtered = versions.filter(v => v.id !== id);
    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting version from localStorage:', error);
  }
}

