import { useMemo, useState } from 'react'

import { Link, useParams } from 'react-router-dom'

import { useProject } from '../../features/projects/hooks/useProjects'
import { routes } from '../../shared/config/routes'
import { trackEvent } from '../../shared/lib/analytics'
import { useAuthStore } from '../../shared/store/useAuthStore'
import { Button } from '../../shared/ui/Button'
import { Spinner } from '../../shared/ui/Spinner'

import { ProjectLanguagePanel } from './components/ProjectLanguagePanel'
import { ProjectStudioPanel } from './components/ProjectStudioPanel'

export default function ProjectDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { data: project, isLoading } = useProject(id)
  const roles = useAuthStore((state) => state.roles)
  const [language, setLanguage] = useState<string>()
  const [version, setVersion] = useState<'original' | 'translated'>('translated')
  const canEdit = roles.includes('editor')

  const assetsByLanguage = useMemo(() => {
    if (!project) return {}
    return (project.assets ?? []).reduce<Record<string, typeof project.assets>>((acc, asset) => {
      acc[asset.language] = acc[asset.language] ? [...acc[asset.language], asset] : [asset]
      return acc
    }, {})
  }, [project])

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-foreground text-lg font-semibold">프로젝트를 찾을 수 없습니다.</p>
        <p className="text-muted text-sm">목록으로 돌아가 다시 시도하세요.</p>
        <Button asChild>
          <Link to={routes.projects}>프로젝트 목록으로</Link>
        </Button>
      </div>
    )
  }

  const activeLanguage = language ?? project.targetLanguages[0] ?? project.sourceLanguage
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-muted text-xs font-semibold uppercase tracking-wider">프로젝트 상세</p>
          <h1 className="text-foreground mt-1 text-3xl font-semibold">{project.title}</h1>
          <p className="text-muted mt-2 text-sm">
            {project.sourceLanguage} → {project.targetLanguages.join(', ')} | 화자{' '}
            {project.speakerCount}명
          </p>
          <p className="text-muted text-xs">
            생성일 {new Date(project.createdAt).toLocaleString()}
          </p>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              onClick={() => trackEvent('enter_editor_click', { projectId: project.id })}
            >
              <Link to={routes.editor(project.id)}>편집하기</Link>
            </Button>
          </div>
        ) : null}
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.75fr,1fr]">
        <ProjectLanguagePanel
          project={project}
          activeLanguage={activeLanguage}
          onLanguageChange={setLanguage}
          version={version}
          onVersionChange={setVersion}
          assetsByLanguage={assetsByLanguage}
        />
        <ProjectStudioPanel projectId={project.id} />
      </section>
    </div>
  )
}
