'use server';

import { revalidatePath } from 'next/cache';

import {
    createDepartmentSchema,
    departmentIdSchema,
    updateDepartmentSchema,
} from '@/lib/departments/departmentSchemas';
import { requireAdminSession } from '@/lib/auth/require-session';
import { prisma } from '@/lib/prisma';

import type {
    CreateDepartmentInput,
    DepartmentActionResult,
    UpdateDepartmentInput,
} from './departmentActionTypes';
import {
    assignDepartmentMemberSchema,
    removeDepartmentMemberSchema,
    searchDepartmentMembersSchema,
    updateDepartmentMemberRoleSchema,
} from '@/lib/departments/departmentMembershipSchemas';
import { UserStatus } from '@/lib/generated/browser';
import { searchAvailableDepartmentMembers } from '@/lib/departments/departmentMembershipService';

function revalidateDepartmentRoutes() {
    revalidatePath('/admin/departments');
}

async function getActiveDepartment(departmentId: string) {
    return prisma.department.findFirst({
        where: {
            id: departmentId,
            archivedAt: null,
        },
        select: { id: true },
    });
}

export async function createDepartment(
    input: CreateDepartmentInput
): Promise<DepartmentActionResult> {
    await requireAdminSession();

    const validationResult = createDepartmentSchema.safeParse(input);

    if (!validationResult.success) {
        return {
            success: false,
            message: validationResult.error.issues[0]?.message ?? 'Die Abteilung ist ungültig.',
        };
    }

    try {
        await prisma.department.create({
            data: validationResult.data,
        });

        revalidateDepartmentRoutes();

        return {
            success: true,
            message: 'Abteilung erstellt.',
        };
    } catch (error) {
        console.error('Abteilung konnte nicht erstellt werden.', error);

        return {
            success: false,
            message: 'Die Abteilung konnte nicht erstellt werden.',
        };
    }
}

export async function updateDepartment(
    input: UpdateDepartmentInput
): Promise<DepartmentActionResult> {
    await requireAdminSession();

    const validationResult = updateDepartmentSchema.safeParse(input);

    if (!validationResult.success) {
        return {
            success: false,
            message: validationResult.error.issues[0]?.message ?? 'Die Abteilung ist ungültig.',
        };
    }

    const { departmentId, name, description } = validationResult.data;

    try {
        const result = await prisma.department.updateMany({
            where: {
                id: departmentId,
            },
            data: {
                name,
                description,
            },
        });

        if (result.count === 0) {
            return {
                success: false,
                message: 'Die angegebene Abteilung wurde nicht gefunden.',
            };
        }

        revalidateDepartmentRoutes();

        return {
            success: true,
            message: 'Abteilung gespeichert.',
        };
    } catch (error) {
        console.error('Abteilung konnte nicht gespeichert werden.', error);

        return {
            success: false,
            message: 'Die Abteilung konnte nicht gespeichert werden.',
        };
    }
}

export async function archiveDepartment(departmentId: string): Promise<DepartmentActionResult> {
    await requireAdminSession();

    const validationResult = departmentIdSchema.safeParse(departmentId);

    if (!validationResult.success) {
        return {
            success: false,
            message: validationResult.error.issues[0]?.message ?? 'Die Abteilungs-ID ist ungültig.',
        };
    }

    try {
        const department = await prisma.department.findUnique({
            where: {
                id: validationResult.data,
            },
            select: {
                archivedAt: true,
            },
        });

        if (!department) {
            return {
                success: false,
                message: 'Die angegebene Abteilung wurde nicht gefunden.',
            };
        }

        if (department.archivedAt) {
            return {
                success: true,
                message: 'Die Abteilung ist bereits archiviert.',
            };
        }

        await prisma.department.update({
            where: {
                id: validationResult.data,
            },
            data: {
                archivedAt: new Date(),
            },
        });

        revalidateDepartmentRoutes();

        return {
            success: true,
            message: 'Abteilung archiviert.',
        };
    } catch (error) {
        console.error('Abteilung konnte nicht archiviert werden.', error);

        return {
            success: false,
            message: 'Die Abteilung konnte nicht archiviert werden.',
        };
    }
}

export async function restoreDepartment(departmentId: string): Promise<DepartmentActionResult> {
    await requireAdminSession();

    const validationResult = departmentIdSchema.safeParse(departmentId);

    if (!validationResult.success) {
        return {
            success: false,
            message: validationResult.error.issues[0]?.message ?? 'Die Abteilungs-ID ist ungültig.',
        };
    }

    try {
        const department = await prisma.department.findUnique({
            where: {
                id: validationResult.data,
            },
            select: {
                archivedAt: true,
            },
        });

        if (!department) {
            return {
                success: false,
                message: 'Die angegebene Abteilung wurde nicht gefunden.',
            };
        }

        if (!department.archivedAt) {
            return {
                success: true,
                message: 'Die Abteilung ist bereits aktiv.',
            };
        }

        await prisma.department.update({
            where: {
                id: validationResult.data,
            },
            data: {
                archivedAt: null,
            },
        });

        revalidateDepartmentRoutes();

        return {
            success: true,
            message: 'Abteilung wiederhergestellt.',
        };
    } catch (error) {
        console.error('Abteilung konnte nicht wiederhergestellt werden.', error);

        return {
            success: false,
            message: 'Die Abteilung konnte nicht wiederhergestellt werden.',
        };
    }
}

