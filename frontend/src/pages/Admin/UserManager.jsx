import React, { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import {
  listUsers, updateUser, resetUserPassword, createUser,
} from "../../services/authApi";
import { useAuth } from "../../hooks/useAuth";
import "./UserManager.css";

const formatTime = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("zh-CN", { hour12: false });
  } catch {
    return iso;
  }
};

const UserManager = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetValue, setResetValue] = useState("");
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listUsers();
      setUsers(data.users || []);
    } catch (err) {
      message.error(err?.message || "加载用户列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRoleToggle = async (u) => {
    const next = u.role === "admin" ? "user" : "admin";
    try {
      await updateUser(u.id, { role: next });
      message.success(`已将 ${u.email} 设为${next === "admin" ? "管理员" : "普通用户"}`);
      load();
    } catch (err) {
      message.error(err?.message || "修改角色失败");
    }
  };

  const handleStatusToggle = async (u) => {
    const next = u.status === "active" ? "disabled" : "active";
    try {
      await updateUser(u.id, { status: next });
      message.success(`${next === "active" ? "已启用" : "已禁用"} ${u.email}`);
      load();
    } catch (err) {
      message.error(err?.message || "修改状态失败");
    }
  };

  const openReset = (u) => {
    setResetTarget(u);
    setResetValue("");
  };

  const submitReset = async () => {
    if (!resetTarget) return;
    try {
      const data = await resetUserPassword(resetTarget.id, resetValue.trim() || null);
      message.success(`新密码：${data.password}（仅显示一次，请妥善保存）`, 8);
      setResetTarget(null);
      setResetValue("");
    } catch (err) {
      message.error(err?.message || "重置密码失败");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword) {
      message.error("请填写邮箱和密码");
      return;
    }
    try {
      await createUser(newEmail.trim(), newPassword, newRole);
      message.success(`已创建用户 ${newEmail.trim()}`);
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
      setCreating(false);
      load();
    } catch (err) {
      message.error(err?.message || "创建用户失败");
    }
  };

  return (
    <div className="user-manager">
      <div className="user-manager-header">
        <h1 className="user-manager-title">用户管理</h1>
        <button
          type="button"
          className="user-manager-btn user-manager-btn--primary"
          onClick={() => setCreating((v) => !v)}
        >
          {creating ? "取消" : "新建用户"}
        </button>
      </div>

      {creating && (
        <form className="user-manager-create" onSubmit={handleCreate}>
          <input
            type="email"
            className="user-manager-input"
            placeholder="邮箱"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            aria-label="邮箱"
          />
          <input
            type="password"
            className="user-manager-input"
            placeholder="密码（至少 6 位）"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-label="密码"
          />
          <select
            className="user-manager-input"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            aria-label="角色"
          >
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
          <button type="submit" className="user-manager-btn user-manager-btn--primary">创建</button>
        </form>
      )}

      {loading ? (
        <p className="user-manager-empty">加载中...</p>
      ) : users.length === 0 ? (
        <p className="user-manager-empty">暂无用户</p>
      ) : (
        <div className="user-manager-table-wrap">
          <table className="user-manager-table">
            <thead>
              <tr>
                <th>邮箱</th>
                <th>角色</th>
                <th>状态</th>
                <th>注册时间</th>
                <th>最近登录</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = currentUser && u.id === currentUser.id;
                return (
                  <tr key={u.id}>
                    <td>
                      {u.email}
                      {isSelf && <span className="user-manager-self">（你）</span>}
                    </td>
                    <td>
                      <span className={`user-manager-role user-manager-role--${u.role}`}>
                        {u.role === "admin" ? "管理员" : "普通用户"}
                      </span>
                    </td>
                    <td>
                      <span className={`user-manager-status user-manager-status--${u.status}`}>
                        {u.status === "active" ? "正常" : "已禁用"}
                      </span>
                    </td>
                    <td>{formatTime(u.created_at)}</td>
                    <td>{formatTime(u.last_login_at)}</td>
                    <td className="user-manager-actions">
                      <button
                        type="button"
                        className="user-manager-btn"
                        onClick={() => handleRoleToggle(u)}
                        disabled={isSelf}
                        title={isSelf ? "不能修改自己的角色" : ""}
                      >
                        {u.role === "admin" ? "降为用户" : "升为管理员"}
                      </button>
                      <button
                        type="button"
                        className="user-manager-btn"
                        onClick={() => handleStatusToggle(u)}
                        disabled={isSelf}
                        title={isSelf ? "不能禁用自己" : ""}
                      >
                        {u.status === "active" ? "禁用" : "启用"}
                      </button>
                      <button
                        type="button"
                        className="user-manager-btn"
                        onClick={() => openReset(u)}
                      >
                        重置密码
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {resetTarget && (
        <div className="user-manager-modal-overlay" onClick={() => setResetTarget(null)} role="presentation">
          <div className="user-manager-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="重置密码">
            <h3 className="user-manager-modal-title">重置密码：{resetTarget.email}</h3>
            <p className="user-manager-modal-desc">留空将自动生成一个 12 位随机密码。重置后请将新密码告知该用户。</p>
            <input
              type="text"
              className="user-manager-input"
              placeholder="新密码（可选，至少 6 位）"
              value={resetValue}
              onChange={(e) => setResetValue(e.target.value)}
              aria-label="新密码"
            />
            <div className="user-manager-modal-actions">
              <button type="button" className="user-manager-btn" onClick={() => setResetTarget(null)}>取消</button>
              <button type="button" className="user-manager-btn user-manager-btn--primary" onClick={submitReset}>确认重置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
