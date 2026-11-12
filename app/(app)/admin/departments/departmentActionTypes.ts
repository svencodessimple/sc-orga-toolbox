export interface CreateDepartmentInput {
    name: string;
    description?: string | null;
}

export interface UpdateDepartmentInput {
    departmentId: string;
    name: string;
    description?: string | null;
    color: string;
}

export interface DepartmentActionResult {
    success: boolean;
    message: string;
}
