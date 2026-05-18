import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ProfileMenuComponent } from './profile-menu/profile-menu.component';
import { ToastService } from '../../shared/toast/toast.service';
import { environment } from '../../../environments/environment';

declare const google: any;

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

interface DashboardResumoApi {
  eco: number;
  publico: number;
  diferenca: number;
}

interface TipoViolencia {
  tipo: string;
  percentual: number;
  cor: string;
}

interface AreaRiscoItem {
  nome: string;
  total: number;
}

interface HorarioOcorrencia {
  rotulo: string;
  quantidade: number;
  percentual: number;
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
  fonte: string;
  quantidade: number;
  latitude: number;
  longitude: number;
  dataRegistro: string;
}

interface DadoExternoForm {
  bairro: string;
  tipo: string;
  fonte: string;
  quantidade: number;
  latitude: number;
  longitude: number;
}

interface ImportacaoDadosExternosResultado {
  totalRecebidos: number;
  importados: number;
  ignorados: number;
  registrosTotais: number;
  fonte: string;
  mensagem: string;
}

interface DadoPublico {
  bairro: string;
  tipo: string;
  quantidade: number;
  latitude: number;
  longitude: number;
  fonte?: string;
  dataRegistro?: string;
}

interface HeatPoint {
  latitude: number;
  longitude: number;
  quantidade: number;
}

interface DashboardRegistro {
  origem: 'eco' | 'publico';
  tipo: string;
  quantidade: number;
  latitude: number | null;
  longitude: number | null;
  data: Date | null;
  status: number | null;
  areaNome: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DecimalPipe, FormsModule, ProfileMenuComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('googleMapDashboardCanvas')
  private googleMapDashboardCanvas?: ElementRef<HTMLDivElement>;

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly adminEmailPadrao = 'admin@eco.local';
  private readonly apiBase = environment.apiBaseUrl;
  private readonly googleMapsApiKey = environment.googleMapsApiKey;
  private readonly paletaTipos = ['#ff6b9d', '#a855f7', '#60a5fa', '#fbbf24', '#2dd4bf', '#f97316'];
  private pendingDeleteId: number | null = null;
  private pendingDeleteCodigo: string | null = null;
  private pendingDeleteTimer: ReturnType<typeof setTimeout> | null = null;
  private dashboardMap: any | null = null;
  private dashboardMapCircles: any[] = [];
  private readonly resumoDashboard = signal<DashboardResumoApi | null>(null);
  private readonly carregandoResumoDashboard = signal(false);

  protected readonly visualizacao = signal<'inicio' | 'denuncias' | 'dados-externos'>('inicio');

  protected readonly filtroPeriodoMapa = signal<'30dias' | '7dias' | 'tudo'>('tudo');
  protected readonly filtroTipoMapa = signal('todos');
  protected readonly filtroStatusMapa = signal('todos');

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
  protected readonly dadosPublicos = signal<DadoPublico[]>([]);
  protected readonly carregandoDadosPublicos = signal(false);
  protected readonly salvandoDadoExterno = signal(false);
  protected readonly importandoDadosExternos = signal(false);
  protected readonly arquivoCsvDadoExterno = signal<File | null>(null);
  protected readonly fonteImportacaoExterna = signal('SDS PE / CSV');

  protected readonly mapaPronto = signal(false);
  protected readonly erroMapa = signal('');

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

  protected readonly carregandoMapa = computed(() =>
    this.carregandoResumoDashboard() || this.carregandoDenuncias() || this.carregandoDadosPublicos()
  );

