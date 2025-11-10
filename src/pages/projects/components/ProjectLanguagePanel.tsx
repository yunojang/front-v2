import { Download, Play } from 'lucide-react'

import type { ProjectAsset, ProjectDetail } from '@/entities/project/types'
import { env } from '@/shared/config/env'
import { trackEvent } from '@/shared/lib/analytics'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/Button'

type ProjectLanguagePanelProps = {
  project: ProjectDetail
  activeLanguage: string
  onLanguageChange: (language: string) => void
  version: 'original' | 'translated'
  onVersionChange: (version: 'original' | 'translated') => void
  assetsByLanguage: Record<string, ProjectAsset[]>
}

export function ProjectLanguagePanel({
  project,
  activeLanguage,
  onLanguageChange,
  version,
  onVersionChange,
  assetsByLanguage,
}: ProjectLanguagePanelProps) {
  return (
    <div className="border-surface-3 bg-surface-1 space-y-3 rounded-3xl border p-6 shadow-soft">
      {project.targetLanguages.map((lang) => (
        <div key={lang}>
          <LanguagePreview
            language={lang}
            assets={assetsByLanguage[lang] ?? []}
            version={version}
            onVersionChange={onVersionChange}
            videoSource={project.video_source}
            sourceLanguage={project.sourceLanguage}
            targetLanguages={project.targetLanguages}
            onLanguageChange={onLanguageChange}
            activeLanguage={activeLanguage}
          />
        </div>
      ))}
    </div>
  )
}

type LanguagePreviewProps = {
  language: string
  assets: ProjectAsset[]
  version: 'original' | 'translated'
  onVersionChange: (version: 'original' | 'translated') => void
  videoSource?: string
  sourceLanguage: string
  targetLanguages: string[]
  onLanguageChange: (language: string) => void
  activeLanguage: string
}

function LanguagePreview({
  language,
  assets,
  version,
  onVersionChange,
  videoSource,
  sourceLanguage,
  targetLanguages,
  onLanguageChange,
  activeLanguage,
}: LanguagePreviewProps) {
  const languageButtons = [sourceLanguage, ...targetLanguages].map((lang) => ({
    label: lang === sourceLanguage ? `${lang}(원본)` : lang,
    language: lang,
  }))

  const selectedAsset = assets.find((asset) => asset.type === 'video')
  const translatedSource = selectedAsset?.url
  const previewSource = version === 'original' ? videoSource : (translatedSource ?? videoSource)
  const videoSrc = `${env.apiBaseUrl}/api/storage/media/${previewSource}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {languageButtons.map(({ label, language: buttonLang }) => {
          const isActive = buttonLang === activeLanguage
          const buttonClass = cn('rounded-full px-3 py-1 text-xs transition')
          return (
            <Button
              key={label}
              variant={isActive ? 'primary' : 'ghost'}
              size="sm"
              className={buttonClass}
              aria-pressed={isActive}
              onClick={() => {
                onLanguageChange(buttonLang)
                if (buttonLang === sourceLanguage) {
                  onVersionChange('original')
                } else {
                  onVersionChange('translated')
                }
              }}
            >
              {label}
            </Button>
          )
        })}
      </div>
      <div className="border-surface-3 bg-surface-1 relative overflow-hidden rounded-md border">
        {previewSource ? (
          <video
            key={`${language}-${version}`}
            controls
            autoPlay={false}
            className="h-[24em] w-full bg-black object-contain"
            src={videoSrc}
            preload="metadata"
          >
            <track kind="captions" />
          </video>
        ) : (
          <div className="bg-surface-2 text-muted flex h-64 flex-col items-center justify-center gap-3">
            <Play className="h-8 w-8" />
            <p className="text-sm">더빙 영상 미리보기 (모의)</p>
          </div>
        )}
        {selectedAsset ? (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
            <span>{selectedAsset.codec}</span>
            <span>{selectedAsset.resolution}</span>
            <span>{selectedAsset.duration}s</span>
          </div>
        ) : null}
      </div>
      <div className="space-y-2">
        <p className="text-foreground mb-3 text-sm font-semibold">결과물</p>
        <div className="space-y-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={cn(
                'border-surface-4 bg-surface-1 text-muted flex items-center justify-between rounded-2xl border px-4 py-3 text-sm',
              )}
            >
              <div>
                <p className="text-foreground font-medium">
                  {asset.type === 'video' ? '더빙 영상' : '자막'} • {language}
                </p>
                <p className="text-muted text-xs">
                  {asset.codec} • {asset.resolution} • {asset.sizeMb}MB
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  trackEvent('asset_download', {
                    lang: language,
                    type: asset.type,
                    assetId: asset.id,
                  })
                }
              >
                <Download className="h-4 w-4" />
                다운로드
              </Button>
            </div>
          ))}
        </div>
        {assets.length === 0 ? (
          <div className="border-surface-4 bg-surface-2 text-muted rounded-2xl border border-dashed px-4 py-6 text-center text-sm">
            아직 산출물이 없습니다. 파이프라인 진행을 기다려주세요.
          </div>
        ) : null}
      </div>
    </div>
  )
}