export async function searchDepartmentMembers(input: { departmentId: string; query: string }) {
    await requireAdminSession();

    const validation = searchDepartmentMembersSchema.safeParse(input);

    if (!validation.success) {
        return {
            success: false,
            message: validation.error.issues[0]?.message ?? 'Die Suche ist ungültig.',
            users: [],
        };
    }

    try {
        const department = await getActiveDepartment(validation.data.departmentId);

        if (!department) {
            return {
                success: false,
                message: 'Die Abteilung wurde nicht gefunden oder ist archiviert.',
                users: [],
            };
        }

        const users = await searchAvailableDepartmentMembers(
            validation.data.departmentId,
            validation.data.query
        );

        return { success: true, message: '', users };
    } catch (error) {
        console.error('Mitgliedersuche fehlgeschlagen.', error);

        return {
            success: false,
            message: 'Die User konnten nicht gesucht werden.',
            users: [],
        };
    }
}

export async function assignDepartmentMember(input: {
    departmentId: string;
    userId: string;
    role?: 'MEMBER' | 'MANAGER';
}): Promise<DepartmentActionResult> {
    await requireAdminSession();

    const validation = assignDepartmentMemberSchema.safeParse(input);

    if (!validation.success) {
        return {
            success: false,
            message: validation.error.issues[0]?.message ?? 'Die Zuordnung ist ungültig.',
        };
    }

    const { departmentId, userId, role } = validation.data;

    try {
        const department = await getActiveDepartment(departmentId);

        if (!department) {
            return {
                success: false,
                message: 'Die Abteilung wurde nicht gefunden oder ist archiviert.',
            };
        }

        const user = await prisma.user.findFirst({
            where: { id: userId, status: UserStatus.ACTIVE },
            select: { id: true },
        });

        if (!user) {
            return {
                success: false,
                message: 'Der User ist nicht aktiv oder wurde nicht gefunden.',
            };
        }

        await prisma.departmentMembership.create({
            data: { departmentId, userId, role },
        });

        revalidateDepartmentRoutes();

        return { success: true, message: 'Mitglied hinzugefügt.' };
    } catch (error) {
        console.error('Mitglied konnte nicht hinzugefügt werden.', error);

        return {
            success: false,
            message:
                'Mitglied konnte nicht hinzugefügt werden. Möglicherweise besteht die Zuordnung bereits.',
        };
    }
}

export async function updateDepartmentMemberRole(input: {
    departmentId: string;
    userId: string;
    role: 'MEMBER' | 'MANAGER';
}): Promise<DepartmentActionResult> {
    await requireAdminSession();

    const validation = updateDepartmentMemberRoleSchema.safeParse(input);

    if (!validation.success) {
        return {
            success: false,
            message: validation.error.issues[0]?.message ?? 'Die Rolle ist ungültig.',
        };
    }

    const { departmentId, userId, role } = validation.data;

    try {
        const department = await getActiveDepartment(departmentId);

        if (!department) {
            return {
                success: false,
                message: 'Die Abteilung wurde nicht gefunden oder ist archiviert.',
            };
        }

        const result = await prisma.departmentMembership.updateMany({
            where: { departmentId, userId },
            data: { role },
        });

        if (result.count === 0) {
            return {
                success: false,
                message: 'Die Mitgliedschaft wurde nicht gefunden.',
            };
        }

        revalidateDepartmentRoutes();

        return { success: true, message: 'Abteilungsrolle geändert.' };
    } catch (error) {
        console.error('Abteilungsrolle konnte nicht geändert werden.', error);

        return {
            success: false,
            message: 'Die Abteilungsrolle konnte nicht geändert werden.',
        };
    }
}

export async function removeDepartmentMember(input: {
    departmentId: string;
    userId: string;
}): Promise<DepartmentActionResult> {
    await requireAdminSession();

    const validation = removeDepartmentMemberSchema.safeParse(input);

    if (!validation.success) {
        return {
            success: false,
            message: validation.error.issues[0]?.message ?? 'Die Zuordnung ist ungültig.',
        };
    }

    const { departmentId, userId } = validation.data;

    try {
        const department = await getActiveDepartment(departmentId);

        if (!department) {
            return {
                success: false,
                message: 'Die Abteilung wurde nicht gefunden oder ist archiviert.',
            };
        }

        const result = await prisma.departmentMembership.deleteMany({
            where: { departmentId, userId },
        });

        if (result.count === 0) {
            return {
                success: false,
                message: 'Die Mitgliedschaft wurde nicht gefunden.',
            };
        }

        revalidateDepartmentRoutes();

        return { success: true, message: 'Mitglied entfernt.' };
    } catch (error) {
        console.error('Mitglied konnte nicht entfernt werden.', error);

        return {
            success: false,
            message: 'Mitglied konnte nicht entfernt werden.',
        };
    }
}
