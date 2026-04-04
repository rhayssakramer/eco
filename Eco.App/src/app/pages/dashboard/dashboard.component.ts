import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileMenuComponent } from './profile-menu/profile-menu.component';
import { ToastService } from '../../shared/toast/toast.service';
import { environment } from '../../../environments/environment';

interface UsuarioLogado {
  isAdmin?: boolean;
  IsAdmin?: boolean;
  email?: string;
  Email?: string;
}

interface DashboardStats {
  totalDenuncias: number;
  emergencias: number;
  ultimaSemana: number;
  dadosPublicos: number;
}

interface TipoViolencia {
  tipo: string;
  percentual: number;
  cor: string;
}

interface Denuncia {
  id: number;
  anonima?: boolean;
  usuarioId?: number | null;
  usuarioNome?: string | null;
  usuarioEmail?: string | null;
  codigo: string;
  tipo: number;
  descricao: string;
  status: number;
  dataCriacao: string;
  latitude?: number;
  longitude?: number;
}

interface EvidenciaDenuncia {
  id: number;
  nomeArquivo: string;
  url: string;
  tipo: 'imagem' | 'video' | 'arquivo';
}

interface DenunciaDetalhe extends Denuncia {
  evidencias: EvidenciaDenuncia[];
}

interface DadoExterno {
  id: number;
  bairro: string;
  tipo: string;
  quantidade: number;
  latitude: number;
  longitude: number;
  dataRegistro: string;
}

interface DadoExternoForm {
  bairro: string;
  tipo: string;
  quantidade: number;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DecimalPipe, FormsModule, ProfileMenuComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly adminEmailPadrao = 'admin@eco.local';
  private readonly apiBase = environment.apiBaseUrl;
  private pendingDeleteId: number | null = null;
  private pendingDeleteCodigo: string | null = null;
  private pendingDeleteTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly visualizacao = signal<'inicio' | 'denuncias' | 'dados-externos'>('inicio');
  
  protected readonly stats = signal<DashboardStats>({
    totalDenuncias: 1247,
    emergencias: 23,
    ultimaSemana: 342,
    dadosPublicos: 2847
  });

  protected readonly tiposViolencia = signal<TipoViolencia[]>([
    { tipo: 'Violência Física', percentual: 40, cor: '#ff6b9d' },
    { tipo: 'Violência Psicológica', percentual: 30, cor: '#a855f7' },
    { tipo: 'Abuso Sexual', percentual: 20, cor: '#60a5fa' },
    { tipo: 'Outros', percentual: 10, cor: '#fbbf24' }
  ]);

  protected readonly areasRisco = signal<string[]>([
    'Boa Viagem',
    'Casa Amarela',
    'Ibura'
  ]);

  protected readonly dicasSeguranca = signal<string[]>([
    'Evite andar sozinha à noite.',
    'Informe alguém de confiança sobre seu trajeto.',
    'Conheça os contatos de apoio na sua região.'
  ]);

  protected readonly isAdmin = signal(false);
  protected readonly denuncias = signal<Denuncia[]>([]);
  protected readonly carregandoDenuncias = signal(false);
  protected readonly erroDenuncias = signal('');
  protected readonly filtroTermo = signal('');
  protected readonly filtroStatus = signal<number | null>(null);
  protected readonly filtroTipo = signal<number | null>(null);
  protected readonly filtroOrigem = signal<'todas' | 'anonima' | 'identificada'>('todas');
  protected readonly denunciaSelecionada = signal<DenunciaDetalhe | null>(null);
  protected readonly carregandoDetalhes = signal(false);
  protected readonly erroDetalhes = signal('');
  protected readonly midiaSelecionada = signal<EvidenciaDenuncia | null>(null);
  protected readonly dadosExternos = signal<DadoExterno[]>([]);
  protected readonly carregandoDadosExternos = signal(false);
  protected readonly salvandoDadoExterno = signal(false);
  protected readonly novoDadoExterno = signal<DadoExternoForm>({
    bairro: '',
    tipo: '',
    quantidade: 1,
    latitude: -8.0476,
    longitude: -34.877
  });

