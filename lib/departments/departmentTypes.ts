export interface DepartmentViewModel {
    id: string;
    name: string;
    description: string | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    memberCount: number;
}
