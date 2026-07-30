import { redirect } from 'next/navigation';

import { canUserAccessModule } from '@/lib/modules/moduleConfigurationService';

import { requireActiveSession } from './require-session';

export async function requireModuleAccess(moduleId: string) {
    const session = await requireActiveSession();

    const hasAccess = await canUserAccessModule({
        moduleId,
        userId: session.user.id,
        role: session.user.role,
    });

    if (!hasAccess) {
        redirect('/dashboard');
    }

    return session;
}
