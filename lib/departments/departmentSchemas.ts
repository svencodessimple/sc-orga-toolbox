import { z } from 'zod';

export const departmentIdSchema = z.string().trim().uuid('Die Abteilungs-ID ist ungültig.');

export const departmentNameSchema = z
    .string()
    .trim()
    .min(1, 'Der Name muss mindestens ein Zeichen enthalten.')
    .max(80, 'Der Name darf höchstens 80 Zeichen enthalten.');

export const departmentDescriptionSchema = z
    .string()
    .trim()
    .max(300, 'Die Beschreibung darf höchstens 300 Zeichen enthalten.')
    .optional()
    .nullable()
    .transform((value) => (value?.length ? value : null));

export const createDepartmentSchema = z.object({
    name: departmentNameSchema,
    description: departmentDescriptionSchema,
});

export const updateDepartmentSchema = z.object({
    departmentId: departmentIdSchema,
    name: departmentNameSchema,
    description: departmentDescriptionSchema,
});

export type CreateDepartmentData = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentData = z.infer<typeof updateDepartmentSchema>;
