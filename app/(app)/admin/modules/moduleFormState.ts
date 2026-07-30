import type { ModuleConfigurationViewModel, ModuleFormState } from './moduleManagementTypes';
import { getModuleDefinition } from '@/lib/modules/moduleCatalog';

export function createInitialModuleFormState(
    module: ModuleConfigurationViewModel
): ModuleFormState {
    return {
        title: module.title,
        description: module.description,
        enabled: module.enabled,
        sortOrder: module.sortOrder,
        allowedRoles: [...module.allowedRoles],
        allowedGroupIds: [...module.allowedGroupIds],
    };
}

export function createDefaultModuleFormState(moduleId: string): ModuleFormState | undefined {
    const definition = getModuleDefinition(moduleId);

    if (!definition) {
        return undefined;
    }

    return {
        title: definition.defaultTitle,
        description: definition.defaultDescription,
        enabled: true,
        sortOrder: definition.defaultSortOrder,
        allowedRoles: [
            ...new Set([...definition.defaultAllowedRoles, ...definition.mandatoryRoles]),
        ],
        allowedGroupIds: [],
    };
}
