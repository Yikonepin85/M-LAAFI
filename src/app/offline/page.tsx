
import AppBrand from '@/components/branding/AppBrand';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <AppBrand className="mb-6" />
      <WifiOff className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-2xl font-bold">Vous êtes hors ligne</h1>
      <p className="mt-2 text-muted-foreground">
        Il semble que vous n'ayez pas de connexion Internet. <br />
        Certaines fonctionnalités peuvent être limitées jusqu'à ce que vous soyez de nouveau en ligne.
      </p>
    </div>
  );
}
