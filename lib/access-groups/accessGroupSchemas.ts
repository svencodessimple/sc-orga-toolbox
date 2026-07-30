import { z } from 'zod';

const accessGroupKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const accessGroupIdSchema = z.string().trim().uuid('Die Gruppen-ID ist ungültig.');

export const accessGroupKeySchema = z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(
        z
            .string()
            .min(3, 'Der technische Schlüssel muss mindestens 3 Zeichen enthalten.')
            .max(64, 'Der technische Schlüssel darf höchstens 64 Zeichen enthalten.')
            .regex(
                accessGroupKeyPattern,
                'Der technische Schlüssel darf nur Kleinbuchstaben, Zahlen und einzelne Bindestriche enthalten.'
            )
    );

export const accessGroupNameSchema = z
    .string()
    .trim()
    .min(1, 'Der Anzeigename muss mindestens ein Zeichen enthalten.')
    .max(80, 'Der Anzeigename darf höchstens 80 Zeichen enthalten.');

export const accessGroupDescriptionSchema = z
    .string()
    .trim()
    .max(300, 'Die Beschreibung darf höchstens 300 Zeichen enthalten.')
    .optional()
    .nullable()
    .transform((value) => (value?.length ? value : null));

export const createAccessGroupSchema = z.object({
    key: accessGroupKeySchema,
    name: accessGroupNameSchema,
    description: accessGroupDescriptionSchema,
});

export const updateAccessGroupSchema = z.object({
    groupId: accessGroupIdSchema,
    name: accessGroupNameSchema,
    description: accessGroupDescriptionSchema,
});

export type CreateAccessGroupData = z.infer<typeof createAccessGroupSchema>;
export type UpdateAccessGroupData = z.infer<typeof updateAccessGroupSchema>;
