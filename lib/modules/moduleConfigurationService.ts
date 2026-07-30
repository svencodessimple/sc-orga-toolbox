import 'server-only';

import type { Role } from '@/lib/generated/enums';
import { prisma } from '@/lib/prisma';
import {
    getActiveGroupIdsByModule,
    getActiveGroupIdsForUser,
} from '@/lib/access-groups/accessGroupService';

import {
    getModuleDefinition,
    moduleDefinitions,
    type ModuleCategory,
    type ModuleConfigurationPolicy,
    type ModuleDefinition,
} from './moduleCatalog';

export interface StoredModuleConfiguration {
    moduleId: string;
    title: string | null;
    description: string | null;
    enabled: boolean;
    sortOrder: number;
    allowedRoles: readonly {
        role: Role;
    }[];
}

export interface EffectiveModuleConfiguration {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
    sortOrder: number;
    href: string;
    category: ModuleCategory;
    allowedRoles: readonly Role[];
    allowedGroupIds: readonly string[];
    mandatoryRoles: readonly Role[];
    configuration: ModuleConfigurationPolicy;
    hasPersistentConfiguration: boolean;
}

export interface ModuleAssignedAccessGroup {
    id: string;
    key: string;
    name: string;
    archivedAt: Date | null;
}

export interface ModuleManagementConfiguration extends EffectiveModuleConfiguration {
    assignedGroups: readonly ModuleAssignedAccessGroup[];
    hasPersistentGroupAssignments: boolean;
}

export interface ModuleAccessSubject {
    userId: string;
    role: Role;
}

export interface ModuleAccessRequest extends ModuleAccessSubject {
    moduleId: string;
}

function mergeRoles(...roleGroups: readonly (readonly Role[])[]): Role[] {
    const roles = new Set<Role>();

    for (const roleGroup of roleGroups) {
        for (const role of roleGroup) {
            roles.add(role);
        }
    }

    return [...roles];
}

function resolveAllowedRoles(
    definition: ModuleDefinition,
    storedConfiguration: StoredModuleConfiguration | undefined
): Role[] {
    const configuredRoles =
        definition.configuration.allowedRoles && storedConfiguration
            ? storedConfiguration.allowedRoles.map(({ role }) => role)
            : definition.defaultAllowedRoles;

    return mergeRoles(configuredRoles, definition.mandatoryRoles);
}

function resolveAllowedGroupIds(
    definition: ModuleDefinition,
    activeGroupIdsByModule: ReadonlyMap<string, readonly string[]>
): string[] {
    if (!definition.configuration.allowedGroups) {
        return [];
    }

    return [...new Set(activeGroupIdsByModule.get(definition.id) ?? [])];
}

