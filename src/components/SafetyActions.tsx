import { useState } from 'react';
import { Ban, Flag, Loader2, MoreHorizontal, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ReportTargetType = 'user' | 'listing' | 'message';

type SafetyActionsProps = {
  targetType: ReportTargetType;
  targetId: string | number;
  targetUserId?: string;
  targetName?: string;
  buttonLabel?: string;
  compact?: boolean;
  disabled?: boolean;
  onBlocked?: () => void;
};

const reportCategories = [
  { value: 'scam', label: 'Estafa o fraude' },
  { value: 'harassment', label: 'Acoso o conducta abusiva' },
  { value: 'fake', label: 'Perfil o anuncio falso' },
  { value: 'inappropriate', label: 'Contenido inapropiado' },
  { value: 'other', label: 'Otro motivo' },
];

const targetLabels: Record<ReportTargetType, string> = {
  user: 'usuario',
  listing: 'anuncio',
  message: 'mensaje',
};

const getDefaultReason = (category: string) => {
  const match = reportCategories.find((item) => item.value === category);
  return match?.label ?? 'Reporte de seguridad';
};

export function SafetyActions({
  targetType,
  targetId,
  targetUserId,
  targetName,
  buttonLabel = 'Seguridad',
  compact = false,
  disabled = false,
  onBlocked,
}: SafetyActionsProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [category, setCategory] = useState('other');
  const [detail, setDetail] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const resetReport = () => {
    setCategory('other');
    setDetail('');
  };

  const submitReport = async () => {
    setSubmittingReport(true);
    const reason = getDefaultReason(category);
    const trimmedDetail = detail.trim() || undefined;

    const { data, error } = targetType === 'user'
      ? await supabase.rpc('convinter_report_user', {
          p_target_user: String(targetId),
          p_category: category,
          p_reason: reason,
          p_detail: trimmedDetail,
        })
      : targetType === 'listing'
        ? await supabase.rpc('convinter_report_listing', {
            p_target_listing: String(targetId),
            p_category: category,
            p_reason: reason,
            p_detail: trimmedDetail,
          })
        : await supabase.rpc('convinter_report_message', {
            p_target_message: Number(targetId),
            p_category: category,
            p_reason: reason,
            p_detail: trimmedDetail,
          });

    setSubmittingReport(false);

    if (error) {
      console.error('Error submitting report:', error);
      toast.error('No se pudo enviar el reporte.');
      return;
    }

    const result = data as unknown as { ok?: boolean; code?: string } | null;
    if (result?.ok === false) {
      toast.error(result.code === 'NOT_AUTHENTICATED' ? 'Inicia sesion para reportar.' : 'No se pudo enviar el reporte.');
      return;
    }

    toast.success('Reporte enviado. Gracias por ayudarnos a mantener la comunidad segura.');
    setReportOpen(false);
    resetReport();
  };

  const blockUser = async () => {
    if (!targetUserId) return;
    setBlocking(true);

    const { data, error } = await supabase.rpc('convinter_block_user', {
      p_target: targetUserId,
      p_reason: 'Bloqueado desde la app',
    });

    setBlocking(false);

    if (error) {
      console.error('Error blocking user:', error);
      toast.error('No se pudo bloquear al usuario.');
      return;
    }

    const result = data as unknown as { ok?: boolean; code?: string } | null;
    if (result?.ok === false) {
      toast.error(result.code === 'INVALID_TARGET' ? 'No puedes bloquearte a ti mismo.' : 'No se pudo bloquear al usuario.');
      return;
    }

    toast.success('Usuario bloqueado.');
    setBlockOpen(false);
    onBlocked?.();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={compact ? 'ghost' : 'outline'}
            size={compact ? 'icon' : 'sm'}
            className={compact ? '' : 'gap-2'}
            disabled={disabled}
            aria-label={compact ? 'Abrir opciones de seguridad' : undefined}
          >
            {compact ? (
              <MoreHorizontal className="h-4 w-4" />
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                {buttonLabel}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setReportOpen(true)} className="cursor-pointer">
            <Flag className="mr-2 h-4 w-4" />
            Reportar {targetLabels[targetType]}
          </DropdownMenuItem>
          {targetUserId && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setBlockOpen(true)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Ban className="mr-2 h-4 w-4" />
                Bloquear usuario
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar {targetLabels[targetType]}</DialogTitle>
            <DialogDescription>
              Revisaremos el caso y tomaremos medidas si incumple las normas de Convinter.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportCategories.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-detail">Detalle opcional</Label>
              <Textarea
                id="report-detail"
                value={detail}
                onChange={(event) => setDetail(event.target.value)}
                placeholder="Cuéntanos brevemente qué ha ocurrido..."
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitReport} disabled={submittingReport}>
              {submittingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear usuario</DialogTitle>
            <DialogDescription>
              {targetName ? `Dejarás de interactuar con ${targetName}.` : 'Dejarás de interactuar con este usuario.'}
              {' '}Podrás desbloquearlo más adelante desde Configuración.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={blockUser} disabled={blocking}>
              {blocking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
