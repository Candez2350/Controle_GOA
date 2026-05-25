import { state } from './state.js';
import { apiFetch } from './api.js';
import { abrirModal } from './ui.js';

export async function carregarUsuarios() {
    try {
        const users = await apiFetch('/auth/users');
        const tbody = document.getElementById('table-usuarios');
        tbody.innerHTML = '';
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhum usuário encontrado.</td></tr>';
            return;
        }
        
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${u.nome}</strong></td>
                <td>${u.email}</td>
                <td><span class="role-badge role-${u.role.toLowerCase().replace('_', '-')}">${u.role}</span></td>
                <td>
                    ${(state.user.role === 'ADMIN' || state.user.id === u.id) ? `<button class="btn btn-sm btn-outline btn-edit-user" data-id="${u.id}" data-nome="${u.nome}" data-email="${u.email}" data-role="${u.role}">Editar</button>` : ''}
                    ${state.user.role === 'ADMIN' && state.user.id !== u.id ? `<button class="btn btn-sm btn-outline btn-delete-user" data-id="${u.id}" style="color:var(--color-danger); border-color:var(--color-danger);">Excluir</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Eventos Editar
        document.querySelectorAll('.btn-edit-user').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('form-usuario').reset();
                document.getElementById('usuario-id').value = btn.getAttribute('data-id');
                document.getElementById('usuario-nome').value = btn.getAttribute('data-nome');
                document.getElementById('usuario-email').value = btn.getAttribute('data-email');
                document.getElementById('usuario-role').value = btn.getAttribute('data-role');
                document.getElementById('usuario-senha').value = '';
                
                // Se não for admin, bloqueia a edição do nome, email e cargo. O usuário só altera a própria senha
                if (state.user.role !== 'ADMIN') {
                    document.getElementById('usuario-nome').disabled = true;
                    document.getElementById('usuario-email').disabled = true;
                    document.getElementById('usuario-role').disabled = true;
                } else {
                    document.getElementById('usuario-nome').disabled = false;
                    document.getElementById('usuario-email').disabled = false;
                    document.getElementById('usuario-role').disabled = false;
                }
                
                abrirModal('modal-usuario');
            });
        });

        // Eventos Excluir
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Tem certeza que deseja remover este usuário do sistema?')) {
                    try {
                        await apiFetch(`/auth/users/${id}`, { method: 'DELETE' });
                        alert('Usuário removido com sucesso!');
                        carregarUsuarios();
                    } catch (err) {}
                }
            });
        });

    } catch (err) {
        console.error('Erro ao carregar usuários', err);
    }
}
