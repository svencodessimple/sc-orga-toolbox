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

function revalidateDepartmentRoutes() {
    revalidatePath('/admin/departments');
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
