import type { Role } from '@/lib/generated/enums';

export interface SaveModuleConfigurationInput {
    moduleId: string;
    title: string;
    description: string;
    enabled: boolean;
    sortOrder: number;
    allowedRoles: Role[];
    allowedGroupIds: string[];
}

export interface ModuleActionResult {
    success: boolean;
    message: string;
}
