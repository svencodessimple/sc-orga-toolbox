'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { TerminalButton } from '@/components/mobiglas/TerminalButton';
import { TerminalPanel } from '@/components/mobiglas/TerminalPanel';

import { createDepartment } from '../actions';

export function DepartmentCreateForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        startTransition(async () => {
            const result = await createDepartment({
                name,
                description,
            });

            if (!result.success) {
                toast.error(result.message);
                return;
            }

            setName('');
            setDescription('');

            toast.success(result.message);
            router.refresh();
        });
    }

    return (
        <TerminalPanel className="max-w-none">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <p className="eyebrow">
                        <span className="eyebrow-dot" />
                        Neue Abteilung
                    </p>
                    <h2 className="mt-2 font-display text-xl uppercase tracking-wider text-text">
                        Abteilung erstellen
                    </h2>
                </div>

                <label className="block">
                    <span className="mb-2 block font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                        Name
                    </span>
                    <input
                        type="text"
                        required
                        maxLength={80}
                        value={name}
                        disabled={isPending}
                        placeholder="z. B. Salvage"
                        onChange={(event) => setName(event.target.value)}
                        className="w-full border border-line bg-panel-alt px-3 py-2 text-sm text-text outline-none transition focus:border-cyan disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </label>

                <label className="block">
                    <span className="mb-2 block font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                        Beschreibung
                    </span>
                    <textarea
                        rows={3}
                        maxLength={300}
                        value={description}
                        disabled={isPending}
                        placeholder="Optionale Beschreibung der Abteilung."
                        onChange={(event) => setDescription(event.target.value)}
                        className="w-full resize-y border border-line bg-panel-alt px-3 py-2 text-sm leading-6 text-text outline-none transition focus:border-cyan disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </label>

                <div className="flex justify-end border-t border-line pt-5">
                    <TerminalButton type="submit" className="w-auto!" disabled={isPending}>
                        {isPending ? 'Abteilung wird erstellt …' : 'Abteilung erstellen'}
                    </TerminalButton>
                </div>
            </form>
        </TerminalPanel>
    );
}
