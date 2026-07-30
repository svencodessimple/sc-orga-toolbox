import { Role } from '@/lib/generated/enums';

export type ModuleCategory = 'module' | 'administration';

export interface ModuleConfigurationPolicy {
    title: boolean;
    description: boolean;
    enabled: boolean;
    sortOrder: boolean;
    allowedRoles: boolean;
    allowedGroups: boolean;
}

export interface ModuleDefinition {
    id: string;
    defaultTitle: string;
    defaultDescription: string;
    defaultSortOrder: number;
    href: string;
    category: ModuleCategory;
    defaultAllowedRoles: readonly Role[];
    mandatoryRoles: readonly Role[];
    configuration: ModuleConfigurationPolicy;
}

/**
 * Darstellungstyp für Module im Dashboard.
 */
export interface ToolboxModule {
    id: string;
    title: string;
    description: string;
    sortOrder: number;
    href: string;
    category: ModuleCategory;
    allowedRoles: readonly Role[];
}

export const moduleDefinitions = [
    {
        id: 'member-management',
        defaultTitle: 'Mitgliederverwaltung',
        defaultDescription: 'Mitglieder freischalten, sperren und Rollen verwalten.',
        defaultSortOrder: 100,
        href: '/admin/users',
        category: 'administration',
        defaultAllowedRoles: [Role.ADMIN],
        mandatoryRoles: [Role.ADMIN],
        configuration: {
            title: true,
            description: true,
            enabled: false,
            sortOrder: true,
            allowedRoles: false,
            allowedGroups: false,
        },
    },
    {
        id: 'module-management',
        defaultTitle: 'Modulverwaltung',
        defaultDescription: 'Module aktivieren, konfigurieren und sortieren.',
        defaultSortOrder: 200,
        href: '/admin/modules',
        category: 'administration',
        defaultAllowedRoles: [Role.ADMIN],
        mandatoryRoles: [Role.ADMIN],
        configuration: {
            title: true,
            description: true,
            enabled: false,
            sortOrder: true,
            allowedRoles: false,
            allowedGroups: false,
        },
    },
    {
        id: 'group-management',
        defaultTitle: 'Zugriffsgruppen',
        defaultDescription: 'Zugriffsgruppen erstellen und Berechtigungen verwalten.',
        defaultSortOrder: 300,
        href: '/admin/groups',
        category: 'administration',
        defaultAllowedRoles: [Role.ADMIN],
        mandatoryRoles: [Role.ADMIN],
        configuration: {
            title: true,
            description: true,
            enabled: false,
            sortOrder: true,
            allowedRoles: false,
            allowedGroups: false,
        },
    },
    {
        id: 'member-area',
        defaultTitle: 'Mitgliederbereich',
        defaultDescription: 'Persönliche Übersicht und freigegebene Organisationsinhalte.',
        defaultSortOrder: 100,
        href: '/member-area',
        category: 'module',
        defaultAllowedRoles: [Role.MEMBER, Role.ADMIN],
        mandatoryRoles: [],
        configuration: {
            title: true,
            description: true,
            enabled: true,
            sortOrder: true,
            allowedRoles: true,
            allowedGroups: true,
        },
    },
] satisfies readonly ModuleDefinition[];

export function getModuleDefinition(moduleId: string): ModuleDefinition | undefined {
    return moduleDefinitions.find((definition) => definition.id === moduleId);
}
