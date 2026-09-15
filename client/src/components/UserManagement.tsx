import React, { useState, useEffect, useCallback } from "react";
import {
  AuthUser,
  AdminUser,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetUserPassword,
  CreateUserData,
  UpdateUserData,
} from "../api.js";

export interface UserManagementProps {
  currentUser: AuthUser;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Filters & Pagination
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserData>({
    fullName: "",
    email: "",
    role: "REQUESTER",
    initialPassword: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserData>({
    fullName: "",
    email: "",
    role: "REQUESTER",
    isActive: true,
  });
  const [editError, setEditError] = useState<string | null>(null);

  const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);

  // Load Users from API
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminUsers({
        search: activeSearch || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter !== "" ? statusFilter : undefined,
        page,
        limit,
      });
      setUsers(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [activeSearch, roleFilter, statusFilter, page, limit]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    setActiveSearch("");
    setRoleFilter("");
    setStatusFilter("");
    setPage(1);
  };

  const isFilterActive = activeSearch.trim() !== "" || roleFilter !== "" || statusFilter !== "";

  // -------------------------------------------------------------------------
  // User Actions: Quick Status Toggle
  // -------------------------------------------------------------------------
  const handleToggleActive = async (user: AdminUser) => {
    if (user.id === currentUser.id) {
      setFeedback({
        message: "You cannot deactivate your own administrator account (SEC-05).",
        type: "error",
      });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      const newStatus = !user.isActive;
      await updateAdminUser(user.id, { isActive: newStatus });
      setFeedback({
        message: `User "${user.fullName}" has been ${newStatus ? "activated" : "deactivated"} successfully.`,
        type: "success",
      });
      await loadUsers();
    } catch (err: any) {
      setFeedback({
        message: err.message || "Failed to update user status",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Create User
  // -------------------------------------------------------------------------
  const handleOpenCreate = () => {
    setCreateForm({
      fullName: "",
      email: "",
      role: "REQUESTER",
      initialPassword: "",
    });
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    // Client-side quick validations
    if (createForm.fullName.trim().length < 2) {
      setCreateError("Full name must be at least 2 characters.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email.trim())) {
      setCreateError("Please provide a valid email address.");
      return;
    }
    if (createForm.initialPassword.length < 8) {
      setCreateError("Initial password must be at least 8 characters long.");
      return;
    }

    setActionLoading(true);
    try {
      await createAdminUser(createForm);
      setIsCreateOpen(false);
      setFeedback({
        message: `User account created successfully for "${createForm.fullName}". The user will be required to change password on first login.`,
        type: "success",
      });
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user.");
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Edit User
  // -------------------------------------------------------------------------
  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setEditError(null);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    if (editForm.fullName && editForm.fullName.trim().length < 2) {
      setEditError("Full name must be at least 2 characters.");
      return;
    }

    setActionLoading(true);
    try {
      await updateAdminUser(editingUser.id, editForm);
      setEditingUser(null);
      setFeedback({
        message: `User "${editingUser.fullName}" updated successfully.`,
        type: "success",
      });
      await loadUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user.");
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Reset Password
  // -------------------------------------------------------------------------
  const handleOpenReset = (user: AdminUser) => {
    setResetTargetUser(user);
    setResetPasswordInput("");
    setResetError(null);
  };

  const handleSubmitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetError(null);

    if (resetPasswordInput.length < 8) {
      setResetError("New temporary password must be at least 8 characters long.");
      return;
    }

    setActionLoading(true);
    try {
      await resetUserPassword(resetTargetUser.id, resetPasswordInput);
      setResetTargetUser(null);
      setFeedback({
        message: `Password reset successfully for "${resetTargetUser.fullName}". The user must change password on their next login.`,
        type: "success",
      });
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="user-management-container" data-testid="user-management">
      {/* Header & Create Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "var(--color-text-main)", fontSize: "1.6rem", fontWeight: 700 }}>
            User Management & Directory
          </h2>
          <p style={{ margin: "0.25rem 0 0", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            Create accounts, manage access roles, toggle active status, and administer password resets.
          </p>
        </div>

        <button
          type="button"
          className="zen-btn-primary"
          onClick={handleOpenCreate}
          style={{ minHeight: "44px" }}
          data-testid="create-user-btn"
        >
          <span>＋</span>
          <span>Create New User</span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1.25rem",
            backgroundColor: feedback.type === "success" ? "var(--color-success-bg)" : "var(--color-error-bg)",
            color: feedback.type === "success" ? "var(--color-success)" : "var(--color-error)",
            border: `1px solid ${feedback.type === "success" ? "var(--color-success)" : "var(--color-error)"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "inherit" }}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="zen-card" style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
          {/* Keyword Search */}
          <div style={{ flex: "1 1 240px" }}>
            <label className="zen-label" htmlFor="user-search-input">
              Search Users
            </label>
            <input
              id="user-search-input"
              type="text"
              className="zen-input"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              data-testid="user-search-input"
            />
          </div>

          {/* Role Filter */}
          <div style={{ flex: "0 1 180px" }}>
            <label className="zen-label" htmlFor="user-role-filter">
              Role
            </label>
            <select
              id="user-role-filter"
              className="zen-select"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              data-testid="user-role-filter"
            >
              <option value="">All Roles</option>
              <option value="REQUESTER">Requester</option>
              <option value="IT_STAFF">IT Staff</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ flex: "0 1 160px" }}>
            <label className="zen-label" htmlFor="user-status-filter">
              Status
            </label>
            <select
              id="user-status-filter"
              className="zen-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              data-testid="user-status-filter"
            >
              <option value="">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="submit"
              className="zen-btn-primary"
              style={{ minHeight: "42px", padding: "0 1.25rem" }}
              data-testid="search-users-btn"
            >
              Search
            </button>
            {isFilterActive && (
              <button
                type="button"
                className="zen-btn-secondary"
                style={{ minHeight: "42px" }}
                onClick={handleClearFilters}
                data-testid="clear-filters-btn"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          style={{
            padding: "1rem",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1.5rem",
            backgroundColor: "var(--color-error-bg)",
            color: "var(--color-error)",
            border: "1px solid var(--color-error)",
          }}
        >
          {error}
          <button
            type="button"
            className="zen-btn-secondary"
            style={{ marginLeft: "1rem", minHeight: "36px", padding: "0.25rem 0.75rem" }}
            onClick={loadUsers}
          >
            Retry
          </button>
        </div>
      )}

      {/* Users Table / List */}
      {loading ? (
        <div className="zen-card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--color-text-muted)" }}>Loading user accounts...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="zen-card" style={{ textAlign: "center", padding: "3rem" }} data-testid="no-users-found">
          <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-text-main)" }}>No users found</p>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            {isFilterActive ? "Try adjusting or clearing your search filters." : "No user accounts exist in the system."}
          </p>
          {isFilterActive && (
            <button type="button" className="zen-btn-primary" onClick={handleClearFilters} style={{ marginTop: "1rem" }}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="zen-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="zen-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#FAFCFB", borderBottom: "1px solid var(--color-field-border)" }}>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                    User Details
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                    Role
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                    Status
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                    Password Flag
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                    Created Date
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <tr
                      key={u.id}
                      style={{ borderBottom: "1px solid #EFEFEF" }}
                      data-testid={`user-row-${u.id}`}
                    >
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 600, color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {u.fullName}
                          {isSelf && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                padding: "0.15rem 0.4rem",
                                backgroundColor: "var(--color-pale-green)",
                                color: "var(--color-primary-green)",
                                borderRadius: "var(--radius-sm)",
                                fontWeight: 700,
                              }}
                            >
                              YOU
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{u.email}</div>
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.25rem 0.6rem",
                            borderRadius: "9999px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            backgroundColor:
                              u.role === "ADMINISTRATOR"
                                ? "#F3E8FF"
                                : u.role === "IT_STAFF"
                                ? "#E0F2FE"
                                : "#F1F5F9",
                            color:
                              u.role === "ADMINISTRATOR"
                                ? "#6B21A8"
                                : u.role === "IT_STAFF"
                                ? "#0369A1"
                                : "#334155",
                          }}
                        >
                          {u.role === "ADMINISTRATOR" ? "Administrator" : u.role === "IT_STAFF" ? "IT Staff" : "Requester"}
                        </span>
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span
                            style={{
                              display: "inline-block",
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: u.isActive ? "var(--color-success)" : "#94A3B8",
                            }}
                          />
                          <span style={{ fontSize: "0.85rem", fontWeight: 500, color: u.isActive ? "var(--color-text-main)" : "#94A3B8" }}>
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                          {/* Toggle Active Status button */}
                          <button
                            type="button"
                            className="btn-toggle-status"
                            disabled={isSelf || actionLoading}
                            title={isSelf ? "Cannot deactivate own account" : `Click to ${u.isActive ? "deactivate" : "activate"}`}
                            onClick={() => handleToggleActive(u)}
                            style={{
                              marginLeft: "0.5rem",
                              fontSize: "0.75rem",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--color-field-border)",
                              backgroundColor: "transparent",
                              cursor: isSelf ? "not-allowed" : "pointer",
                              opacity: isSelf ? 0.4 : 1,
                            }}
                            data-testid={`toggle-active-btn-${u.id}`}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: "1rem", fontSize: "0.85rem" }}>
                        {u.mustChangePassword ? (
                          <span style={{ color: "var(--color-warning)", fontWeight: 600 }}>Change Required</span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>Normal</span>
                        )}
                      </td>

                      <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          <button
                            type="button"
                            className="zen-btn-secondary"
                            style={{ minHeight: "34px", padding: "0.2rem 0.65rem", fontSize: "0.85rem" }}
                            onClick={() => handleOpenEdit(u)}
                            data-testid={`edit-user-btn-${u.id}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="zen-btn-secondary"
                            style={{ minHeight: "34px", padding: "0.2rem 0.65rem", fontSize: "0.85rem" }}
                            onClick={() => handleOpenReset(u)}
                            data-testid={`reset-pwd-btn-${u.id}`}
                          >
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              padding: "1rem",
              backgroundColor: "#FAFCFB",
              borderTop: "1px solid var(--color-field-border)",
            }}
          >
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Showing {users.length} of {pagination.totalItems} users (Page {pagination.page} of {pagination.totalPages})
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <select
                className="zen-select"
                style={{ height: "34px", width: "auto", padding: "0.2rem 0.5rem", fontSize: "0.85rem" }}
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                data-testid="page-limit-select"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>

              <button
                type="button"
                className="zen-btn-secondary"
                style={{ minHeight: "34px", padding: "0 0.75rem" }}
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-testid="prev-page-btn"
              >
                Previous
              </button>

              <button
                type="button"
                className="zen-btn-secondary"
                style={{ minHeight: "34px", padding: "0 0.75rem" }}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                data-testid="next-page-btn"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          MODAL: Create User
      ------------------------------------------------------------------- */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-user-modal-title"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="zen-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 id="create-user-modal-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                Create New User Account
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer" }}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            {createError && (
              <div
                role="alert"
                style={{
                  padding: "0.75rem",
                  backgroundColor: "var(--color-error-bg)",
                  color: "var(--color-error)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                {createError}
              </div>
            )}

            <form onSubmit={handleSubmitCreate}>
              <div className="zen-form-group">
                <label className="zen-label" htmlFor="create-fullname">
                  Full Name <span className="zen-required">*</span>
                </label>
                <input
                  id="create-fullname"
                  type="text"
                  required
                  className="zen-input"
                  placeholder="e.g. John Doe"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  data-testid="create-fullname-input"
                />
              </div>

              <div className="zen-form-group">
                <label className="zen-label" htmlFor="create-email">
                  Email Address <span className="zen-required">*</span>
                </label>
                <input
                  id="create-email"
                  type="email"
                  required
                  className="zen-input"
                  placeholder="e.g. john.doe@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  data-testid="create-email-input"
                />
              </div>

              <div className="zen-form-group">
                <label className="zen-label" htmlFor="create-role">
                  Access Role <span className="zen-required">*</span>
                </label>
                <select
                  id="create-role"
                  className="zen-select"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as any })}
                  data-testid="create-role-select"
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="IT_STAFF">IT Staff</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>

              <div className="zen-form-group">
                <label className="zen-label" htmlFor="create-initial-password">
                  Initial Password <span className="zen-required">*</span>
                </label>
                <input
                  id="create-initial-password"
                  type="password"
                  required
                  className="zen-input"
                  placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 digit"
                  value={createForm.initialPassword}
                  onChange={(e) => setCreateForm({ ...createForm, initialPassword: e.target.value })}
                  data-testid="create-password-input"
                />
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                  Must be at least 8 characters long with uppercase, lowercase, and numeric digits. User will be forced to change it on first login.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="zen-btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zen-btn-primary"
                  disabled={actionLoading}
                  data-testid="submit-create-user-btn"
                >
                  {actionLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          MODAL: Edit User
      ------------------------------------------------------------------- */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-modal-title"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="zen-card"
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 id="edit-user-modal-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                Edit User: {editingUser.fullName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer" }}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            {editError && (
              <div
                role="alert"
                style={{
                  padding: "0.75rem",
                  backgroundColor: "var(--color-error-bg)",
                  color: "var(--color-error)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                {editError}
              </div>
            )}

            <form onSubmit={handleSubmitEdit}>
              <div className="zen-form-group">
                <label className="zen-label" htmlFor="edit-fullname">
                  Full Name
                </label>
                <input
                  id="edit-fullname"
                  type="text"
                  required
                  className="zen-input"
                  value={editForm.fullName || ""}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  data-testid="edit-fullname-input"
                />
              </div>

              <div className="zen-form-group">
                <label className="zen-label" htmlFor="edit-email">
                  Email Address
                </label>
                <input
                  id="edit-email"
                  type="email"
                  required
                  className="zen-input"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  data-testid="edit-email-input"
                />
              </div>

              <div className="zen-form-group">
                <label className="zen-label" htmlFor="edit-role">
                  Role
                </label>
                <select
                  id="edit-role"
                  className="zen-select"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  data-testid="edit-role-select"
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="IT_STAFF">IT Staff</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>

              <div className="zen-form-group">
                <label className="zen-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={editForm.isActive ?? true}
                    disabled={editingUser.id === currentUser.id}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    data-testid="edit-active-checkbox"
                  />
                  <span>Active Account Status</span>
                </label>
                {editingUser.id === currentUser.id && (
                  <p style={{ fontSize: "0.8rem", color: "var(--color-error)", margin: "0.2rem 0 0 1.5rem" }}>
                    You cannot deactivate your own administrator account (SEC-05).
                  </p>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="zen-btn-secondary"
                  onClick={() => setEditingUser(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zen-btn-primary"
                  disabled={actionLoading}
                  data-testid="submit-edit-user-btn"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------
          MODAL: Reset Password
      ------------------------------------------------------------------- */}
      {resetTargetUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-modal-title"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
        >
          <div
            className="zen-card"
            style={{
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 id="reset-password-modal-title" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setResetTargetUser(null)}
                style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer" }}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
              Reset initial temporary password for <strong>{resetTargetUser.fullName}</strong> ({resetTargetUser.email}).
            </p>

            {resetError && (
              <div
                role="alert"
                style={{
                  padding: "0.75rem",
                  backgroundColor: "var(--color-error-bg)",
                  color: "var(--color-error)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "1rem",
                  fontSize: "0.9rem",
                }}
              >
                {resetError}
              </div>
            )}

            <form onSubmit={handleSubmitReset}>
              <div className="zen-form-group">
                <label className="zen-label" htmlFor="reset-initial-password">
                  New Initial Password <span className="zen-required">*</span>
                </label>
                <input
                  id="reset-initial-password"
                  type="password"
                  required
                  className="zen-input"
                  placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 digit"
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                  data-testid="reset-password-input"
                />
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.3rem" }}>
                  The user will be required to change this password immediately upon their next login.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="zen-btn-secondary"
                  onClick={() => setResetTargetUser(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zen-btn-primary"
                  disabled={actionLoading}
                  data-testid="submit-reset-password-btn"
                >
                  {actionLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
