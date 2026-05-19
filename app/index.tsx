import { Redirect } from 'expo-router';
import { useSession } from '@/hooks/useSession';

export default function Index() {
  const { session, loading } = useSession();
  if (loading) return null;
  return <Redirect href={session ? '/(tabs)' : '/(auth)/login'} />;
}
