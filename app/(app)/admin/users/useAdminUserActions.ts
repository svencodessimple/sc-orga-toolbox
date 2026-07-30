'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Role } from '@/lib/generated/browser';

import {
    activateUser,
    banUser,
    deleteUser,
    resetUserAttempts,
    unbanUser,
    updateUserRole,
} from './actions';
import type { AdminAction } from './adminActionTypes';

type ModalVariant = 'primary' | 'danger';

interface ModalConfig {
    isOpen: boolean;
    userId: string;
    action: AdminAction | null;
    title: string;
    message: string;
    variant: ModalVariant;
}

const initialModalConfig: ModalConfig = {
    isOpen: false,
    userId: '',
    action: null,
    title: '',
    message: '',
    variant: 'primary',
};

export function useAdminUserActions() {
    const [isPending, startTransition] = useTransition();
    const [modalConfig, setModalConfig] = useState<ModalConfig>(initialModalConfig);

    const promoteUser: AdminAction = (userId) => updateUserRole(userId, Role.ADMIN);
    const demoteUser: AdminAction = (userId) => updateUserRole(userId, Role.MEMBER);

    function openModal(
        action: AdminAction,
        id: string,
        title: string,
        message: string,
        variant: ModalVariant = 'primary'
    ) {
        setModalConfig({ isOpen: true, userId: id, action, title, message, variant });
    }

    function closeModal() {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }

    function handleConfirm() {
        const { action, userId, title } = modalConfig;
        if (!action || !userId) return;

        startTransition(async () => {
            try {
                const result = await action(userId);

                if (!result.success) {
                    toast.error(result.message);
                    return;
                }

                toast.success(`${title} erfolgreich durchgeführt!`);
                closeModal();
            } catch (error) {
                console.error(error);
                toast.error('Ein unerwarteter Fehler ist aufgetreten.');
            }
        });
    }

    return {
        isPending,
        modalConfig,
        openModal,
        closeModal,
        handleConfirm,
        actions: {
            activateUser,
            promoteUser,
            demoteUser,
            banUser,
            unbanUser,
            resetUserAttempts,
            deleteUser,
        },
    };
}
