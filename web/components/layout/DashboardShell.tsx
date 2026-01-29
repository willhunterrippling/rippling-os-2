"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { UserSwitcher } from "@/components/auth/UserSwitcher";

interface SidebarItem {
  name: string;
  title: string;
}

interface ProjectWithContents {
  slug: string;
  name: string;
  description?: string | null;
  owner?: string;
  dashboards: SidebarItem[];
  queries: SidebarItem[];
  reports: SidebarItem[];
}

interface UserWithProjects {
  email: string;
  name: string | null;
  projectCount: number;
}

interface DashboardShellProps {
  children: React.ReactNode;
  projects: ProjectWithContents[];
  users: UserWithProjects[];
  currentUser: {
    email?: string | null;
    name?: string | null;
  } | null;
}

export function DashboardShell({
  children,
  projects,
  users,
  currentUser,
}: DashboardShellProps) {
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(
    null
  );

  // Filter projects based on selected user
  const filteredProjects = selectedUserEmail
    ? projects.filter((p) => p.owner === selectedUserEmail)
    : projects;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        projects={filteredProjects}
        currentUserEmail={currentUser?.email}
      />
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b border-border bg-background px-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Rippling OS</h1>
          <div className="flex items-center gap-4">
            {currentUser?.email && (
              <UserSwitcher
                users={users}
                currentUserEmail={currentUser.email}
                selectedUserEmail={selectedUserEmail}
                onSelectUser={setSelectedUserEmail}
              />
            )}
            <Header user={currentUser} />
          </div>
        </header>
        <main className="flex-1 p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