export function resolveEffectiveModuleConfigurations(
    storedConfigurations: readonly StoredModuleConfiguration[],
    activeGroupIdsByModule: ReadonlyMap<string, readonly string[]> = new Map()
): EffectiveModuleConfiguration[] {
    const storedConfigurationsByModuleId = new Map(
        storedConfigurations.map((configuration) => [configuration.moduleId, configuration])
    );

    const definitionOrder = new Map(
        moduleDefinitions.map((definition, index) => [definition.id, index])
    );

    return moduleDefinitions
        .map((definition) => {
            const storedConfiguration = storedConfigurationsByModuleId.get(definition.id);

            return {
                id: definition.id,
                title:
                    definition.configuration.title && storedConfiguration?.title
                        ? storedConfiguration.title
                        : definition.defaultTitle,
                description:
                    definition.configuration.description && storedConfiguration?.description
                        ? storedConfiguration.description
                        : definition.defaultDescription,
                enabled: definition.configuration.enabled
                    ? (storedConfiguration?.enabled ?? true)
                    : true,
                sortOrder: definition.configuration.sortOrder
                    ? (storedConfiguration?.sortOrder ?? definition.defaultSortOrder)
                    : definition.defaultSortOrder,
                href: definition.href,
                category: definition.category,
                allowedRoles: resolveAllowedRoles(definition, storedConfiguration),
                allowedGroupIds: resolveAllowedGroupIds(definition, activeGroupIdsByModule),
                mandatoryRoles: [...definition.mandatoryRoles],
                configuration: definition.configuration,
                hasPersistentConfiguration: storedConfiguration !== undefined,
            };
        })
        .sort((left, right) => {
            const sortOrderDifference = left.sortOrder - right.sortOrder;

            if (sortOrderDifference !== 0) {
                return sortOrderDifference;
            }

            return (
                (definitionOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
                (definitionOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER)
            );
        });
}

export async function getEffectiveModuleConfigurations(): Promise<EffectiveModuleConfiguration[]> {
    const [storedConfigurations, activeGroupIdsByModule] = await Promise.all([
        prisma.moduleConfiguration.findMany({
            include: {
                allowedRoles: {
                    select: {
                        role: true,
                    },
                },
            },
        }),
        getActiveGroupIdsByModule(),
    ]);

    return resolveEffectiveModuleConfigurations(storedConfigurations, activeGroupIdsByModule);
}

export async function getVisibleModulesForUser({
    userId,
    role,
}: ModuleAccessSubject): Promise<EffectiveModuleConfiguration[]> {
    const [modules, activeUserGroupIds] = await Promise.all([
        getEffectiveModuleConfigurations(),
        getActiveGroupIdsForUser(userId),
    ]);

    const activeUserGroupIdSet = new Set(activeUserGroupIds);

    return modules.filter((module) => hasModuleAccess(module, role, activeUserGroupIdSet));
}

export async function canUserAccessModule({
    moduleId,
    userId,
    role,
}: ModuleAccessRequest): Promise<boolean> {
    if (!getModuleDefinition(moduleId)) {
        return false;
    }

    const [modules, activeUserGroupIds] = await Promise.all([
        getEffectiveModuleConfigurations(),
        getActiveGroupIdsForUser(userId),
    ]);

    const targetModule = modules.find((candidate) => candidate.id === moduleId);

    if (!targetModule) {
        return false;
    }

    return hasModuleAccess(targetModule, role, new Set(activeUserGroupIds));
}

export async function getModuleManagementConfigurations(): Promise<
    ModuleManagementConfiguration[]
> {
    const [storedConfigurations, assignments] = await Promise.all([
        prisma.moduleConfiguration.findMany({
            include: {
                allowedRoles: {
                    select: {
                        role: true,
                    },
                },
            },
        }),
        prisma.moduleAccessGroup.findMany({
            select: {
                moduleId: true,
                group: {
                    select: {
                        id: true,
                        key: true,
                        name: true,
                        archivedAt: true,
                    },
                },
            },
        }),
    ]);

    const assignedGroupsByModule = new Map<string, ModuleAssignedAccessGroup[]>();

    const activeGroupIdsByModule = new Map<string, string[]>();

    for (const assignment of assignments) {
        const assignedGroups = assignedGroupsByModule.get(assignment.moduleId) ?? [];

        assignedGroups.push(assignment.group);
        assignedGroupsByModule.set(assignment.moduleId, assignedGroups);

        if (!assignment.group.archivedAt) {
            const activeGroupIds = activeGroupIdsByModule.get(assignment.moduleId) ?? [];

            activeGroupIds.push(assignment.group.id);
            activeGroupIdsByModule.set(assignment.moduleId, activeGroupIds);
        }
    }

    for (const groups of assignedGroupsByModule.values()) {
        groups.sort((left, right) => left.name.localeCompare(right.name, 'de'));
    }

    const modules = resolveEffectiveModuleConfigurations(
        storedConfigurations,
        activeGroupIdsByModule
    );

    return modules.map((module) => {
        const assignedGroups = assignedGroupsByModule.get(module.id) ?? [];

        return {
            ...module,

            // Gesperrte Kernmodule zeigen manipulierte Zuordnungen
            // nicht als wirksame Freigabe an.
            assignedGroups: module.configuration.allowedGroups ? assignedGroups : [],

            // Der Reset bleibt trotzdem verfügbar, damit auch
            // manipulierte Zuordnungen entfernt werden können.
            hasPersistentGroupAssignments: assignedGroups.length > 0,
        };
    });
}

export function hasModuleAccess(
    targetModule: EffectiveModuleConfiguration,
    userRole: Role,
    activeUserGroupIds: ReadonlySet<string>
): boolean {
    if (!targetModule.enabled) {
        return false;
    }

    if (targetModule.allowedRoles.includes(userRole)) {
        return true;
    }

    return targetModule.allowedGroupIds.some((groupId) => activeUserGroupIds.has(groupId));
}
