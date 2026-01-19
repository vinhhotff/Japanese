import { supabase } from '../config/supabase';

export type ItemType = 'vocabulary' | 'kanji' | 'grammar';

export interface NotebookItem {
    id: string;
    userId: string;
    itemType: ItemType;
    itemId: string;
    note?: string;
    createdAt: string;
}

// Add item to personal notebook
export const addToNotebook = async (userId: string, itemType: ItemType, itemId: string, note?: string) => {
    const { data, error } = await supabase
        .from('user_notebook')
        .insert({
            user_id: userId,
            item_type: itemType,
            item_id: itemId,
            note: note
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding to notebook:', error);
        throw error;
    }
    return data;
};

// Remove item from notebook
export const removeFromNotebook = async (userId: string, itemId: string) => {
    const { error } = await supabase
        .from('user_notebook')
        .delete()
        .eq('user_id', userId)
        .eq('item_id', itemId);

    if (error) {
        console.error('Error removing from notebook:', error);
        throw error;
    }
};

// Get all notebook items for user
export const getNotebookItems = async (userId: string): Promise<any[]> => {
    const { data, error } = await supabase
        .from('user_notebook')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notebook items:', error);
        return [];
    }
    return data;
};

// Check if item is in notebook
export const isInNotebook = async (userId: string, itemId: string): Promise<boolean> => {
    const { data, error } = await supabase
        .from('user_notebook')
        .select('id')
        .eq('user_id', userId)
        .eq('item_id', itemId)
        .maybeSingle();

    if (error) return false;
    return !!data;
};
