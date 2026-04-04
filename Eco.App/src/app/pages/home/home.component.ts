import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';
import { environment } from '../../../environments/environment';

declare const google: any;

interface HeatPoint {
  latitude: number;
  longitude: number;
  quantidade: number;
}

interface DashboardCompleto {
  eco: number;
  publico: number;
  diferenca: number;
}

interface DenunciaResponse {
  id: number;
  tipo: number;
  descricao?: string;
  codigo: string;
  dataCriacao: string;
  status: number;
  latitude?: number;
  longitude?: number;
}

interface UsuarioSessao {
  id?: number;
  Id?: number;
}

interface CepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe, DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('googleMapCanvas')
  private googleMapCanvas?: ElementRef<HTMLDivElement>;

  private readonly http = inject(HttpClient);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly apiBase = `${environment.apiBaseUrl}/api/denuncias`;
  private readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly googleMapsApiKey = environment.googleMapsApiKey;
  private map: any | null = null;
  private mapCircles: any[] = [];

  protected readonly tipoOpcoes = [
    { valor: 0, label: 'Violência' },
    { valor: 1, label: 'Assédio' },
    { valor: 2, label: 'Discriminação' },
    { valor: 3, label: 'Outro' }
  ];

  protected readonly denunciaForm = this.fb.group({
    anonima: [true],
    tipo: [0, [Validators.required]],
    descricao: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
    latitude: [-8.0476, [Validators.required]],
    longitude: [-34.8770, [Validators.required]]
  });

  protected readonly acompanhamentoForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(8)]]
  });

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly cadastroForm = this.fb.group({
    nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    confirmarSenha: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected readonly recuperarSenhaForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  protected readonly dashboard = signal<DashboardCompleto | null>(null);
  protected readonly heatmap = signal<HeatPoint[]>([]);
  protected readonly carregandoMapa = signal(false);
  protected readonly mapaPronto = signal(false);
  protected readonly erroMapa = signal('');
  protected readonly enviandoDenuncia = signal(false);
  protected readonly consultandoCodigo = signal(false);
  protected readonly geolocalizacaoOk = signal(false);

  protected readonly erroDenuncia = signal('');
  protected readonly sucessoDenuncia = signal('');
  protected readonly erroConsulta = signal('');
  protected readonly denunciaConsultada = signal<DenunciaResponse | null>(null);
  protected readonly mostrarLoginTooltip = signal(false);
  protected readonly mostrarCadastroTooltip = signal(false);
  protected readonly sucessoLogin = signal('');
  protected readonly sucessoCadastro = signal('');
  protected readonly erroCadastro = signal('');
  protected readonly cepCarregando = signal(false);
  protected readonly cepErro = signal('');
  protected readonly fotoPerfilSelecionada = signal(false);
  protected readonly nomeArquivoFoto = signal('');
  protected readonly fotoPerfilUrl = signal('');
  protected readonly mostrarSenhaLogin = signal(false);
  protected readonly mostrarSenhaCadastro = signal(false);
  protected readonly mostrarConfirmarSenha = signal(false);
  protected readonly mostrarRecuperarSenha = signal(false);
  protected readonly emailRecuperacao = signal('');
  protected readonly recuperacaoEnviada = signal(false);
  protected readonly arquivosEvidencia = signal<File[]>([]);
  protected readonly denunciaTipoSelecionado = signal(false);
  protected readonly mostrarDenunciaModal = signal(false);

  constructor() {
    this.carregarDashboard();
    this.carregarHeatmap();
    this.definirGeolocalizacao();
  }

  ngAfterViewInit(): void {
    this.inicializarMapaGoogle();
  }

  protected enviarDenuncia(): void {
    if (this.denunciaForm.invalid) {
      this.denunciaForm.markAllAsTouched();
      this.toast.show('Preencha a denúncia corretamente.', 'warning');
      return;
    }

    this.enviandoDenuncia.set(true);

    const form = this.denunciaForm.getRawValue();
    const usuarioId = this.obterUsuarioIdSessao();

    const payload = {
      anonima: form.anonima,
      usuarioId: form.anonima ? null : usuarioId,
      tipo: form.tipo,
      descricao: form.descricao,
      latitude: form.latitude,
      longitude: form.longitude
    };

    if (!form.anonima && !usuarioId) {
      this.toast.show('Para denúncia identificada, faça login com uma conta cadastrada.', 'error');
      this.enviandoDenuncia.set(false);
      return;
    }

    this.http.post<DenunciaResponse>(this.apiBase, payload).subscribe({
      next: (resposta) => {
        this.uploadEvidencias(resposta.id);
        this.toast.show(`Denúncia enviada com sucesso. Código: ${resposta.codigo}`, 'success');
        this.acompanhamentoForm.patchValue({ codigo: resposta.codigo });
        this.denunciaForm.patchValue({ descricao: '' });
        this.arquivosEvidencia.set([]);
        this.enviandoDenuncia.set(false);
        this.carregarDashboard();
        this.carregarHeatmap();
      },
      error: (erro: HttpErrorResponse) => {
        this.toast.show(this.extrairMensagem(erro, 'Não foi possível enviar sua denúncia.'), 'error');
        this.enviandoDenuncia.set(false);
      }
    });
  }

  protected acompanharDenuncia(): void {
    this.denunciaConsultada.set(null);

    if (this.acompanhamentoForm.invalid) {
      this.acompanhamentoForm.markAllAsTouched();
      this.toast.show('Informe um código válido.', 'warning');
      return;
    }

    const codigo = this.acompanhamentoForm.controls.codigo.value.trim().toUpperCase();
    if (!codigo) {
      this.toast.show('Informe um código válido.', 'warning');
      return;
    }

    this.consultandoCodigo.set(true);

    this.http.get<DenunciaResponse>(`${this.apiBase}/${encodeURIComponent(codigo)}`).subscribe({
      next: (resposta) => {
        this.denunciaConsultada.set(resposta);
        this.consultandoCodigo.set(false);
      },
      error: (erro: HttpErrorResponse) => {
        this.toast.show(this.extrairMensagem(erro, 'Código não encontrado.'), 'error');
        this.consultandoCodigo.set(false);
      }
    });
  }

  protected statusLabel(status: number): string {
    switch (status) {
      case 0:
        return 'Recebido';
      case 1:
        return 'Emergência';
      case 2:
        return 'Em análise';
      case 3:
        return 'Finalizado';
      case 4:
        return 'Reprovado';
      default:
        return 'Indefinido';
    }
  }

  protected abrirLoginTooltip(): void {
    const abrirLogin = !this.mostrarLoginTooltip();
    this.mostrarCadastroTooltip.set(false);
    this.mostrarRecuperarSenha.set(false);
    this.mostrarDenunciaModal.set(false);
    this.mostrarLoginTooltip.set(abrirLogin);
  }

  protected abrirCadastroTooltip(): void {
    const abrirCadastro = !this.mostrarCadastroTooltip();
    this.mostrarLoginTooltip.set(false);
    this.mostrarRecuperarSenha.set(false);
    this.mostrarDenunciaModal.set(false);
    this.mostrarCadastroTooltip.set(abrirCadastro);
  }

  protected fecharTooltips(): void {
    this.mostrarLoginTooltip.set(false);
    this.mostrarCadastroTooltip.set(false);
    this.mostrarRecuperarSenha.set(false);
    this.mostrarDenunciaModal.set(false);
  }

  protected entrar(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toast.show('Preencha e-mail e senha para entrar.', 'warning');
      return;
    }

    const loginData = {
      email: this.loginForm.controls.email.value,
      senha: this.loginForm.controls.senha.value
    };

    this.http.post<any>(`${this.apiBaseUrl}/api/auth/login`, loginData).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('usuario', JSON.stringify(response));
        this.toast.show('Login realizado com sucesso! Redirecionando...', 'success');
        
        setTimeout(() => {
          this.fecharTooltips();
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (erro: HttpErrorResponse) => {
        const mensagem = typeof erro.error === 'string' ? erro.error : 'E-mail ou senha inválidos.';
        this.toast.show(mensagem, 'error');
      }
    });
  }

  protected toggleSenhaLogin(): void {
    this.mostrarSenhaLogin.set(!this.mostrarSenhaLogin());
  }

  protected toggleSenhaCadastro(): void {
    this.mostrarSenhaCadastro.set(!this.mostrarSenhaCadastro());
  }

  protected toggleConfirmarSenha(): void {
    this.mostrarConfirmarSenha.set(!this.mostrarConfirmarSenha());
  }

  protected enviarRecuperacaoSenha(): void {
    if (this.recuperarSenhaForm.invalid) {
      this.recuperarSenhaForm.markAllAsTouched();
      this.toast.show('Informe um e-mail válido para recuperação.', 'warning');
      return;
    }

    // Aqui você implementaria a lógica real de envio do email
    this.emailRecuperacao.set(this.recuperarSenhaForm.controls.email.value);
    this.recuperacaoEnviada.set(true);
    this.toast.show(`Se o e-mail ${this.emailRecuperacao()} estiver cadastrado, enviaremos um link de recuperação.`, 'success');
  }

  protected voltarParaLogin(): void {
    this.mostrarRecuperarSenha.set(false);
    this.mostrarLoginTooltip.set(true);
    this.recuperacaoEnviada.set(false);
    this.recuperarSenhaForm.reset();
  }

  protected selecionarEvidencias(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivos = input.files;

    if (!arquivos || arquivos.length === 0) {
      return;
    }

    const novosArquivos = Array.from(arquivos);
    const arquivosAtuais = this.arquivosEvidencia();
    this.arquivosEvidencia.set([...arquivosAtuais, ...novosArquivos]);
    input.value = '';
  }

  protected removerEvidencia(index: number): void {
    const arquivos = this.arquivosEvidencia();
    arquivos.splice(index, 1);
    this.arquivosEvidencia.set([...arquivos]);

    const input = document.getElementById('evidenciasDenuncia') as HTMLInputElement | null;
    if (input && arquivos.length === 0) {
      input.value = '';
    }
  }

  protected abrirSeletorArquivos(): void {
    const input = document.getElementById('evidenciasDenuncia') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  protected selecionarTipoDenuncia(): void {
    this.denunciaTipoSelecionado.set(true);
  }

  protected abrirDenunciaModal(anonima: boolean): void {
    this.mostrarLoginTooltip.set(false);
    this.mostrarCadastroTooltip.set(false);
    this.mostrarRecuperarSenha.set(false);
    this.denunciaForm.patchValue({ anonima });
    this.mostrarDenunciaModal.set(true);
    this.denunciaTipoSelecionado.set(true);
  }

  protected fecharDenunciaModal(): void {
    this.mostrarDenunciaModal.set(false);
    this.denunciaTipoSelecionado.set(false);
    this.arquivosEvidencia.set([]);
    const input = document.getElementById('evidenciasDenuncia') as HTMLInputElement | null;
    if (input) {
      input.value = '';
    }
  }

  protected trocarParaCadastro(event: Event): void {
    event.preventDefault();
    this.mostrarLoginTooltip.set(false);
    this.mostrarRecuperarSenha.set(false);
    this.mostrarDenunciaModal.set(false);
    this.recuperacaoEnviada.set(false);
    this.mostrarCadastroTooltip.set(true);
  }

  protected abrirRecuperarSenha(event: Event): void {
    event.preventDefault();
    this.mostrarLoginTooltip.set(false);
    this.mostrarRecuperarSenha.set(true);
    this.recuperacaoEnviada.set(false);
  }

  protected cadastrar(): void {
    if (!this.fotoPerfilSelecionada()) {
      this.toast.show('Envie uma foto de perfil para continuar.', 'warning');
      return;
    }

    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      this.toast.show('Preencha os campos do cadastro corretamente.', 'warning');
      return;
    }

    const senha = this.cadastroForm.controls.senha.value;
    const confirmarSenha = this.cadastroForm.controls.confirmarSenha.value;
    if (senha !== confirmarSenha) {
      this.toast.show('A confirmação de senha não confere.', 'error');
      return;
    }

    // Criar FormData para enviar com arquivo
    const formData = new FormData();
    formData.append('nomeCompleto', this.cadastroForm.controls.nomeCompleto.value);
    formData.append('email', this.cadastroForm.controls.email.value);
    formData.append('senha', senha);
    
    const fotoInput = document.getElementById('fotoPerfil') as HTMLInputElement;
    const arquivo = fotoInput?.files?.[0];
    if (arquivo) {
      formData.append('fotoPerfil', arquivo);
    }

    this.http.post<any>(`${this.apiBaseUrl}/api/auth/cadastro`, formData).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('usuario', JSON.stringify(response));
        this.toast.show('Cadastro realizado com sucesso! Redirecionando...', 'success');
        
        setTimeout(() => {
          this.fecharTooltips();
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (erro: HttpErrorResponse) => {
        const mensagem = typeof erro.error === 'string' ? erro.error : 'Erro ao realizar cadastro.';
        this.toast.show(mensagem, 'error');
      }
    });
  }

  protected selecionarFotoPerfil(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];

    if (!arquivo) {
      this.fotoPerfilSelecionada.set(false);
      this.nomeArquivoFoto.set('');
      this.fotoPerfilUrl.set('');
      return;
    }

    this.fotoPerfilSelecionada.set(true);
    this.nomeArquivoFoto.set(arquivo.name);
    this.erroCadastro.set('');

    // Criar URL para preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      this.fotoPerfilUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(arquivo);
  }

  protected removerFoto(): void {
    this.fotoPerfilSelecionada.set(false);
    this.nomeArquivoFoto.set('');
    this.fotoPerfilUrl.set('');
    const input = document.getElementById('fotoPerfil') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  private carregarDashboard(): void {
    this.http.get<DashboardCompleto>(`${this.apiBaseUrl}/api/denuncias/dashboard-completo`).subscribe({
      next: (resposta) => this.dashboard.set(resposta),
      error: () => {
        this.dashboard.set(null);
        this.toast.show('Não foi possível carregar os dados do painel.', 'error');
      }
    });
  }

  private carregarHeatmap(): void {
    this.carregandoMapa.set(true);

    this.http.get<HeatPoint[]>(`${this.apiBaseUrl}/api/denuncias/heatmap`).subscribe({
      next: (resposta) => {
        this.heatmap.set(resposta ?? []);
        this.atualizarCamadasMapa();
        this.carregandoMapa.set(false);
      },
      error: () => {
        this.heatmap.set([]);
        this.carregandoMapa.set(false);
        this.toast.show('Não foi possível carregar o mapa agora.', 'error');
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

      const canvas = this.googleMapCanvas?.nativeElement;
      if (!canvas) {
        this.erroMapa.set('Elemento do mapa não encontrado.');
        return;
      }

      this.map = new google.maps.Map(canvas, {
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
    if (!this.map) {
      return;
    }

    for (const circle of this.mapCircles) {
      circle.setMap(null);
    }
    this.mapCircles = [];

    const dados = this.heatmap();
    if (!dados.length) {
      return;
    }

    const maxQuantidade = Math.max(...dados.map(d => Math.max(1, d.quantidade)));
    const bounds = new google.maps.LatLngBounds();

    for (const ponto of dados) {
      const quantidade = Math.max(1, ponto.quantidade);
      const escala = quantidade / Math.max(1, maxQuantidade);

      const circle = new google.maps.Circle({
        map: this.map,
        center: { lat: ponto.latitude, lng: ponto.longitude },
        strokeColor: '#E11D48',
        strokeOpacity: 0.55,
        strokeWeight: 1,
        fillColor: '#FF2A97',
        fillOpacity: 0.2 + (escala * 0.35),
        radius: 120 + (escala * 450)
      });

      this.mapCircles.push(circle);
      bounds.extend(circle.getCenter());
    }

    if (dados.length === 1) {
      this.map.setCenter(bounds.getCenter());
      this.map.setZoom(13);
      return;
    }

    this.map.fitBounds(bounds, 56);
  }

  private definirGeolocalizacao(): void {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.denunciaForm.patchValue({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6))
        });
        this.geolocalizacaoOk.set(true);
      },
      () => {
        this.geolocalizacaoOk.set(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  }

  private extrairMensagem(erro: HttpErrorResponse, fallback: string): string {
    if (typeof erro.error === 'string' && erro.error.trim().length > 0) {
      return erro.error;
    }

    if (erro.error && typeof erro.error === 'object' && 'title' in erro.error) {
      const titulo = String((erro.error as { title: unknown }).title ?? '').trim();
      if (titulo) {
        return titulo;
      }
    }

    return fallback;
  }

  private obterUsuarioIdSessao(): number | null {
    const usuarioStorage = localStorage.getItem('usuario');
    if (!usuarioStorage) {
      return null;
    }

    try {
      const usuario = JSON.parse(usuarioStorage) as UsuarioSessao;
      return (usuario.id ?? usuario.Id ?? null) as number | null;
    } catch {
      return null;
    }
  }

  private uploadEvidencias(denunciaId: number): void {
    const arquivos = this.arquivosEvidencia();
    if (!arquivos.length) {
      return;
    }

    for (const arquivo of arquivos) {
      const formData = new FormData();
      formData.append('file', arquivo);

      this.http.post(`${this.apiBase}/${denunciaId}/evidencias`, formData).subscribe({
        error: () => {
          this.toast.show('Denúncia enviada, mas algumas evidências falharam no upload.', 'warning');
        }
      });
    }
  }
}
