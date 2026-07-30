'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { env } from '@/lib/env';
import { Role, UserStatus } from '@/lib/generated/browser';
import { prisma } from '@/lib/prisma';
import { updateUserAccessGroupsSchema } from '@/lib/access-groups/userAccessGroupSchemas';

import type { AdminActionResult } from './adminActionTypes';

// Hilfsfunktionen zur Absicherung der Actions
async function assertAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== Role.ADMIN) {
        throw new Error('Nicht autorisiert: Nur Admins haben hier Zugriff.');
    }
    return session;
}

async function isLastAdmin(userId: string): Promise<boolean> {
    const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });

    if (target?.role !== Role.ADMIN) {
        return false;
    }

    const otherAdmins = await prisma.user.count({
        where: {
            role: Role.ADMIN,
            id: { not: userId },
        },
    });

    return otherAdmins === 0;
}

async function getUserOrThrow(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new Error('User nicht gefunden.');
    }
    return user;
}

/**
 * 1. Holt alle User aus der DB und gruppiert sie nach Status
 */
export async function getAdminDashboardData() {
    await assertAdmin();

    const allUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            sc_handle: true,
            status: true,
            role: true,
            failed_attempts: true,
            createdAt: true,
            updatedAt: true,
            rejectedAt: true,
            bannedAt: true,
            accessGroups: {
                select: {
                    group: {
                        select: {
                            id: true,
                            key: true,
                            name: true,
                            archivedAt: true,
                        },
                    },
                },
            },
        },
    });

    const users = allUsers.map(({ accessGroups, ...user }) => ({
        ...user,
        accessGroups: accessGroups
            .map(({ group }) => group)
            .sort((left, right) => left.name.localeCompare(right.name, 'de')),
    }));

    return {
        [UserStatus.PENDING]: users.filter((user) => user.status === UserStatus.PENDING),
        [UserStatus.VERIFIED]: users.filter((user) => user.status === UserStatus.VERIFIED),
        [UserStatus.ACTIVE]: users.filter((user) => user.status === UserStatus.ACTIVE),
        [UserStatus.REJECTED]: users.filter((user) => user.status === UserStatus.REJECTED),
        [UserStatus.BANNED]: users.filter((user) => user.status === UserStatus.BANNED),
    };
}

/**
 * 2. Aktiviert einen verifizierten User -> wird MEMBER
 * Erlaubter Ausgangsstatus: nur VERIFIED
 */
export async function activateUser(userId: string): Promise<AdminActionResult> {
    await assertAdmin();
    const user = await getUserOrThrow(userId);

    if (user.status !== UserStatus.VERIFIED) {
        return {
            success: false,
            message: `Aktion abgelehnt: User hat Status ${user.status}, erwartet wird VERIFIED.`,
        };
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            status: UserStatus.ACTIVE,
            role: Role.MEMBER,
        },
    });

    revalidatePath('/admin/users');

    return {
        success: true,
    };
}

/**
 * 3. Ändert die Rolle eines aktiven Users zwischen MEMBER und ADMIN.
 */
export async function updateUserRole(userId: string, targetRole: Role): Promise<AdminActionResult> {
    const session = await assertAdmin();

    if (targetRole !== Role.MEMBER && targetRole !== Role.ADMIN) {
        return {
            success: false,
            message: 'Als Zielrolle sind nur MEMBER und ADMIN erlaubt.',
        };
    }

    const user = await getUserOrThrow(userId);

    if (session.user.id === userId) {
        return {
            success: false,
            message: 'Du kannst deine eigene Rolle nicht ändern.',
        };
    }

    if (user.status !== UserStatus.ACTIVE) {
        return {
            success: false,
            message: `Rollen können nur bei aktiven Usern geändert werden. Aktueller Status: ${user.status}.`,
        };
    }

    if (user.role !== Role.MEMBER && user.role !== Role.ADMIN) {
        return {
            success: false,
            message: `Die aktuelle Rolle ${user.role} kann hier nicht geändert werden.`,
        };
    }

    if (user.role === targetRole) {
        return {
            success: false,
            message: `Der User besitzt bereits die Rolle ${targetRole}.`,
        };
    }

    if (user.role === Role.ADMIN && targetRole === Role.MEMBER && (await isLastAdmin(userId))) {
        return {
            success: false,
            message: 'Es muss mindestens ein Admin-Account bestehen bleiben.',
        };
    }

    await prisma.user.update({
        where: { id: userId },
        data: { role: targetRole },
    });

    revalidatePath('/admin/users');

    return {
        success: true,
    };
}

/**
 * 4. Bannt einen User permanent
 * Erlaubt aus jedem Status außer bereits BANNED (kein sinnvoller No-Op-Schutz nötig, aber sauberer)
 */
export async function banUser(userId: string): Promise<AdminActionResult> {
    const session = await assertAdmin();
    const user = await getUserOrThrow(userId);

    if (session.user.id === userId) {
        return {
            success: false,
            message: 'Du kannst dich nicht selbst sperren.',
        };
    }

    if (user.status === UserStatus.BANNED) {
        return {
            success: false,
            message: 'User ist bereits gesperrt.',
        };
    }

    if (await isLastAdmin(userId)) {
        return {
            success: false,
            message: 'Es muss mindestens ein Admin-Account bestehen bleiben.',
        };
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            status: UserStatus.BANNED,
            bannedAt: new Date(),
        },
    });

    revalidatePath('/admin/users');

    return {
        success: true,
    };
}

