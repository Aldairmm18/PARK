import { supabase } from '@/lib/supabase';
import { User } from '@/domain/models';

export const userRepository = {
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data ? mapUser(data) : null;
  },

  async create(params: { id: string; fullName: string; phone: string; email: string }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({ id: params.id, full_name: params.fullName, phone: params.phone, email: params.email })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapUser(data);
  },
};

function mapUser(row: any): User {
  return {
    id:        row.id,
    fullName:  row.full_name,
    phone:     row.phone ?? '',
    email:     row.email,
    status:    row.status,
    createdAt: row.created_at,
  };
}