  protected readonly registrosDashboard = computed<DashboardRegistro[]>(() => {
    const registrosEco = this.denuncias().map((denuncia) => {
      const latitude = this.normalizarCoordenada(denuncia.latitude, 'latitude');
      const longitude = this.normalizarCoordenada(denuncia.longitude, 'longitude');

      return {
        origem: 'eco' as const,
        tipo: this.getTipoTexto(denuncia.tipo),
        quantidade: 1,
        latitude,
        longitude,
        data: this.parseDate(denuncia.dataCriacao),
        status: denuncia.status,
        areaNome: this.obterNomeArea(null, latitude, longitude)
      };
    });

    const registrosPublicos = this.dadosPublicos().map((dado) => {
      const latitude = this.normalizarCoordenada(dado.latitude, 'latitude');
      const longitude = this.normalizarCoordenada(dado.longitude, 'longitude');

      return {
        origem: 'publico' as const,
        tipo: this.normalizarTipoTexto(dado.tipo),
        quantidade: Math.max(0, dado.quantidade ?? 0),
        latitude,
        longitude,
        data: this.parseDate(dado.dataRegistro),
        status: null,
        areaNome: this.obterNomeArea(dado.bairro, latitude, longitude)
      };
    });

    return [...registrosEco, ...registrosPublicos];
  });

  protected readonly tiposDisponiveis = computed(() => {
    const tipos = new Set(
      this.registrosDashboard()
        .map((registro) => registro.tipo)
        .filter((tipo) => tipo.length > 0)
    );

    return Array.from(tipos).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  });

  protected readonly registrosDashboardFiltrados = computed(() => {
    const tipoSelecionado = this.filtroTipoMapa();
    const statusSelecionado = this.filtroStatusMapa();
    const corte = this.obterDataCorte(this.filtroPeriodoMapa());

    return this.registrosDashboard().filter((registro) => {
      const matchTipo = tipoSelecionado === 'todos' || registro.tipo === tipoSelecionado;

      const matchStatus =
        statusSelecionado === 'todos'
        || (registro.origem === 'eco' && registro.status === Number(statusSelecionado));

      const matchPeriodo = !corte || registro.data === null || registro.data >= corte;

      return matchTipo && matchStatus && matchPeriodo;
    });
  });

  protected readonly stats = computed<DashboardStats>(() => {
    const resumo = this.resumoDashboard();

    return {
      totalDenuncias: resumo?.eco ?? this.denuncias().length,
      emergencias: this.denuncias().filter((denuncia) => denuncia.status === 1).length,
      ultimaSemana: this.calcularQuantidadeEntreDatas(7),
      dadosPublicos: resumo?.publico ?? this.dadosPublicos().reduce((soma, dado) => soma + Math.max(0, dado.quantidade ?? 0), 0)
    };
  });

  protected readonly variacaoUltimaSemana = computed(() => {
    const agora = new Date();
    const inicioSemanaAtual = new Date(agora.getTime() - (7 * 24 * 60 * 60 * 1000));
    const inicioSemanaAnterior = new Date(inicioSemanaAtual.getTime() - (7 * 24 * 60 * 60 * 1000));

    const registros = this.registrosDashboard();
    const atual = this.somarQuantidadePorPeriodo(registros, inicioSemanaAtual, agora);
    const anterior = this.somarQuantidadePorPeriodo(registros, inicioSemanaAnterior, inicioSemanaAtual);

    if (atual === 0 && anterior === 0) {
      return 'Sem registros recentes';
    }

    if (anterior === 0) {
      return atual > 0 ? 'Nova movimentação na semana' : 'Sem variação';
    }

    const percentual = Math.round(((atual - anterior) / anterior) * 100);
    const prefixo = percentual > 0 ? '+' : '';
    return `${prefixo}${percentual}% vs anterior`;
  });

