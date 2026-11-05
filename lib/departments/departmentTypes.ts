export interface DepartmentMemberViewModel {
    userId: string;
    sc_handle: string;
    status: string;
    role: 'MEMBER' | 'MANAGER';
}

export interface DepartmentViewModel {
    id: string;
    name: string;
    description: string | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    memberCount: number;
    members: DepartmentMemberViewModel[];
}
