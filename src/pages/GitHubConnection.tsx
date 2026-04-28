import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Github, ExternalLink, RefreshCw, CheckCircle2, Info, GitBranch, Save } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'convinter:github_repo_url';

export default function GitHubConnection() {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? '');
  const [draft, setDraft] = useState(repoUrl);

  const isValidRepo = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(draft.trim());

  const handleSave = () => {
    const clean = draft.trim().replace(/\/$/, '');
    localStorage.setItem(STORAGE_KEY, clean);
    setRepoUrl(clean);
    toast.success('Repositorio guardado');
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRepoUrl('');
    setDraft('');
    toast.success('Referencia eliminada');
  };

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-xl bg-foreground p-2">
            <Github className="h-6 w-6 text-background" />
          </div>
          <h1 className="text-3xl font-bold">Conexión con GitHub</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Estado de la sincronización de código entre Lovable y GitHub.
        </p>

        <div className="space-y-6">
          {/* Estado de sincronización */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Estado de sincronización
              </CardTitle>
              <CardDescription>
                Cómo funciona el flujo de código entre Lovable y tu repositorio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2">
                  Sincronización automática y bidireccional
                  <Badge variant="secondary">Tiempo real</Badge>
                </AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p>
                    Si tu proyecto está conectado a GitHub, <strong>no hay cambios pendientes</strong>:
                    los commits se propagan automáticamente en ambas direcciones.
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1 pl-2">
                    <li>Cambios en Lovable → se pushean al repo al instante.</li>
                    <li>Push a GitHub → se sincroniza al editor de Lovable.</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>¿Cómo verificar el estado real?</AlertTitle>
                <AlertDescription className="mt-2">
                  Lovable no expone el estado de conexión a la app. Para verlo:
                  <ol className="list-decimal list-inside text-sm space-y-1 pl-2 mt-2">
                    <li>Abre <strong>Connectors → GitHub</strong> en el panel de Lovable.</li>
                    <li>Si aparece tu repo conectado, todo está sincronizado.</li>
                    <li>Si no, pulsa <em>Connect project</em> para crear el repo.</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Referencia al repo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Tu repositorio
              </CardTitle>
              <CardDescription>
                Guarda la URL de tu repo de GitHub para tener acceso rápido desde aquí.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repo">URL del repositorio</Label>
                <div className="flex gap-2">
                  <Input
                    id="repo"
                    type="url"
                    placeholder="https://github.com/usuario/convinter"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <Button onClick={handleSave} disabled={!isValidRepo || draft === repoUrl}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                </div>
                {draft && !isValidRepo && (
                  <p className="text-xs text-destructive">
                    Formato esperado: https://github.com/usuario/repo
                  </p>
                )}
              </div>

              {repoUrl && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <Github className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <span className="font-mono text-sm truncate">{repoUrl}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                        Abrir
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={`${repoUrl}/commits`} target="_blank" rel="noopener noreferrer">
                        Commits
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleClear}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cómo conectar */}
          <Card>
            <CardHeader>
              <CardTitle>¿Aún no has conectado GitHub?</CardTitle>
              <CardDescription>Pasos para enlazar tu proyecto Lovable con un repo.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>En el panel de Lovable, abre <strong>Connectors → GitHub</strong>.</li>
                <li>Pulsa <strong>Connect project</strong> y autoriza la GitHub App.</li>
                <li>Selecciona la cuenta u organización donde crear el repo.</li>
                <li>Lovable creará el repositorio con todo el código actual.</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-4">
                Una vez conectado, todos los cambios fluyen automáticamente en ambos sentidos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
