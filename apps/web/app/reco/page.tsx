import { redirect } from 'next/navigation';

/**
 * /reco - OAuth callback landing page
 * Redirects to home page (/) where auth state is checked
 * This page exists to provide a valid route for OAuth redirectTo
 */
export default function RecoPage() {
  redirect('/');
}
