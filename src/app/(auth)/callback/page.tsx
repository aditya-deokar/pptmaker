
import { onAuthenticateUser } from '@/actions/user';
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic';

const AuthCallbackPage = async () => {
  const auth = await onAuthenticateUser();
  console.log(auth);

  if (auth.status === 200 || auth.status === 201) {
    redirect(`/dashboard`);
  } else if (auth.status === 403 || auth.status === 400 || auth.status === 500) {
    redirect('/sign-in');
  }
};

export default AuthCallbackPage;
