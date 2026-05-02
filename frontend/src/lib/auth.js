export function normalizeRole(role) {
    return String(role || "").trim().toLowerCase();
}

export function hasRole(role, targetRole) {
    return normalizeRole(role) === normalizeRole(targetRole);
}

export function isStudent(role) {
    return hasRole(role, "student");
}

export function isAdmin(role) {
    return hasRole(role, "admin") || hasRole(role, "super admin");
}
