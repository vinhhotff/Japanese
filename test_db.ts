import { supabase } from './src/config/supabase';
async function test() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log('Profiles:', { data, error });
  const { data: roles, error: rolesError } = await supabase.from('user_roles').select('*').limit(1);
  console.log('User Roles:', { roles, rolesError });
}
test();
