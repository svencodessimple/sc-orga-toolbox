import { z } from 'zod';

import { accessGroupIdSchema } from './accessGroupSchemas';

const userIdSchema = z.string().trim().uuid('Die Benutzer-ID ist ungültig.');

export const updateUserAccessGroupsSchema = z.object({
    userId: userIdSchema,
    activeGroupIds: z
        .array(accessGroupIdSchema)
        .max(100, 'Es können höchstens 100 Gruppen zugewiesen werden.')
        .transform((groupIds) => [...new Set(groupIds)]),
});

export type UpdateUserAccessGroupsData = z.infer<typeof updateUserAccessGroupsSchema>;
