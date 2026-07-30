interface AccessGroupGeneralFieldsProps {
    groupKey: string;
    name: string;
    description: string;
    isPending: boolean;
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
}

export function AccessGroupGeneralFields({
    groupKey,
    name,
    description,
    isPending,
    onNameChange,
    onDescriptionChange,
}: AccessGroupGeneralFieldsProps) {
    return (
        <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
                <label className="block">
                    <span className="mb-2 block font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                        Technischer Schlüssel
                    </span>

                    <input
                        type="text"
                        readOnly
                        value={groupKey}
                        className="w-full cursor-not-allowed border border-line bg-panel-alt px-3 py-2 font-mono text-sm text-text-dim outline-none opacity-70"
                    />

                    <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.08em] text-amber">
                        Nach Erstellung unveränderlich
                    </span>
                </label>

                <label className="block">
                    <span className="mb-2 block font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                        Anzeigename
                    </span>

                    <input
                        type="text"
                        required
                        maxLength={80}
                        value={name}
                        disabled={isPending}
                        onChange={(event) => onNameChange(event.target.value)}
                        className="w-full border border-line bg-panel-alt px-3 py-2 text-sm text-text outline-none transition focus:border-cyan disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </label>
            </div>

            <label className="block">
                <span className="mb-2 block font-mono text-xs uppercase tracking-[0.08em] text-text-dim">
                    Beschreibung
                </span>

                <textarea
                    rows={3}
                    maxLength={300}
                    value={description}
                    disabled={isPending}
                    onChange={(event) => onDescriptionChange(event.target.value)}
                    className="w-full resize-y border border-line bg-panel-alt px-3 py-2 text-sm leading-6 text-text outline-none transition focus:border-cyan disabled:cursor-not-allowed disabled:opacity-50"
                />
            </label>
        </div>
    );
}