  protected readonly tiposViolencia = computed<TipoViolencia[]>(() => {
    const agrupado = new Map<string, number>();

    for (const registro of this.registrosDashboardFiltrados()) {
      agrupado.set(registro.tipo, (agrupado.get(registro.tipo) ?? 0) + registro.quantidade);
    }

    const total = Array.from(agrupado.values()).reduce((soma, quantidade) => soma + quantidade, 0);
    if (total === 0) {
      return [];
    }

    return Array.from(agrupado.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tipo, quantidade], indice) => ({
        tipo,
        percentual: Math.round((quantidade / total) * 100),
        cor: this.paletaTipos[indice % this.paletaTipos.length]
      }));
  });

  protected readonly areasRisco = computed<AreaRiscoItem[]>(() => {
    const agrupado = new Map<string, number>();

    for (const registro of this.registrosDashboardFiltrados()) {
      if (!registro.areaNome
        || registro.areaNome === 'Local não informado'
        || registro.areaNome.startsWith('ECO ')) {
        continue;
      }

      agrupado.set(registro.areaNome, (agrupado.get(registro.areaNome) ?? 0) + registro.quantidade);
    }

    return Array.from(agrupado.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([nome, total]) => ({ nome, total }));
  });

  protected readonly horarioOcorrencias = computed<HorarioOcorrencia[]>(() => {
    const buckets = Array.from({ length: 12 }, (_, indice) => ({
      indice,
      inicio: indice * 2,
      quantidade: 0
    }));

    for (const registro of this.registrosDashboardFiltrados()) {
      if (!registro.data) {
        continue;
      }

      const indice = Math.floor(registro.data.getHours() / 2);
      buckets[indice].quantidade += registro.quantidade;
    }

    const maximo = Math.max(0, ...buckets.map((bucket) => bucket.quantidade));

    return buckets.map((bucket) => ({
      rotulo: `${String(bucket.inicio).padStart(2, '0')}h`,
      quantidade: bucket.quantidade,
      percentual: maximo > 0 ? Math.max(6, Math.round((bucket.quantidade / maximo) * 100)) : 0
    }));
  });

  protected readonly faixaPredominanteHorario = computed(() => {
    const destaque = this.horarioOcorrencias()
      .map((item, indice) => ({ item, indice }))
      .sort((a, b) => b.item.quantidade - a.item.quantidade)[0];

    if (!destaque || destaque.item.quantidade === 0) {
      return 'Sem dados recentes';
    }

    const inicio = destaque.indice * 2;
    const fim = inicio + 2;
    return `${String(inicio).padStart(2, '0')}h às ${String(fim).padStart(2, '0')}h`;
  });

  protected readonly heatmap = computed<HeatPoint[]>(() => {
    const agrupado = new Map<string, HeatPoint>();

    for (const registro of this.registrosDashboardFiltrados()) {
      if (registro.latitude == null || registro.longitude == null) {
        continue;
      }

      const latitude = Number(registro.latitude.toFixed(2));
      const longitude = Number(registro.longitude.toFixed(2));
      const chave = `${latitude}|${longitude}`;
      const existente = agrupado.get(chave);

      if (existente) {
        existente.quantidade += registro.quantidade;
        continue;
      }

      agrupado.set(chave, {
        latitude,
        longitude,
        quantidade: registro.quantidade
      });
    }

    return Array.from(agrupado.values()).sort((a, b) => b.quantidade - a.quantidade);
  });

  protected readonly totalDenunciasMapa = computed(() =>
    this.heatmap().reduce((total, ponto) => total + Math.max(0, ponto.quantidade ?? 0), 0)
  );

  constructor() {
    this.isAdmin.set(this.obterIsAdmin());
    this.carregarDadosDashboard();

    effect(() => {
      this.mapaPronto();
      this.heatmap();
      this.atualizarCamadasMapa();
    });
  }

  ngAfterViewInit(): void {
    this.inicializarMapaGoogle();
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

  protected atualizarFiltroPeriodoMapa(valor: '30dias' | '7dias' | 'tudo'): void {
    this.filtroPeriodoMapa.set(valor);
  }

  protected atualizarFiltroTipoMapa(valor: string): void {
    this.filtroTipoMapa.set(valor);
  }

  protected atualizarFiltroStatusMapa(valor: string): void {
    this.filtroStatusMapa.set(valor);
  }

  protected selecionarArquivoCsv(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.arquivoCsvDadoExterno.set(input?.files?.[0] ?? null);
  }

  protected atualizarFonteImportacao(valor: string): void {
    this.fonteImportacaoExterna.set(valor);
  }



  protected importarCsvDadosExternos(): void {
    const arquivo = this.arquivoCsvDadoExterno();
    if (!arquivo) {
      this.toast.show('Selecione um arquivo para importar.', 'warning');
      return;
    }

    const extensao = arquivo.name.toLowerCase().split('.').pop();
    if (!['csv', 'pdf', 'xlsx', 'xls'].includes(extensao || '')) {
      this.toast.show('Formato não suportado. Use CSV, PDF ou Excel.', 'warning');
      return;
    }

    this.importandoDadosExternos.set(true);

    const formData = new FormData();
    formData.append('file', arquivo);
    formData.append('fonte', this.fonteImportacaoExterna().trim() || 'Arquivo importado');

    // Se for comparação, usar endpoint de comparação
    const endpoint = extensao === 'csv' 
      ? `${this.apiBase}/api/denuncias/dados-externos/importar-csv`
      : `${this.apiBase}/api/denuncias/dados-externos/comparar`;

    this.http.post<any>(endpoint, formData)
      .subscribe({
        next: (resultado) => {
          this.importandoDadosExternos.set(false);
          this.arquivoCsvDadoExterno.set(null);
          
          // Se for resultado de comparação, mostrar comparativo
          if (resultado.comparacao) {
            this.exibirResultadoComparacao(resultado);
            this.toast.show('Comparação realizada com sucesso.', 'success');
          } else {
            this.toast.show(resultado.mensagem || 'Arquivo importado com sucesso.', 'success');
            this.carregarResumoDashboard();
            this.carregarDadosPublicos();
            this.carregarDadosExternos();
          }
        },
        error: (error) => {
          this.importandoDadosExternos.set(false);
          const mensagem = error.error?.message || 'Erro ao processar arquivo.';
          this.toast.show(mensagem, 'error');
        }
      });
  }

  private exibirResultadoComparacao(resultado: any): void {
    console.log('Resultado da comparação:', resultado);
    
    const alteracoes = resultado.comparacao.filter((item: any) => item.diferenca !== 0);
    const novosDados = resultado.comparacao.filter((item: any) => item.existente === 0);
    const atualizacoes = resultado.comparacao.filter((item: any) => item.existente > 0 && item.diferenca !== 0);

    let mensagemComparacao = `📊 Comparação de Dados:\n`;
    mensagemComparacao += `• Total de registros no arquivo: ${resultado.novosDados.length}\n`;
    mensagemComparacao += `• Novos dados: ${novosDados.length}\n`;
    mensagemComparacao += `• Dados com atualização: ${atualizacoes.length}\n`;
    mensagemComparacao += `• Dados iguais: ${resultado.comparacao.length - alteracoes.length}`;

    this.toast.show(mensagemComparacao, 'info');
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

  protected formatarAreaRisco(nome: string): string {
    const texto = (nome ?? '').trim();
    if (!texto) {
      return 'Não informado';
    }

    if (texto.includes('/PE') || texto.includes('- PE')) {
      return texto;
    }

    return `${texto} - PE`;
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

  protected carregarDenuncias(exibirToastErro = true): void {
    this.carregandoDenuncias.set(true);

    this.http.get<Denuncia[]>(`${this.apiBase}/api/denuncias`)
      .subscribe({
        next: (data) => {
          this.denuncias.set(data ?? []);
          this.carregandoDenuncias.set(false);
        },
        error: () => {
          if (exibirToastErro) {
            this.toast.show('Erro ao carregar denúncias.', 'error');
          }
          this.carregandoDenuncias.set(false);
        }
      });
  }

  protected carregarDadosExternos(exibirToastErro = true): void {
    this.carregandoDadosExternos.set(true);

    this.http.get<DadoExterno[]>(`${this.apiBase}/api/denuncias/dados-externos`)
      .subscribe({
        next: (data) => {
          this.dadosExternos.set(data ?? []);
          this.carregandoDadosExternos.set(false);
        },
        error: () => {
          if (exibirToastErro) {
            this.toast.show('Erro ao carregar dados externos.', 'error');
          }
          this.carregandoDadosExternos.set(false);
        }
      });
  }

  protected carregarDadosPublicos(exibirToastErro = true): void {
    this.carregandoDadosPublicos.set(true);

    this.http.get<DadoPublico[]>(`${this.apiBase}/api/denuncias/dados-externos`)
      .subscribe({
        next: (data) => {
          this.dadosPublicos.set(data ?? []);
          this.carregandoDadosPublicos.set(false);
        },
        error: () => {
          if (exibirToastErro) {
            this.toast.show('Erro ao carregar dados públicos.', 'error');
          }
          this.carregandoDadosPublicos.set(false);
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
          this.carregarResumoDashboard();
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
          this.carregarResumoDashboard();
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

  private carregarDadosDashboard(): void {
    this.erroMapa.set('');
    this.carregandoResumoDashboard.set(true);
    this.carregandoDenuncias.set(true);
    this.carregandoDadosExternos.set(true);
    this.carregandoDadosPublicos.set(true);

    const falhas: string[] = [];

    forkJoin({
      resumo: this.http.get<DashboardResumoApi>(`${this.apiBase}/api/denuncias/dashboard-completo`).pipe(
        catchError(() => {
          falhas.push('resumo');
          return of<DashboardResumoApi | null>(null);
        })
      ),
      denuncias: this.http.get<Denuncia[]>(`${this.apiBase}/api/denuncias`).pipe(
        catchError(() => {
          falhas.push('denuncias');
          return of<Denuncia[]>([]);
        })
      ),
      publicos: this.http.get<DadoPublico[]>(`${this.apiBase}/api/denuncias/dados-externos`).pipe(
        catchError(() => {
          falhas.push('publicos');
          return of<DadoPublico[]>([]);
        })
      ),
      externos: this.http.get<DadoExterno[]>(`${this.apiBase}/api/denuncias/dados-externos`).pipe(
        catchError(() => {
          falhas.push('externos');
          return of<DadoExterno[]>([]);
        })
      )
    }).subscribe({
      next: ({ resumo, denuncias, publicos, externos }) => {
        this.resumoDashboard.set(resumo);
        this.denuncias.set(denuncias ?? []);
        this.dadosPublicos.set(publicos ?? []);
        this.dadosExternos.set(externos ?? []);
        this.carregandoResumoDashboard.set(false);
        this.carregandoDenuncias.set(false);
        this.carregandoDadosExternos.set(false);
        this.carregandoDadosPublicos.set(false);

        if (falhas.length > 0) {
          this.toast.show('Alguns dados do dashboard não puderam ser carregados.', 'warning');
        }
      },
      error: () => {
        this.carregandoResumoDashboard.set(false);
        this.carregandoDenuncias.set(false);
        this.carregandoDadosExternos.set(false);
        this.carregandoDadosPublicos.set(false);
        this.toast.show('Não foi possível carregar os dados do dashboard.', 'error');
      }
    });
  }

  private carregarResumoDashboard(exibirToastErro = false): void {
    this.carregandoResumoDashboard.set(true);

    this.http.get<DashboardResumoApi>(`${this.apiBase}/api/denuncias/dashboard-completo`)
      .subscribe({
        next: (resumo) => {
          this.resumoDashboard.set(resumo);
          this.carregandoResumoDashboard.set(false);
        },
        error: () => {
          this.carregandoResumoDashboard.set(false);
          if (exibirToastErro) {
            this.toast.show('Não foi possível atualizar o resumo do dashboard.', 'error');
          }
        }
      });
  }

  private async inicializarMapaGoogle(): Promise<void> {
    if (!this.googleMapsApiKey) {
      this.erroMapa.set('Configure a chave Google Maps API para exibir o mapa real.');
      return;
    }

    try {
      await this.carregarScriptGoogleMaps();

      const canvas = this.googleMapDashboardCanvas?.nativeElement;
      if (!canvas) {
        this.erroMapa.set('Elemento do mapa não encontrado.');
        return;
      }

      this.dashboardMap = new google.maps.Map(canvas, {
        center: { lat: -8.0476, lng: -34.877 },
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      this.mapaPronto.set(true);
      this.erroMapa.set('');
      this.atualizarCamadasMapa();
    } catch {
      this.erroMapa.set('Não foi possível carregar o Google Maps.');
    }
  }

  private carregarScriptGoogleMaps(): Promise<void> {
    if ((window as { google?: unknown }).google) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const scriptId = 'google-maps-js-api';
      const existente = document.getElementById(scriptId);

      if (existente) {
        existente.addEventListener('load', () => resolve(), { once: true });
        existente.addEventListener('error', () => reject(new Error('Google Maps script error')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(this.googleMapsApiKey)}&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Maps script error'));

      document.head.appendChild(script);
    });
  }

  private atualizarCamadasMapa(): void {
    if (!this.dashboardMap) {
      return;
    }

    for (const circle of this.dashboardMapCircles) {
      circle.setMap(null);
    }
    this.dashboardMapCircles = [];

    const dados = this.heatmap();
    if (!dados.length) {
      return;
    }

    const maxQuantidade = Math.max(...dados.map((d) => Math.max(1, d.quantidade)));
    const bounds = new google.maps.LatLngBounds();

    for (const ponto of dados) {
      const quantidade = Math.max(1, ponto.quantidade);
      const escala = quantidade / Math.max(1, maxQuantidade);
      const intensidade = Math.sqrt(escala);
      const cor = this.obterCorIncidencia(escala);

      const circle = new google.maps.Circle({
        map: this.dashboardMap,
        center: { lat: ponto.latitude, lng: ponto.longitude },
        strokeColor: cor,
        strokeOpacity: 0.55,
        strokeWeight: 1,
        fillColor: cor,
        fillOpacity: 0.2 + (intensidade * 0.38),
        radius: 120 + (intensidade * 460)
      });

      this.dashboardMapCircles.push(circle);
      bounds.extend(circle.getCenter());
    }

    if (dados.length === 1) {
      this.dashboardMap.setCenter(bounds.getCenter());
      this.dashboardMap.setZoom(13);
      return;
    }

    this.dashboardMap.fitBounds(bounds, 56);
  }

  private obterCorIncidencia(escala: number): string {
    if (escala >= 0.75) {
      return '#E11D48';
    }

    if (escala >= 0.4) {
      return '#F97316';
    }

    return '#F59E0B';
  }

  private calcularQuantidadeEntreDatas(ultimosDias: number): number {
    const fim = new Date();
    const inicio = new Date(fim.getTime() - (ultimosDias * 24 * 60 * 60 * 1000));
    return this.somarQuantidadePorPeriodo(this.registrosDashboard(), inicio, fim);
  }

  private somarQuantidadePorPeriodo(registros: DashboardRegistro[], inicio: Date, fim: Date): number {
    return registros.reduce((total, registro) => {
      if (!registro.data || registro.data < inicio || registro.data > fim) {
        return total;
      }

      return total + registro.quantidade;
    }, 0);
  }

  private obterDataCorte(periodo: '30dias' | '7dias' | 'tudo'): Date | null {
    if (periodo === 'tudo') {
      return null;
    }

    const dias = periodo === '7dias' ? 7 : 30;
    return new Date(Date.now() - (dias * 24 * 60 * 60 * 1000));
  }

  private parseDate(valor: string | null | undefined): Date | null {
    if (!valor) {
      return null;
    }

    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }

  private normalizarTipoTexto(tipo: string | null | undefined): string {
    const texto = (tipo ?? '').trim();
    if (!texto) {
      return 'Não informado';
    }

    return texto
      .toLocaleLowerCase('pt-BR')
      .replace(/(^|\s)\S/g, (letra) => letra.toLocaleUpperCase('pt-BR'));
  }

  private normalizarCoordenada(
    valor: number | null | undefined,
    eixo: 'latitude' | 'longitude'
  ): number | null {
    if (valor == null || !Number.isFinite(valor)) {
      return null;
    }

    const limite = eixo === 'latitude' ? 90 : 180;
    return Math.abs(valor) <= limite ? valor : null;
  }

  private obterNomeArea(bairro: string | null | undefined, latitude: number | null, longitude: number | null): string {
    const bairroNormalizado = (bairro ?? '').trim();
    if (bairroNormalizado) {
      return bairroNormalizado;
    }

    if (latitude != null && longitude != null) {
      return `ECO ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    }

    return 'Local não informado';
  }
}