/**
 * 5. Setzt fehlgeschlagene Versuche zurück -> zurück in den Validierungs-Loop
 * Erlaubter Ausgangsstatus: REJECTED oder PENDING (manueller Reset bei feststeckendem Counter)
 */
export async function resetUserAttempts(userId: string): Promise<AdminActionResult> {
    await assertAdmin();
    const user = await getUserOrThrow(userId);

    if (user.status !== UserStatus.REJECTED && user.status !== UserStatus.PENDING) {
        return {
            success: false,
            message: `Reset nur aus REJECTED oder PENDING möglich. Aktueller Status: ${user.status}.`,
        };
    }

    await prisma.user.update({
        where: { id: userId },
        data: { status: UserStatus.PENDING, failed_attempts: 0, rejectedAt: null },
    });

    revalidatePath('/admin/users');

    return {
        success: true,
    };
}

/**
 * 6. Löscht einen User-Datensatz permanent
 */
export async function deleteUser(userId: string): Promise<AdminActionResult> {
    const session = await assertAdmin();

    if (session.user.id === userId) {
        return {
            success: false,
            message: 'Du kannst dich nicht selbst löschen.',
        };
    }

    if (await isLastAdmin(userId)) {
        return {
            success: false,
            message: 'Es muss mindestens ein Admin-Account bestehen bleiben.',
        };
    }

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath('/admin/users');

    return {
        success: true,
    };
}

export async function triggerCronVerification() {
    await assertAdmin();

    const response = await fetch(`${env.NEXTAUTH_URL}/api/cron/verify`, {
        method: 'POST',
        headers: { 'x-cron-secret': env.CRON_SECRET },
    });

    if (!response.ok) {
        throw new Error('Verifizierungs-Lauf fehlgeschlagen.');
    }

    const result = await response.json();
    revalidatePath('/admin/users');
    return result;
}

/**
 * 7. Aktualisiert die Gruppenzuweisungen eines Users
 * Erlaubter Ausgangsstatus: nur ACTIVE
 */
export async function updateUserAccessGroups(input: unknown): Promise<AdminActionResult> {
    await assertAdmin();

    const validationResult = updateUserAccessGroupsSchema.safeParse(input);

    if (!validationResult.success) {
        return {
            success: false,
            message:
                validationResult.error.issues[0]?.message ?? 'Die Gruppenzuweisung ist ungültig.',
        };
    }

    const { userId, activeGroupIds } = validationResult.data;

    try {
        const outcome = await prisma.$transaction(async (transaction) => {
            const user = await transaction.user.findUnique({
                where: {
                    id: userId,
                },
                select: {
                    status: true,
                },
            });

            if (!user) {
                return {
                    status: 'user-not-found' as const,
                };
            }

            const requestedGroups = await transaction.accessGroup.findMany({
                where: {
                    id: {
                        in: activeGroupIds,
                    },
                },
                select: {
                    id: true,
                    archivedAt: true,
                },
            });

            if (requestedGroups.length !== activeGroupIds.length) {
                return {
                    status: 'unknown-group' as const,
                };
            }

            if (requestedGroups.some((group) => group.archivedAt !== null)) {
                return {
                    status: 'archived-group' as const,
                };
            }

            const existingActiveAssignments = await transaction.userAccessGroup.findMany({
                where: {
                    userId,
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
            const requestedGroupIds = new Set(activeGroupIds);

            const groupIdsToRemove = [...existingGroupIds].filter(
                (groupId) => !requestedGroupIds.has(groupId)
            );
            const groupIdsToAdd = activeGroupIds.filter(
                (groupId) => !existingGroupIds.has(groupId)
            );

            if (user.status !== UserStatus.ACTIVE && groupIdsToAdd.length > 0) {
                return {
                    status: 'inactive-user-addition' as const,
                    userStatus: user.status,
                };
            }

            if (groupIdsToRemove.length > 0) {
                await transaction.userAccessGroup.deleteMany({
                    where: {
                        userId,
                        groupId: {
                            in: groupIdsToRemove,
                        },
                    },
                });
            }

            if (groupIdsToAdd.length > 0) {
                await transaction.userAccessGroup.createMany({
                    data: groupIdsToAdd.map((groupId) => ({
                        userId,
                        groupId,
                    })),
                });
            }

            return {
                status: 'updated' as const,
            };
        });

        if (outcome.status === 'user-not-found') {
            return {
                success: false,
                message: 'Der angegebene Benutzer wurde nicht gefunden.',
            };
        }

        if (outcome.status === 'inactive-user-addition') {
            return {
                success: false,
                message:
                    'Inaktiven Benutzern können keine neuen Gruppen zugewiesen werden. ' +
                    'Bestehende Zuweisungen dürfen nur entfernt werden.',
            };
        }

        if (outcome.status === 'unknown-group') {
            return {
                success: false,
                message: 'Mindestens eine Zugriffsgruppe ist nicht bekannt.',
            };
        }

        if (outcome.status === 'archived-group') {
            return {
                success: false,
                message: 'Archivierte Zugriffsgruppen können nicht neu zugewiesen werden.',
            };
        }

        revalidatePath('/admin/users');
        revalidatePath('/admin/groups');
        revalidatePath('/dashboard');
        revalidatePath('/member-area');

        return {
            success: true,
        };
    } catch (error) {
        console.error('Benutzer-Gruppenzuordnungen konnten nicht gespeichert werden.', error);

        return {
            success: false,
            message: 'Die Benutzer-Gruppenzuordnungen konnten nicht gespeichert werden.',
        };
    }
}