  protected readonly denunciasFiltradas = computed(() => {
    const termo = this.filtroTermo().trim().toLowerCase();
    const status = this.filtroStatus();
    const tipo = this.filtroTipo();
    const origem = this.filtroOrigem();

    return this.denuncias().filter((d) => {
      const matchTermo = !termo
        || d.codigo?.toLowerCase().includes(termo)
        || d.descricao?.toLowerCase().includes(termo)
        || (d.usuarioNome ?? '').toLowerCase().includes(termo)
        || (d.usuarioEmail ?? '').toLowerCase().includes(termo);

      const matchStatus = status === null || d.status === status;
      const matchTipo = tipo === null || d.tipo === tipo;
      const matchOrigem =
        origem === 'todas'
        || (origem === 'anonima' && !!d.anonima)
        || (origem === 'identificada' && !d.anonima);

      return matchTermo && matchStatus && matchTipo && matchOrigem;
    });
  });

  constructor() {
    this.isAdmin.set(this.obterIsAdmin());

    if (this.isAdmin()) {
      this.carregarDenuncias();
    }
  }

  protected sair(): void {
    // Limpar sessão/token aqui
    this.router.navigate(['/']);
  }

  protected abrirInicio(): void {
    this.visualizacao.set('inicio');
  }

  protected abrirDenuncias(): void {
    if (!this.isAdmin()) {
      return;
    }

    this.visualizacao.set('denuncias');
  }

  protected abrirDadosExternos(): void {
    if (!this.isAdmin()) {
      return;
    }

    this.visualizacao.set('dados-externos');
    this.carregarDadosExternos();
  }

  protected atualizarCampoDadoExterno(campo: keyof DadoExternoForm, valor: string): void {
    const atual = this.novoDadoExterno();

    if (campo === 'quantidade' || campo === 'latitude' || campo === 'longitude') {
      this.novoDadoExterno.set({
        ...atual,
        [campo]: Number(valor)
      });
      return;
    }

    this.novoDadoExterno.set({
      ...atual,
      [campo]: valor
    });
  }

  protected salvarDadoExterno(): void {
    if (!this.isAdmin()) {
      return;
    }

    const payload = this.novoDadoExterno();
    if (!payload.bairro.trim() || !payload.tipo.trim()) {
      this.toast.show('Preencha bairro e tipo para salvar o dado externo.', 'warning');
      return;
    }

    if (!Number.isFinite(payload.quantidade) || payload.quantidade <= 0) {
      this.toast.show('Informe uma quantidade válida.', 'warning');
      return;
    }

    if (!Number.isFinite(payload.latitude) || payload.latitude < -90 || payload.latitude > 90) {
      this.toast.show('Informe uma latitude válida entre -90 e 90.', 'warning');
      return;
    }

    if (!Number.isFinite(payload.longitude) || payload.longitude < -180 || payload.longitude > 180) {
      this.toast.show('Informe uma longitude válida entre -180 e 180.', 'warning');
      return;
    }

    this.salvandoDadoExterno.set(true);

    this.http.post<DadoExterno>(`${this.apiBase}/api/denuncias/dados-externos`, payload)
      .subscribe({
        next: () => {
          this.salvandoDadoExterno.set(false);
          this.toast.show('Dado externo salvo com sucesso.', 'success');
          this.limparFormularioDadoExterno();
          this.carregarDadosExternos();
        },
        error: () => {
          this.salvandoDadoExterno.set(false);
          this.toast.show('Não foi possível salvar o dado externo.', 'error');
        }
      });
  }

  protected limparFormularioDadoExterno(): void {
    this.novoDadoExterno.set({
      bairro: '',
      tipo: '',
      quantidade: 1,
      latitude: -8.0476,
      longitude: -34.877
    });
  }

