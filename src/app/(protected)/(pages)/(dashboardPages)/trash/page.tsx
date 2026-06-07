import React from 'react'
import DeleteAllButton from './_components/DeleteAllButton'
import { getDeletedProjects } from '@/actions/projects';
import { NotFound } from '@/components/global/not-found';
import Projects from '@/components/global/projects';
import { DashboardProject } from '@/actions/unified-projects';

const TrashPage = async() => {

    const deletedProjects = await getDeletedProjects();
    if (!deletedProjects.data) return <NotFound />;

    const projects: DashboardProject[] = deletedProjects.data.map((p) => ({
      id: p.id,
      title: p.title,
      type: "PRESENTATION" as const,
      thumbnail: p.thumbnail,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      slides: p.slides,
      theme: p.themeName,
      isSellable: p.isSellable,
    }));

  return (
    <div className="flex flex-col gap-6 relative p-4 md:p-8">
        <div className='flex justify-between items-center'>
            <div className='flex flex-col items-start'>
                <h1 className='text-2xl font-semibold backdrop-blur-lg'>Trash</h1>
                <p className='text-base font-normal text-secondary'>All your deleted presentation</p>
            </div>

            <DeleteAllButton Projects={deletedProjects.data} />
        </div>

        {projects.length > 0 ? (
        <Projects projects={projects} />
      ) : (
        <NotFound />
      )}
    </div>
  )
}

export default TrashPage