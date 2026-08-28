import { auth } from '../lib/auth';

(async () => {
  try {
    console.log('auth keys:', Object.keys(auth));
    if ((auth as any).api) {
      console.log('auth.api keys:', Object.keys((auth as any).api));
    }
  } catch (err) {
    console.error('error listing auth api', err);
  }
})();
