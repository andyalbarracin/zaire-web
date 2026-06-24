'use server';

import { redirect } from 'next/navigation';
import { createProject, updateProject } from '@/lib/zaire-ops/queries';
import { requireUser } from '@/lib/zaire-ops/auth';
import { s, sReq } from '@/lib/zaire-ops/form';
import type { ProjectStatus } from '@/lib/zaire-ops/types';

function parse(fd: FormData) {
  return {
    client_id: sReq(fd, 'client_id'),
    name: sReq(fd, 'name'),
    type: sReq(fd, 'type') || 'Custom App',
    status: (sReq(fd, 'status') || 'activo') as ProjectStatus,
    phase: s(fd, 'phase'),
    stack: s(fd, 'stack'),
    production_url: s(fd, 'production_url'),
    staging_url: s(fd, 'staging_url'),
    repository_url: s(fd, 'repository_url'),
    next_milestone: s(fd, 'next_milestone'),
    notes: s(fd, 'notes'),
  };
}

export async function createProjectAction(fd: FormData) {
  await requireUser();
  const p = await createProject(parse(fd));
  redirect(`/dashboard/proyectos/${p.id}`);
}

export async function updateProjectAction(id: string, fd: FormData) {
  await requireUser();
  await updateProject(id, parse(fd));
  redirect(`/dashboard/proyectos/${id}`);
}
