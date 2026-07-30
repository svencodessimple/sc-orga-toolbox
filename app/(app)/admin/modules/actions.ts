'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireAdminSession } from '@/lib/auth/require-session';
import { Role } from '@/lib/generated/enums';
import { getModuleDefinition } from '@/lib/modules/moduleCatalog';
import { prisma } from '@/lib/prisma';
import { accessGroupIdSchema } from '@/lib/access-groups/accessGroupSchemas';

import type { ModuleActionResult, SaveModuleConfigurationInput } from './moduleActionTypes';

const roleSchema = z.enum([Role.GUEST, Role.MEMBER, Role.ADMIN]);

const saveModuleConfigurationSchema = z.object({
    moduleId: z.string().trim().min(1, 'Die Modul-ID fehlt.'),
    title: z
        .string()
        .trim()
        .min(1, 'Der Titel muss mindestens ein Zeichen enthalten.')
        .max(80, 'Der Titel darf höchstens 80 Zeichen enthalten.'),
    description: z
        .string()
        .trim()
        .min(1, 'Die Beschreibung muss mindestens ein Zeichen enthalten.')
        .max(300, 'Die Beschreibung darf höchstens 300 Zeichen enthalten.'),
    enabled: z.boolean(),
    sortOrder: z
        .number()
        .int('Die Sortierreihenfolge muss eine ganze Zahl sein.')
        .min(0, 'Die Sortierreihenfolge darf nicht kleiner als 0 sein.')
        .max(9999, 'Die Sortierreihenfolge darf nicht größer als 9999 sein.'),
    allowedRoles: z.array(roleSchema).max(3),
    allowedGroupIds: z
        .array(accessGroupIdSchema)
        .max(100, 'Es können höchstens 100 Gruppen freigegeben werden.')
        .transform((groupIds) => [...new Set(groupIds)]),
});

const moduleIdSchema = z.string().trim().min(1);

function revalidateModuleRoutes() {
    revalidatePath('/dashboard');
    revalidatePath('/member-area');
    revalidatePath('/admin/modules');
    revalidatePath('/admin/groups');
}

