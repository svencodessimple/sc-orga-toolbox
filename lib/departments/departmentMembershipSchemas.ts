import { DepartmentRole } from '@/lib/generated/browser';
import { z } from 'zod';

import { departmentIdSchema } from './departmentSchemas';

const userIdSchema = z.string().trim().uuid('Die User-ID ist ungültig.');

export const searchDepartmentMembersSchema = z.object({
    departmentId: departmentIdSchema,
    query: z
        .string()
        .trim()
        .min(2, 'Bitte mindestens zwei Zeichen eingeben.')
        .max(80, 'Die Suche ist zu lang.'),
});

export const assignDepartmentMemberSchema = z.object({
    departmentId: departmentIdSchema,
    userId: userIdSchema,
    role: z.nativeEnum(DepartmentRole).default(DepartmentRole.MEMBER),
});

export const updateDepartmentMemberRoleSchema = z.object({
    departmentId: departmentIdSchema,
    userId: userIdSchema,
    role: z.nativeEnum(DepartmentRole),
});

export const removeDepartmentMemberSchema = z.object({
    departmentId: departmentIdSchema,
    userId: userIdSchema,
});
