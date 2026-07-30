'use server';

import { revalidatePath } from 'next/cache';

import {
    accessGroupIdSchema,
    createAccessGroupSchema,
    updateAccessGroupSchema,
} from '@/lib/access-groups/accessGroupSchemas';
import { requireAdminSession } from '@/lib/auth/require-session';
import { Prisma } from '@/lib/generated/client';
import { prisma } from '@/lib/prisma';

import type {
    AccessGroupActionResult,
    CreateAccessGroupInput,
    UpdateAccessGroupInput,
} from './accessGroupActionTypes';

function revalidateAccessGroupRoutes() {
    revalidatePath('/dashboard');
    revalidatePath('/member-area');
    revalidatePath('/admin/groups');
    revalidatePath('/admin/users');
    revalidatePath('/admin/modules');
}

function isPrismaError(error: unknown, code: string): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export async function createAccessGroup(
    input: CreateAccessGroupInput
): Promise<AccessGroupActionResult> {
    await requireAdminSession();

    const validationResult = createAccessGroupSchema.safeParse(input);

    if (!validationResult.success) {
        return {
            success: false,
            message:
                validationResult.error.issues[0]?.message ?? 'Die Zugriffsgruppe ist ungültig.',
        };
    }

    try {
        await prisma.accessGroup.create({
            data: validationResult.data,
        });

        revalidateAccessGroupRoutes();

        return {
            success: true,
            message: 'Zugriffsgruppe erstellt.',
        };
    } catch (error) {
        if (isPrismaError(error, 'P2002')) {
            return {
                success: false,
                message: 'Dieser technische Gruppenschlüssel wird bereits verwendet.',
            };
        }

        console.error('Zugriffsgruppe konnte nicht erstellt werden.', error);

        return {
            success: false,
            message: 'Die Zugriffsgruppe konnte nicht erstellt werden.',
        };
    }
}

export async function updateAccessGroup(
    input: UpdateAccessGroupInput
): Promise<AccessGroupActionResult> {
    await requireAdminSession();

    const validationResult = updateAccessGroupSchema.safeParse(input);

    if (!validationResult.success) {
        return {
            success: false,
            message:
                validationResult.error.issues[0]?.message ?? 'Die Zugriffsgruppe ist ungültig.',
        };
    }

    const { groupId, name, description } = validationResult.data;

    try {
        const result = await prisma.accessGroup.updateMany({
            where: {
                id: groupId,
            },
            data: {
                name,
                description,
            },
        });

        if (result.count === 0) {
            return {
                success: false,
                message: 'Die angegebene Zugriffsgruppe wurde nicht gefunden.',
            };
        }

        revalidateAccessGroupRoutes();

        return {
            success: true,
            message: 'Zugriffsgruppe gespeichert.',
        };
    } catch (error) {
        console.error('Zugriffsgruppe konnte nicht gespeichert werden.', error);

        return {
            success: false,
            message: 'Die Zugriffsgruppe konnte nicht gespeichert werden.',
        };
    }
}

export async function archiveAccessGroup(groupId: string): Promise<AccessGroupActionResult> {
    await requireAdminSession();

    const validationResult = accessGroupIdSchema.safeParse(groupId);

    if (!validationResult.success) {
        return {
            success: false,
            message: validationResult.error.issues[0]?.message ?? 'Die Gruppen-ID ist ungültig.',
        };
    }

    try {
        const group = await prisma.accessGroup.findUnique({
            where: {
                id: validationResult.data,
            },
            select: {
                archivedAt: true,
            },
        });

        if (!group) {
            return {
                success: false,
                message: 'Die angegebene Zugriffsgruppe wurde nicht gefunden.',
            };
        }

        if (group.archivedAt) {
            return {
                success: true,
                message: 'Die Zugriffsgruppe ist bereits archiviert.',
            };
        }

        await prisma.accessGroup.update({
            where: {
                id: validationResult.data,
            },
            data: {
                archivedAt: new Date(),
            },
        });

        revalidateAccessGroupRoutes();

        return {
            success: true,
            message: 'Zugriffsgruppe archiviert.',
        };
    } catch (error) {
        console.error('Zugriffsgruppe konnte nicht archiviert werden.', error);

        return {
            success: false,
            message: 'Die Zugriffsgruppe konnte nicht archiviert werden.',
        };
    }
}

