interface DepartmentGeneralFieldsProps {
    name: string;
    description: string;
    isPending: boolean;
    onNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
}

export function DepartmentGeneralFields({
    name,
    description,
    isPending,
    onNameChange,
    onDescriptionChange,
}: DepartmentGeneralFieldsProps) {
    return (
        <>
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
                    onChange={(event) => onNameChange(event.target.value)}
                    className="w-full border border-line bg-panel-alt px-3 py-2 text-sm text-text outline-none transition focus:border-cyan disabled:opacity-50"
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
                    onChange={(event) => onDescriptionChange(event.target.value)}
                    className="w-full resize-y border border-line bg-panel-alt px-3 py-2 text-sm leading-6 text-text outline-none transition focus:border-cyan disabled:opacity-50"
                />
            </label>
        </>
    );
}
