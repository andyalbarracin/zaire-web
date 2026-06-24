'use server';

import { redirect } from 'next/navigation';
import { createProject, updateProject } from '@/lib/zaire-ops/queries';
import { requireUser } from '@/lib/zaire-ops/auth';
import { s, sReq, actionError, type FormState } from '@/lib/zaire-ops/form';
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

export async function createProjectAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const data = parse(fd);
  if (!data.client_id) return { error: 'Elegí un cliente.' };
  if (!data.name) return { error: 'El nombre del proyecto es obligatorio.' };
  let id: string;
  try { id = (await createProject(data)).id; }
  catch (e) { return actionError(e); }
  redirect(`/dashboard/proyectos/${id}`);
}

export async function updateProjectAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const data = parse(fd);
  if (!data.name) return { error: 'El nombre del proyecto es obligatorio.' };
  try { await updateProject(id, data); }
  catch (e) { return actionError(e); }
  redirect(`/dashboard/proyectos/${id}`);
}
