import type { Role } from '@/lib/generated/enums';
import type { ModuleCategory, ModuleConfigurationPolicy } from '@/lib/modules/moduleCatalog';

export interface ModuleAccessGroupViewModel {
    id: string;
    key: string;
    name: string;
    archivedAt: Date | null;
}

export interface ModuleConfigurationViewModel {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
    sortOrder: number;
    href: string;
    category: ModuleCategory;
    allowedRoles: readonly Role[];
    allowedGroupIds: readonly string[];
    assignedGroups: readonly ModuleAccessGroupViewModel[];
    mandatoryRoles: readonly Role[];
    configuration: ModuleConfigurationPolicy;
    hasPersistentConfiguration: boolean;
    hasPersistentGroupAssignments: boolean;
}

export interface ModuleFormState {
    title: string;
    description: string;
    enabled: boolean;
    sortOrder: number;
    allowedRoles: Role[];
    allowedGroupIds: string[];
}
