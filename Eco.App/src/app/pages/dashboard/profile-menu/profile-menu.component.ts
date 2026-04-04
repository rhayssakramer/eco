import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../../shared/toast/toast.service';
import { environment } from '../../../../environments/environment';

interface UsuarioLogado {
  id?: number;
  Id?: number;
  nomeCompleto?: string;
  NomeCompleto?: string;
  email?: string;
  Email?: string;
  fotoPerfil?: string;
  FotoPerfil?: string;
  dataNascimento?: string;
  DataNascimento?: string;
  cpf?: string;
  Cpf?: string;
  rg?: string;
  Rg?: string;
  cep?: string;
  Cep?: string;
  logradouro?: string;
  Logradouro?: string;
  numero?: string;
  Numero?: string;
  complemento?: string;
  Complemento?: string;
  bairro?: string;
  Bairro?: string;
  cidade?: string;
  Cidade?: string;
  estado?: string;
  Estado?: string;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.css'
})
export class ProfileMenuComponent {
  private readonly fb = new FormBuilder();
  private readonly apiBase = environment.apiBaseUrl;

  isMenuOpen = signal(false);
  isEditProfileOpen = signal(false);
  carregandoPerfil = signal(false);
  salvandoPerfil = signal(false);
  alterarSenha = signal(false);
  fotoPreview = signal('');

  readonly userData = signal({
    name: 'Usuária',
    email: 'email@exemplo.com',
    photoUrl: ''
  });

  readonly perfilForm = this.fb.group({
    nomeCompleto: [''],
    email: [''],
    senhaBloqueada: ['********'],
    novaSenha: [''],
    dataNascimento: [''],
    cpf: [''],
    rg: [''],
    cep: [''],
    logradouro: [''],
    numero: [''],
    complemento: [''],
    bairro: [''],
    cidade: [''],
    estado: ['']
  });

  constructor(
    private router: Router,
    private http: HttpClient,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.carregarDadosUsuario();
  }

  toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  editarPerfil(): void {
    this.closeMenu();
    this.isEditProfileOpen.set(true);
    this.alterarSenha.set(false);
    this.perfilForm.patchValue({ novaSenha: '' });
    this.carregarPerfilCompleto();
  }

  fecharTooltipPerfil(): void {
    this.isEditProfileOpen.set(false);
  }

  onArquivoSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.fotoPreview.set(String(reader.result ?? ''));
    };
    reader.readAsDataURL(arquivo);
  }

  toggleAlterarSenha(): void {
    this.alterarSenha.set(!this.alterarSenha());
    if (!this.alterarSenha()) {
      this.perfilForm.patchValue({ novaSenha: '' });
    }
  }

  buscarCep(): void {
    const cep = (this.perfilForm.value.cep ?? '').replace(/\D/g, '');
    if (cep.length !== 8) {
      return;
    }

    this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`).subscribe({
      next: (res) => {
        if (res.erro) {
          this.toast.show('CEP não encontrado.', 'warning');
          return;
        }

        this.perfilForm.patchValue({
          logradouro: res.logradouro ?? '',
          bairro: res.bairro ?? '',
          cidade: res.localidade ?? '',
          estado: res.uf ?? ''
        });
      },
      error: () => {
        this.toast.show('Não foi possível consultar o CEP agora.', 'error');
      }
    });
  }

  salvarPerfil(): void {
    const usuario = this.obterUsuarioStorage();
    const usuarioId = Number(usuario?.id ?? usuario?.Id ?? 0);
    if (!usuarioId) {
      this.toast.show('Sessão inválida. Faça login novamente.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('nomeCompleto', this.perfilForm.value.nomeCompleto ?? '');
    if (this.perfilForm.value.dataNascimento) formData.append('dataNascimento', this.perfilForm.value.dataNascimento);
    formData.append('cpf', this.perfilForm.value.cpf ?? '');
    formData.append('rg', this.perfilForm.value.rg ?? '');
    formData.append('cep', this.perfilForm.value.cep ?? '');
    formData.append('logradouro', this.perfilForm.value.logradouro ?? '');
    formData.append('numero', this.perfilForm.value.numero ?? '');
    formData.append('complemento', this.perfilForm.value.complemento ?? '');
    formData.append('bairro', this.perfilForm.value.bairro ?? '');
    formData.append('cidade', this.perfilForm.value.cidade ?? '');
    formData.append('estado', this.perfilForm.value.estado ?? '');

    if (this.alterarSenha() && (this.perfilForm.value.novaSenha ?? '').trim().length >= 6) {
      formData.append('novaSenha', (this.perfilForm.value.novaSenha ?? '').trim());
    }

    const fileInput = document.getElementById('perfilFotoInput') as HTMLInputElement | null;
    const arquivo = fileInput?.files?.[0];
    if (arquivo) {
      formData.append('fotoPerfil', arquivo);
    }

    this.salvandoPerfil.set(true);

    this.http.put<UsuarioLogado>(`${this.apiBase}/api/auth/perfil/${usuarioId}`, formData).subscribe({
      next: (response) => {
        localStorage.setItem('usuario', JSON.stringify(response));
        this.carregarDadosUsuario();
        this.preencherFormulario(response);
        this.fotoPreview.set('');
        this.alterarSenha.set(false);
        this.perfilForm.patchValue({ novaSenha: '' });
        this.salvandoPerfil.set(false);
        this.toast.show('Perfil atualizado com sucesso.', 'success');
      },
      error: () => {
        this.salvandoPerfil.set(false);
        this.toast.show('Erro ao salvar perfil.', 'error');
      }
    });
  }

  sair(): void {
    this.closeMenu();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/']);
  }

  private carregarDadosUsuario(): void {
    const usuario = this.obterUsuarioStorage();
    if (!usuario) {
      return;
    }

    const nome = usuario.nomeCompleto ?? usuario.NomeCompleto;
    const email = usuario.email ?? usuario.Email;
    const fotoPerfil = usuario.fotoPerfil ?? usuario.FotoPerfil;

    this.userData.set({
      name: nome?.trim() || 'Usuária',
      email: email?.trim() || 'email@exemplo.com',
      photoUrl: this.montarUrlFoto(fotoPerfil)
    });

    this.preencherFormulario(usuario);
  }

  private carregarPerfilCompleto(): void {
    const usuario = this.obterUsuarioStorage();
    const usuarioId = Number(usuario?.id ?? usuario?.Id ?? 0);
    if (!usuarioId) {
      return;
    }

    this.carregandoPerfil.set(true);

    this.http.get<UsuarioLogado>(`${this.apiBase}/api/auth/perfil/${usuarioId}`).subscribe({
      next: (response) => {
        localStorage.setItem('usuario', JSON.stringify(response));
        this.carregandoPerfil.set(false);
        this.carregarDadosUsuario();
      },
      error: () => {
        this.carregandoPerfil.set(false);
      }
    });
  }

  private preencherFormulario(usuario: UsuarioLogado): void {
    this.perfilForm.patchValue({
      nomeCompleto: (usuario.nomeCompleto ?? usuario.NomeCompleto ?? '').trim(),
      email: (usuario.email ?? usuario.Email ?? '').trim(),
      dataNascimento: this.normalizarDataInput(usuario.dataNascimento ?? usuario.DataNascimento),
      cpf: usuario.cpf ?? usuario.Cpf ?? '',
      rg: usuario.rg ?? usuario.Rg ?? '',
      cep: usuario.cep ?? usuario.Cep ?? '',
      logradouro: usuario.logradouro ?? usuario.Logradouro ?? '',
      numero: usuario.numero ?? usuario.Numero ?? '',
      complemento: usuario.complemento ?? usuario.Complemento ?? '',
      bairro: usuario.bairro ?? usuario.Bairro ?? '',
      cidade: usuario.cidade ?? usuario.Cidade ?? '',
      estado: usuario.estado ?? usuario.Estado ?? ''
    });
  }

  private normalizarDataInput(data?: string): string {
    if (!data) return '';
    const parsed = new Date(data);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  }

  private obterUsuarioStorage(): UsuarioLogado | null {
    const usuarioStorage = localStorage.getItem('usuario');
    if (!usuarioStorage) {
      return null;
    }

    try {
      return JSON.parse(usuarioStorage) as UsuarioLogado;
    } catch {
      return null;
    }
  }

  private montarUrlFoto(fotoPerfil?: string): string {
    if (!fotoPerfil?.trim()) {
      return '';
    }

    if (fotoPerfil.startsWith('http://') || fotoPerfil.startsWith('https://')) {
      return fotoPerfil;
    }

    return `${environment.apiBaseUrl}${fotoPerfil}`;
  }
}