export async function saveModuleConfiguration(
    input: SaveModuleConfigurationInput
): Promise<ModuleActionResult> {
    await requireAdminSession();

    const validationResult = saveModuleConfigurationSchema.safeParse(input);

    if (!validationResult.success) {
        return {
            success: false,
            message:
                validationResult.error.issues[0]?.message ?? 'Die Modulkonfiguration ist ungültig.',
        };
    }

    const data = validationResult.data;
    const definition = getModuleDefinition(data.moduleId);

    if (!definition) {
        return {
            success: false,
            message: 'Das angegebene technische Modul ist nicht bekannt.',
        };
    }

    const requestedRoles = [...new Set(data.allowedRoles)];

    const effectiveRoles = definition.configuration.allowedRoles
        ? [...new Set([...requestedRoles, ...definition.mandatoryRoles])]
        : [...new Set([...definition.defaultAllowedRoles, ...definition.mandatoryRoles])];

    const requestedGroupIds = data.allowedGroupIds;

    if (!definition.configuration.allowedGroups && requestedGroupIds.length > 0) {
        return {
            success: false,
            message: 'Dieses technische Modul unterstützt keine Gruppenfreigaben.',
        };
    }

    const title = definition.configuration.title ? data.title : null;
    const description = definition.configuration.description ? data.description : null;
    const enabled = definition.configuration.enabled ? data.enabled : true;
    const sortOrder = definition.configuration.sortOrder
        ? data.sortOrder
        : definition.defaultSortOrder;

    const hasAccessPath =
        effectiveRoles.length > 0 ||
        (definition.configuration.allowedGroups && requestedGroupIds.length > 0);

    if (enabled && !hasAccessPath) {
        return {
            success: false,
            message:
                'Ein aktiviertes Modul muss für mindestens eine effektive Rolle oder Zugriffsgruppe freigegeben sein.',
        };
    }

    const persistedRoles = definition.configuration.allowedRoles ? requestedRoles : [];

    try {
        const outcome = await prisma.$transaction(async (transaction) => {
            if (definition.configuration.allowedGroups) {
                const requestedGroups = await transaction.accessGroup.findMany({
                    where: {
                        id: {
                            in: requestedGroupIds,
                        },
                    },
                    select: {
                        id: true,
                        archivedAt: true,
                    },
                });

                if (requestedGroups.length !== requestedGroupIds.length) {
                    return {
                        status: 'unknown-group' as const,
                    };
                }

                if (requestedGroups.some((group) => group.archivedAt !== null)) {
                    return {
                        status: 'archived-group' as const,
                    };
                }
            }

            await transaction.moduleConfiguration.upsert({
                where: {
                    moduleId: definition.id,
                },
                create: {
                    moduleId: definition.id,
                    title,
                    description,
                    enabled,
                    sortOrder,
                },
                update: {
                    title,
                    description,
                    enabled,
                    sortOrder,
                },
            });

            await transaction.moduleAllowedRole.deleteMany({
                where: {
                    moduleId: definition.id,
                },
            });

            if (persistedRoles.length > 0) {
                await transaction.moduleAllowedRole.createMany({
                    data: persistedRoles.map((role) => ({
                        moduleId: definition.id,
                        role,
                    })),
                });
            }

            if (definition.configuration.allowedGroups) {
                const existingActiveAssignments = await transaction.moduleAccessGroup.findMany({
                    where: {
                        moduleId: definition.id,
                        group: {
                            archivedAt: null,
                        },
                    },
                    select: {
                        groupId: true,
                    },
                });

                const existingGroupIds = new Set(
                    existingActiveAssignments.map(({ groupId }) => groupId)
                );
                const nextGroupIds = new Set(requestedGroupIds);

                const groupIdsToRemove = [...existingGroupIds].filter(
                    (groupId) => !nextGroupIds.has(groupId)
                );

                const groupIdsToAdd = requestedGroupIds.filter(
                    (groupId) => !existingGroupIds.has(groupId)
                );

                if (groupIdsToRemove.length > 0) {
                    await transaction.moduleAccessGroup.deleteMany({
                        where: {
                            moduleId: definition.id,
                            groupId: {
                                in: groupIdsToRemove,
                            },
                        },
                    });
                }

                if (groupIdsToAdd.length > 0) {
                    await transaction.moduleAccessGroup.createMany({
                        data: groupIdsToAdd.map((groupId) => ({
                            moduleId: definition.id,
                            groupId,
                        })),
                    });
                }
            }

            return {
                status: 'saved' as const,
            };
        });

        if (outcome.status === 'unknown-group') {
            return {
                success: false,
                message: 'Mindestens eine Zugriffsgruppe ist nicht bekannt.',
            };
        }

        if (outcome.status === 'archived-group') {
            return {
                success: false,
                message: 'Archivierte Zugriffsgruppen können nicht neu freigegeben werden.',
            };
        }

        revalidateModuleRoutes();

        return {
            success: true,
            message: 'Modulkonfiguration gespeichert.',
        };
    } catch (error) {
        console.error('Modulkonfiguration konnte nicht gespeichert werden.', error);

        return {
            success: false,
            message: 'Die Modulkonfiguration konnte nicht gespeichert werden.',
        };
    }
}

export async function resetModuleConfiguration(moduleId: string): Promise<ModuleActionResult> {
    await requireAdminSession();

    const validationResult = moduleIdSchema.safeParse(moduleId);

    if (!validationResult.success) {
        return {
            success: false,
            message: 'Die Modul-ID ist ungültig.',
        };
    }

    const definition = getModuleDefinition(validationResult.data);

    if (!definition) {
        return {
            success: false,
            message: 'Das angegebene technische Modul ist nicht bekannt.',
        };
    }

    try {
        await prisma.$transaction([
            prisma.moduleAccessGroup.deleteMany({
                where: {
                    moduleId: definition.id,
                },
            }),
            prisma.moduleConfiguration.deleteMany({
                where: {
                    moduleId: definition.id,
                },
            }),
        ]);

        revalidateModuleRoutes();

        return {
            success: true,
            message: 'Das Modul wurde auf die Standardwerte zurückgesetzt.',
        };
    } catch (error) {
        console.error('Modulkonfiguration konnte nicht zurückgesetzt werden.', error);

        return {
            success: false,
            message: 'Das Modul konnte nicht zurückgesetzt werden.',
        };
    }
}