export async function restoreAccessGroup(groupId: string): Promise<AccessGroupActionResult> {
    await requireAdminSession();

    const validationResult = accessGroupIdSchema.safeParse(groupId);

    if (!validationResult.success) {
        return {
            success: false,
            message: validationResult.error.issues[0]?.message ?? 'Die Gruppen-ID ist ungültig.',
        };
    }

    try {
        const group = await prisma.accessGroup.findUnique({
            where: {
                id: validationResult.data,
            },
            select: {
                archivedAt: true,
            },
        });

        if (!group) {
            return {
                success: false,
                message: 'Die angegebene Zugriffsgruppe wurde nicht gefunden.',
            };
        }

        if (!group.archivedAt) {
            return {
                success: true,
                message: 'Die Zugriffsgruppe ist bereits aktiv.',
            };
        }

        await prisma.accessGroup.update({
            where: {
                id: validationResult.data,
            },
            data: {
                archivedAt: null,
            },
        });

        revalidateAccessGroupRoutes();

        return {
            success: true,
            message: 'Zugriffsgruppe wiederhergestellt.',
        };
    } catch (error) {
        console.error('Zugriffsgruppe konnte nicht wiederhergestellt werden.', error);

        return {
            success: false,
            message: 'Die Zugriffsgruppe konnte nicht wiederhergestellt werden.',
        };
    }
}

export async function deleteAccessGroup(groupId: string): Promise<AccessGroupActionResult> {
    await requireAdminSession();

    const validationResult = accessGroupIdSchema.safeParse(groupId);

    if (!validationResult.success) {
        return {
            success: false,
            message: validationResult.error.issues[0]?.message ?? 'Die Gruppen-ID ist ungültig.',
        };
    }

    try {
        const outcome = await prisma.$transaction(async (transaction) => {
            const group = await transaction.accessGroup.findUnique({
                where: {
                    id: validationResult.data,
                },
                select: {
                    _count: {
                        select: {
                            members: true,
                            modules: true,
                        },
                    },
                },
            });

            if (!group) {
                return {
                    status: 'not-found' as const,
                };
            }

            if (group._count.members > 0 || group._count.modules > 0) {
                return {
                    status: 'in-use' as const,
                    memberCount: group._count.members,
                    moduleCount: group._count.modules,
                };
            }

            await transaction.accessGroup.delete({
                where: {
                    id: validationResult.data,
                },
            });

            return {
                status: 'deleted' as const,
            };
        });

        if (outcome.status === 'not-found') {
            return {
                success: false,
                message: 'Die angegebene Zugriffsgruppe wurde nicht gefunden.',
            };
        }

        if (outcome.status === 'in-use') {
            return {
                success: false,
                message:
                    `Die Gruppe wird noch von ${outcome.memberCount} Benutzer(n) und ` +
                    `${outcome.moduleCount} Modul(en) verwendet.`,
            };
        }

        revalidateAccessGroupRoutes();

        return {
            success: true,
            message: 'Zugriffsgruppe endgültig gelöscht.',
        };
    } catch (error) {
        if (isPrismaError(error, 'P2003')) {
            return {
                success: false,
                message: 'Die Zugriffsgruppe wird noch verwendet und kann nicht gelöscht werden.',
            };
        }

        console.error('Zugriffsgruppe konnte nicht gelöscht werden.', error);

        return {
            success: false,
            message: 'Die Zugriffsgruppe konnte nicht gelöscht werden.',
        };
    }
}
