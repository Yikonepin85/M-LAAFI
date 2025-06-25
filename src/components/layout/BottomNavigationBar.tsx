
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ClipboardList, Pill, CalendarDays, Users, HeartPulse, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/consultation', label: 'Consult.', icon: ClipboardList },
  { href: '/medicaments', label: 'Médic.', icon: Pill },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/rendez-vous', label: 'RDV', icon: CalendarDays },
  { href: '/vitals', label: 'Const.', icon: HeartPulse },
];

const BottomNavigationBar: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto grid h-16 max-w-lg grid-cols-6 items-center px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "flex h-full flex-col items-center justify-center space-y-1 rounded-none text-xs",
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
              asChild
            >
              <Link href={item.href}>
                <>
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span>{item.label}</span>
                </>
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigationBar;
