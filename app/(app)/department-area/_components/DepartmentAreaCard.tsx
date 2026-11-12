import { TerminalPanel } from '@/components/mobiglas/TerminalPanel';
import type { DepartmentViewModel } from '@/lib/departments/departmentTypes';

import { DepartmentAreaCardHeader } from './DepartmentAreaCardHeader';
import { DepartmentAreaMembershipManager } from './DepartmentAreaMembershipManager';

interface DepartmentAreaCardProps {
    department: DepartmentViewModel;
    ownRole: 'MEMBER' | 'MANAGER' | null;
    canManage: boolean;
}

export function DepartmentAreaCard({ department, ownRole, canManage }: DepartmentAreaCardProps) {
    return (
        <TerminalPanel className="max-w-none">
            <details className="group">
                <DepartmentAreaCardHeader
                    department={department}
                    ownRole={ownRole}
                    canManage={canManage}
                />

                <div className="mt-5 border-t border-line pt-5">
                    <DepartmentAreaMembershipManager
                        departmentId={department.id}
                        members={department.members}
                        canManage={canManage}
                    />
                </div>
            </details>
        </TerminalPanel>
    );
}