  protected formatarDataRegistro(data: string): string {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected atualizarFiltroTermo(valor: string): void {
    this.filtroTermo.set(valor);
  }

  protected atualizarFiltroStatus(valor: string): void {
    this.filtroStatus.set(valor === '' ? null : Number(valor));
  }

  protected atualizarFiltroTipo(valor: string): void {
    this.filtroTipo.set(valor === '' ? null : Number(valor));
  }

  protected atualizarFiltroOrigem(valor: 'todas' | 'anonima' | 'identificada'): void {
    this.filtroOrigem.set(valor);
  }

  protected limparFiltros(): void {
    this.filtroTermo.set('');
    this.filtroStatus.set(null);
    this.filtroTipo.set(null);
    this.filtroOrigem.set('todas');
  }

  protected carregarDenuncias(): void {
    this.carregandoDenuncias.set(true);

    this.http.get<Denuncia[]>(`${this.apiBase}/api/denuncias`)
      .subscribe({
        next: (data) => {
          this.denuncias.set(data ?? []);
          this.carregandoDenuncias.set(false);
        },
        error: () => {
          this.toast.show('Erro ao carregar denúncias.', 'error');
          this.carregandoDenuncias.set(false);
        }
      });
  }

  protected carregarDadosExternos(): void {
    this.carregandoDadosExternos.set(true);

    this.http.get<DadoExterno[]>(`${this.apiBase}/api/denuncias/dados-externos`)
      .subscribe({
        next: (data) => {
          this.dadosExternos.set(data ?? []);
          this.carregandoDadosExternos.set(false);
        },
        error: () => {
          this.toast.show('Erro ao carregar dados externos.', 'error');
          this.carregandoDadosExternos.set(false);
        }
      });
  }

  protected getTipoTexto(tipo: number): string {
    const tipos: Record<number, string> = {
      0: 'Violência',
      1: 'Assédio',
      2: 'Discriminação',
      3: 'Outro'
    };

    return tipos[tipo] || 'Desconhecido';
  }

  protected getStatusTexto(status: number): string {
    const statuses: Record<number, string> = {
      0: 'Recebido',
      1: 'Emergência',
      2: 'Em análise',
      3: 'Finalizado',
      4: 'Reprovado'
    };

    return statuses[status] || 'Desconhecido';
  }

  protected getStatusClasse(status: number): string {
    const classes: Record<number, string> = {
      0: 'status-recebido',
      1: 'status-emergencia',
      2: 'status-analise',
      3: 'status-finalizado',
      4: 'status-reprovado'
    };

    return classes[status] || '';
  }

  protected aprovar(id: number): void {
    this.alterarStatus(id, 2);
  }

  protected reprovar(id: number): void {
    this.alterarStatus(id, 4);
  }

  protected finalizar(id: number): void {
    this.alterarStatus(id, 3);
  }

  protected marcarEmergencia(id: number): void {
    this.alterarStatus(id, 1);
  }

  protected formatarData(data: string): string {
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  protected formatarLocalidade(denuncia: Denuncia): string {
    const latitude = denuncia.latitude;
    const longitude = denuncia.longitude;

    if (latitude == null || longitude == null) {
      return 'Não informada';
    }

    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  protected abrirDetalhes(denuncia: Denuncia): void {
    this.carregandoDetalhes.set(true);
    this.denunciaSelecionada.set(null);

    this.http.get<DenunciaDetalhe>(`${this.apiBase}/api/denuncias/${denuncia.id}/detalhes`)
      .subscribe({
        next: (detalhes) => {
          const evidencias = (detalhes.evidencias ?? []).map((item) => ({
            ...item,
            url: item.url.startsWith('http') ? item.url : `${this.apiBase}${item.url}`
          }));

          this.denunciaSelecionada.set({
            ...detalhes,
            evidencias
          });

          this.carregandoDetalhes.set(false);
        },
        error: () => {
          this.toast.show('Não foi possível carregar os detalhes da denúncia.', 'error');
          this.carregandoDetalhes.set(false);
        }
      });
  }

  protected fecharDetalhes(): void {
    this.denunciaSelecionada.set(null);
    this.midiaSelecionada.set(null);
  }

  protected abrirMidia(midia: EvidenciaDenuncia): void {
    this.midiaSelecionada.set(midia);
  }

  protected fecharMidia(): void {
    this.midiaSelecionada.set(null);
  }

  protected ehMidiaVisualizavel(midia: EvidenciaDenuncia): boolean {
    return midia.tipo === 'imagem' || midia.tipo === 'video';
  }

  protected excluirDenuncia(id: number, codigo?: string): void {
    if (this.pendingDeleteId !== id) {
      this.pendingDeleteId = id;
      this.pendingDeleteCodigo = codigo ?? null;
      if (this.pendingDeleteTimer) {
        clearTimeout(this.pendingDeleteTimer);
      }

      this.pendingDeleteTimer = setTimeout(() => {
        this.pendingDeleteId = null;
        this.pendingDeleteCodigo = null;
        this.pendingDeleteTimer = null;
      }, 5000);
      return;
    }

    this.executarExclusao(id);
  }

  protected confirmarExclusaoPendente(): void {
    if (this.pendingDeleteId === null) {
      return;
    }

    this.executarExclusao(this.pendingDeleteId);
  }

  protected cancelarExclusaoPendente(): void {
    this.limparConfirmacaoExclusao();
  }

  protected isDeleteConfirmando(id: number): boolean {
    return this.pendingDeleteId === id;
  }

  protected get deleteTooltipVisible(): boolean {
    return this.pendingDeleteId !== null;
  }

  protected getDeleteTooltipMessage(): string {
    if (!this.pendingDeleteCodigo) {
      return 'Você está prestes a excluir esta denúncia.';
    }

    return `Excluir denúncia ${this.pendingDeleteCodigo}?`;
  }

  private executarExclusao(id: number): void {
    this.limparConfirmacaoExclusao();

    this.http.delete(`${this.apiBase}/api/denuncias/${id}`)
      .subscribe({
        next: () => {
          this.toast.show('Denúncia excluída com sucesso.', 'success');
          this.carregarDenuncias();

          const selecionada = this.denunciaSelecionada();
          if (selecionada?.id === id) {
            this.fecharDetalhes();
          }
        },
        error: () => {
          this.toast.show('Erro ao excluir denúncia.', 'error');
        }
      });
  }

  private limparConfirmacaoExclusao(): void {
    this.pendingDeleteId = null;
    this.pendingDeleteCodigo = null;
    if (this.pendingDeleteTimer) {
      clearTimeout(this.pendingDeleteTimer);
      this.pendingDeleteTimer = null;
    }
  }

  private alterarStatus(id: number, novoStatus: number): void {
    this.http.put(`${this.apiBase}/api/denuncias/${id}/status`, { status: novoStatus })
      .subscribe({
        next: () => {
          this.carregarDenuncias();
          this.toast.show(`Status atualizado para ${this.getStatusTexto(novoStatus)}.`, 'success', 2200);

          const selecionada = this.denunciaSelecionada();
          if (selecionada?.id === id) {
            this.abrirDetalhes(selecionada);
          }
        },
        error: () => {
          this.toast.show('Erro ao atualizar status da denúncia.', 'error');
        }
      });
  }

  private obterIsAdmin(): boolean {
    const usuarioStorage = localStorage.getItem('usuario');
    if (!usuarioStorage) {
      return false;
    }

    try {
      const usuario = JSON.parse(usuarioStorage) as UsuarioLogado;
      const isAdminFlag = Boolean(usuario.isAdmin ?? usuario.IsAdmin);
      if (isAdminFlag) {
        return true;
      }

      const email = (usuario.email ?? usuario.Email ?? '').trim().toLowerCase();
      return email === this.adminEmailPadrao;
    } catch {
      return false;
    }
  }
}
