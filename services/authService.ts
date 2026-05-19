import { supabase } from '@/lib/supabase';
import { userRepository } from '@/repositories/userRepository';
import { User } from '@/domain/models';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    const user = await userRepository.getById(data.user.id);
    if (!user) throw new Error('Usuario no encontrado');
    return user;
  },

  async register(params: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
    });
    if (error) {
      if (error.message.toLowerCase().includes('already')) throw new Error('El correo ya está registrado');
      throw new Error(error.message);
    }
    if (!data.user) throw new Error('Error al crear usuario');
    const user = await userRepository.create({
      id: data.user.id,
      fullName: params.fullName,
      phone: params.phone,
      email: params.email,
    });
    return user;
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async currentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return userRepository.getById(user.id);
  },
};
