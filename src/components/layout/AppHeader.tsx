"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Cog } from 'lucide-react';
import { usePathname } from 'next/navigation';
import AppBrand from '@/components/branding/AppBrand';

const getTitle = (pathname: string) => {
  if (pathname.startsWith('/dashboard')) return "Tableau de Bord";
  if (pathname.startsWith('/consultation')) return "Consultations";
  if (pathname.startsWith('/medicaments')) return "Médicaments";
  if (pathname.startsWith('/vitals')) return "Mes Constantes";
  if (pathname.startsWith('/rendez-vous')) return "Rendez-vous";
  if (pathname.startsWith('/examens')) return "Examens Médicaux";
  if (pathname.startsWith('/patients/')) return "Dossier Patient";
  if (pathname.startsWith('/patients')) return "Patients";
  if (pathname.startsWith('/pharmacies')) return "Pharmacies de Garde";
  if (pathname.startsWith('/settings')) return "Paramètres";
  if (pathname.startsWith('/recommendations')) return "Recommandations IA";
  return "M'LAAFI";
}

const AppHeader: React.FC = () => {
  const pathname = usePathname();
  const title = getTitle(pathname);
  
  // We don't want to show the app title again if it's the main title
  const pageTitle = title !== "M'LAAFI" ? title : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
            <AppBrand
              direction="row"
              logoWidth={32}
              logoHeight={32}
              nameClassName="text-2xl"
            />
            {pageTitle && (
              <>
                <span className="hidden md:block h-6 w-px bg-border"></span>
                <h1 className="hidden md:block text-xl font-semibold text-muted-foreground whitespace-nowrap">{pageTitle}</h1>
              </>
            )}
        </div>
        <Link href="/settings" passHref>
          <Button variant="ghost" size="icon" aria-label="Paramètres">
            <Cog className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default AppHeader;
