type UserRole = 'super_admin' | 'admin' | 'moderator' | 'viewer';

type Permission =
    | 'reservations.view'
    | 'reservations.edit'
    | 'reservations.delete'
    | 'reviews.view'
    | 'reviews.approve'
    | 'reviews.delete'
    | 'prices.view'
    | 'prices.edit'
    | 'cabins.view'
    | 'cabins.edit'
    | 'blocked_dates.view'
    | 'blocked_dates.edit'
    | 'notifications.view';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    super_admin: [
        'reservations.view',
        'reservations.edit',
        'reservations.delete',
        'reviews.view',
        'reviews.approve',
        'reviews.delete',
        'prices.view',
        'prices.edit',
        'cabins.view',
        'cabins.edit',
        'blocked_dates.view',
        'blocked_dates.edit',
        'notifications.view',
    ],
    admin: [
        'reservations.view',
        'reservations.edit',
        'reviews.view',
        'reviews.approve',
        'reviews.delete',
        'prices.view',
        'prices.edit',
        'blocked_dates.view',
        'blocked_dates.edit',
        'notifications.view',
    ],
    moderator: [
        'reservations.view',
        'reviews.view',
        'reviews.approve',
        'notifications.view',
    ],
    viewer: [
        'reservations.view',
        'reviews.view',
        'notifications.view',
    ],
};

export const hasPermission = (role: UserRole | null, permission: Permission): boolean => {
    if (!role) return false;
    if (role === 'super_admin') return true; // Super admin has all permissions
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const hasAnyPermission = (role: UserRole | null, permissions: Permission[]): boolean => {
    return permissions.some((permission) => hasPermission(role, permission));
};

export const hasAllPermissions = (role: UserRole | null, permissions: Permission[]): boolean => {
    return permissions.every((permission) => hasPermission(role, permission));
};

export type { UserRole, Permission };
