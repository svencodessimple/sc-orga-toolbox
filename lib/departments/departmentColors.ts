export const DEPARTMENT_COLORS = [
    { value: '#3B82F6', label: 'Blau' },
    { value: '#10B981', label: 'Grün' },
    { value: '#F59E0B', label: 'Amber' },
    { value: '#8B5CF6', label: 'Violett' },
    { value: '#F43F5E', label: 'Rosa' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#F97316', label: 'Orange' },
    { value: '#84CC16', label: 'Limette' },
] as const;

export async function getNextDepartmentColor(
    prisma: typeof import('@/lib/prisma').prisma
): Promise<string> {
    const departments = await prisma.department.findMany({
        select: { color: true },
    });

    const usedColors = new Set(departments.map((department) => department.color));

    return (
        DEPARTMENT_COLORS.find((color) => !usedColors.has(color.value))?.value ??
        DEPARTMENT_COLORS[Math.floor(Math.random() * DEPARTMENT_COLORS.length)].value
    );
}
