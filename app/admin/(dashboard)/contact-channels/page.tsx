// app/admin/(dashboard)/contact-channels/page.tsx
// Module 12: Contact Channels Management (Clean Architecture Presentation Layer)

import { connection } from 'next/server';
import { CompositionRoot } from '../../../../src/infrastructure/composition-root';
import { ContactChannelListClient } from './ContactChannelListClient';

export const instant = false;

export default async function ContactChannelsPage() {
  await connection();
  const getContactChannelsUseCase = CompositionRoot.getGetContactChannelsUseCase();
  const channels = await getContactChannelsUseCase.execute();

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <header className="pb-5 border-b border-[var(--border-subtle)] flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-mono tracking-widest text-[var(--accent-cobalt)]">
            Contact Section
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Contact Channels
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 max-w-2xl leading-relaxed">
            Manage direct communication channels (Email, GitHub, LinkedIn, Socials) and display order on the public portfolio.
          </p>
        </div>
      </header>

      {/* Main Collection View */}
      <ContactChannelListClient initialChannels={channels} />
    </div>
  );
}
