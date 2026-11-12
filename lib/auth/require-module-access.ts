import { redirect } from 'next/navigation';

import { canUserAccessModule } from '@/lib/modules/moduleConfigurationService';

import { requireAppSession } from './require-session';

export async function requireModuleAccess(moduleId: string) {
    const session = await requireAppSession();

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
