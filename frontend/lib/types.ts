export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  major?: string | null;
  gradYear?: number | null;
  university?: { id: string; name: string; domain: string } | null;
  stats: {
    projects: number;
    listings: number;
    activeRooms: number;
    pendingTasks: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  createdById: string;
  createdAt: string;
  members: ProjectMember[];
  tasks?: Task[];
  _count?: { tasks: number };
}

export interface ProjectMember {
  userId: string;
  projectId: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  joinedAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
}

export interface Task {
  id: string;
  projectId: string;
  assignedToId?: string | null;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  dueDate?: string | null;
  createdAt: string;
  assignedTo?: { id: string; firstName: string; lastName: string } | null;
}

export type TaskStatus = Task["status"];

export interface TaskBoard {
  TODO: Task[];
  IN_PROGRESS: Task[];
  REVIEW: Task[];
  DONE: Task[];
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  type: "TEXTBOOK" | "NOTES" | "STUDY_GUIDE";
  title: string;
  isbn?: string | null;
  price: number;
  status: "AVAILABLE" | "PENDING" | "SOLD";
  createdAt: string;
  seller: { id: string; firstName: string; lastName: string };
}

export interface StudyRoom {
  id: string;
  hostId: string;
  topic: string;
  isActive: boolean;
  startedAt: string;
  host: { id: string; firstName: string; lastName: string };
}
