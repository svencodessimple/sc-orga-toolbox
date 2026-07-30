export interface CreateAccessGroupInput {
    key: string;
    name: string;
    description?: string | null;
}

export interface UpdateAccessGroupInput {
    groupId: string;
    name: string;
    description?: string | null;
}

export interface AccessGroupActionResult {
    success: boolean;
    message: string;
}
