"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Project, Task, TaskBoard, ProjectMember } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectDetail, setProjectDetail] = useState<Project | null>(null);
  const [board, setBoard] = useState<TaskBoard | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    api.get("/projects").then(setProjects).catch(console.error).finally(() => setLoading(false));
  }, []);

  const loadBoard = async (project: Project) => {
    setSelectedProject(project);
    const [boardData, detail] = await Promise.all([
      api.get(`/projects/${project.id}/tasks`),
      api.get(`/projects/${project.id}`),
    ]);
    setBoard(boardData);
    setProjectDetail(detail);
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = await api.post("/projects", { name, description });
    setProjects((prev) => [p, ...prev]);
    setName("");
    setDescription("");
    setShowCreate(false);
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    await api.post(`/projects/${selectedProject.id}/tasks`, { title: taskTitle });
    setTaskTitle("");
    const data = await api.get(`/projects/${selectedProject.id}/tasks`);
    setBoard(data);
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    if (!selectedProject) return;
    await api.patch(`/projects/${selectedProject.id}/tasks/${taskId}`, { status });
    const data = await api.get(`/projects/${selectedProject.id}/tasks`);
    setBoard(data);
  };

  const updateTaskAssignee = async (taskId: string, assignedToId: string | null) => {
    if (!selectedProject) return;
    await api.patch(`/projects/${selectedProject.id}/tasks/${taskId}`, { assignedToId });
    const data = await api.get(`/projects/${selectedProject.id}/tasks`);
    setBoard(data);
    setSelectedTask(null);
  };

  const addMember = async (targetUserId: string) => {
    if (!selectedProject) return;
    await api.post(`/projects/${selectedProject.id}/members`, { targetUserId, role: "EDITOR" });
    setShowAddMember(false);
    setSearchQuery("");
    setSearchResults([]);
    const detail = await api.get(`/projects/${selectedProject.id}`);
    setProjectDetail(detail);
  };

  const removeMember = async (targetUserId: string) => {
    if (!selectedProject) return;
    await api.delete(`/projects/${selectedProject.id}/members/${targetUserId}`);
    const detail = await api.get(`/projects/${selectedProject.id}`);
    setProjectDetail(detail);
  };

  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const results = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
    setSearchResults(results);
  };

  const statusLabels: Record<string, string> = {
    TODO: "To Do", IN_PROGRESS: "In Progress", REVIEW: "Review", DONE: "Done",
  };

  const statusColors: Record<string, string> = {
    TODO: "bg-gray-100 text-gray-700 border-gray-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
    REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
    DONE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (selectedProject && board) {
    const columns = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
    const currentUserId = projectDetail?.members?.find(m => m.role === "OWNER")?.userId;

    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => { setSelectedProject(null); setBoard(null); setProjectDetail(null); }} className="text-sm text-gray-400 hover:text-gray-600">←</button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold text-gray-900">{selectedProject.name}</h1>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[selectedProject.status]}`}>{selectedProject.status}</span>
                </div>
                <p className="text-sm text-gray-500">{selectedProject.description || "No description"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMembers(!showMembers)} className="btn-secondary text-xs">
                👥 {projectDetail?.members?.length || 0} members
              </button>
            </div>
          </div>
        </div>

        {showMembers && (
          <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Project Members</h3>
              <button onClick={() => setShowAddMember(true)} className="text-xs font-medium text-indigo-600 hover:text-indigo-500">+ Add member</button>
            </div>

            {showAddMember && (
              <div className="mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  placeholder="Search users by email..."
                  className="input-focus block w-full rounded-xl border border-gray-200 px-4 py-2 text-sm"
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 rounded-xl border border-gray-100 bg-white shadow-sm">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => addMember(u.id)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-medium">{u.firstName?.charAt(0) || "?"}</div>
                        <div className="text-left">
                          <p className="font-medium">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {projectDetail?.members?.map((m: ProjectMember) => (
                <div key={m.userId} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-xs font-bold text-white">
                      {m.user.firstName?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.user.firstName} {m.user.lastName}</p>
                      <p className="text-xs text-gray-400">{m.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      m.role === "OWNER" ? "bg-indigo-50 text-indigo-700" :
                      m.role === "EDITOR" ? "bg-blue-50 text-blue-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{m.role}</span>
                    {m.role !== "OWNER" && (
                      <button onClick={() => removeMember(m.userId)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-8 py-6">
          <form onSubmit={createTask} className="mb-6 flex gap-3">
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Add a new task..."
              required
              className="input-focus flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm"
            />
            <button type="submit" className="btn-primary">Add Task</button>
          </form>

          <div className="grid grid-cols-4 gap-4">
            {columns.map((col) => (
              <div key={col}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">{statusLabels[col]}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{board[col].length}</span>
                </div>
                <div className="space-y-3">
                  {board[col].map((task) => (
                    <div
                      key={task.id}
                      className="card-static group cursor-pointer p-4 transition-all duration-200 hover:shadow-md"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {col !== "TODO" && (
                            <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, columns[columns.indexOf(col) - 1]); }} className="rounded p-1 text-xs text-gray-400 hover:text-gray-600" title="Move left">←</button>
                          )}
                          {col !== "DONE" && (
                            <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, columns[columns.indexOf(col) + 1]); }} className="rounded p-1 text-xs text-gray-400 hover:text-gray-600" title="Move right">→</button>
                          )}
                        </div>
                      </div>
                      {task.description && <p className="mt-1 text-xs text-gray-400">{task.description}</p>}
                      <div className="mt-3 flex items-center justify-between">
                        {task.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[9px] font-medium text-gray-600">
                              {task.assignedTo.firstName?.charAt(0) || "?"}
                            </div>
                            <span className="text-[10px] text-gray-400">{task.assignedTo.firstName}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300">Unassigned</span>
                        )}
                        {task.dueDate && (
                          <span className="text-[10px] text-gray-400">{new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {board[col].length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-gray-100 p-6 text-center text-xs text-gray-300">No tasks</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColors[selectedTask.status]}`}>{statusLabels[selectedTask.status]}</span>
                <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h2>
              {selectedTask.description && <p className="mt-2 text-sm text-gray-500">{selectedTask.description}</p>}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">Assignee</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <button
                      onClick={() => updateTaskAssignee(selectedTask.id, null)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${!selectedTask.assignedToId ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50"}`}
                    >Unassigned</button>
                    {projectDetail?.members?.map((m: ProjectMember) => (
                      <button
                        key={m.userId}
                        onClick={() => updateTaskAssignee(selectedTask.id, m.userId)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${selectedTask.assignedToId === m.userId ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:bg-gray-50"}`}
                      >{m.user.firstName} {m.user.lastName}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                {selectedTask.status !== "TODO" && (
                  <button onClick={() => { updateTaskStatus(selectedTask.id, columns[columns.indexOf(selectedTask.status) - 1]); setSelectedTask(null); }} className="btn-secondary text-sm">← Move to {statusLabels[columns[columns.indexOf(selectedTask.status) - 1]]}</button>
                )}
                {selectedTask.status !== "DONE" && (
                  <button onClick={() => { updateTaskStatus(selectedTask.id, columns[columns.indexOf(selectedTask.status) + 1]); setSelectedTask(null); }} className="btn-primary text-sm">Move to {statusLabels[columns[columns.indexOf(selectedTask.status) + 1]]} →</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">My Projects</h1>
            <p className="text-sm text-gray-500">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ New Project</button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">New Project</h2>
            <form onSubmit={createProject} className="mt-4 space-y-4">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" required className="input-focus block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={3} className="input-focus block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="px-8 py-6">
        {projects.length === 0 ? (
          <div className="card-static mx-auto max-w-md p-12 text-center">
            <div className="text-5xl">📋</div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No projects yet</h3>
            <p className="mt-2 text-sm text-gray-500">Create your first project to get started.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-6">Create Project</button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <button key={project.id} onClick={() => loadBoard(project)} className="card group text-left p-6">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[project.status]}`}>{project.status}</span>
                </div>
                {project.description && <p className="mt-2 text-sm text-gray-500 line-clamp-2">{project.description}</p>}
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                  <span>{project._count?.tasks ?? 0} tasks</span>
                  <span>{project.members?.length ?? 0} members</span>
                </div>
                <div className="mt-3 flex -space-x-1.5">
                  {project.members?.slice(0, 4).map((m) => (
                    <div key={m.userId} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-[9px] font-medium text-gray-600">
                      {m.user.firstName?.charAt(0) || "?"}
                    </div>
                  ))}
                  {(project.members?.length || 0) > 4 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-50 text-[9px] text-gray-400">+{project.members.length - 4}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
