# GOA - Sistema de Gestão de Contratos e Manutenção | CBMERJ

Este é o sistema unificado de **Gestão de Contratos Administrativos e Manutenção de Aeronaves (GOA)** do **Corpo de Bombeiros Militar do Estado do Rio de Janeiro (CBMERJ)**. Ele permite o monitoramento financeiro de contratos e termos aditivos (Adesão), controle de ordens de serviço de aviação (OSE/RMS), atesto de recebimento de materiais e gestão logística reversa de componentes avariados (Core Return).

---

## 🛠️ Tecnologias Utilizadas

### Backend
* **Node.js** com framework **Express** para API REST de alto desempenho.
* **@supabase/supabase-js** para persistência no banco de dados.
* **jsonwebtoken** e **bcryptjs** para módulo de Autenticação customizado e seguro (JWT).
* **Dotenv** para gerenciamento de credenciais locais.
* **CORS** para segurança de origens cruzadas.

### Frontend
* **Vanilla HTML5 & CSS3** premium, estruturado de forma semântica e adaptado à paleta militar do CBMERJ.
* **Layout 100% Responsivo**, garantindo adaptação dinâmica para Desktop, Tablets e Smartphones, incluindo menu lateral retrátil.
* **Vanilla JavaScript** estruturado como Single Page Application (SPA), garantindo carregamento instantâneo.
* **Autenticação via Token Bearer** armazenado em sessão local para flexibilidade de acesso.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
Certifique-se de possuir o **Node.js** (versão 18 ou superior) instalado em sua máquina.

### Passo 1: Instalar Dependências
No diretório do projeto, execute o comando:
```bash
npm install
```

### Passo 2: Configurar Variáveis de Ambiente
Renomeie ou copie o arquivo `.env.example` para `.env` e preencha com as credenciais do seu projeto Supabase e o Segredo JWT:
```env
PORT=3000
SUPABASE_URL=https://[seu-projeto].supabase.co
SUPABASE_ANON_KEY=[sua-chave-publica-anon]
SUPABASE_SERVICE_ROLE_KEY=[sua-chave-secreta-service-role]
JWT_SECRET=super_secret_jwt_key_goa_2026_change_in_production
```

### Passo 3: Iniciar o Servidor
Execute o comando a seguir para inicializar o servidor em modo de desenvolvimento:
```bash
npm run dev
```

### Passo 4: Acessar a Interface
Abra o seu navegador e acesse:
👉 **[http://localhost:3000](http://localhost:3000)**

> [!TIP]
> **Autenticação e Perfis (Roles):** O sistema utiliza uma tabela de usuários customizada (com senhas via bcrypt) e gerencia acesso através de JWT. Estão disponíveis os seguintes perfis:
> - **ADMIN**: Controle total, pode criar/editar/excluir outros usuários e operações.
> - **FISCAL_CONTRATO / FISCAL**: Acesso a contratos, NFs e OSs.
> - **OPERADOR_MANUTENCAO**: Restrito a criar/editar serviços e materiais.
> - **CONSULTA**: Acesso irrestrito de leitura (GET) em todas as áreas, porém bloqueado para salvar, alterar ou deletar qualquer informação do sistema.
>
> Para criar o seu primeiro usuário administrador, rode o script `node scripts/createAdmin.js`.

---

## 📌 Funcionalidades Principais do Sistema

1. **Dashboard Corporativo CBMERJ:**
   - Central de Alertas para aeronaves em status emergencial **AOG** (pulsante vermelho).
   - Tabela de pendências de **Logística Reversa (Core Return)** com campo rápido para atesto de envio via código **AWB**.
   - Gráficos e indicadores de saúde financeira de empenhos ativos.

2. **Módulo de Contratos & Termos Aditivos (Adesão):**
   - Criação de Contratos Mãe com progressão financeira em barras.
   - Adicionamento de múltiplos Termos Aditivos vinculados, com saldos e cronogramas independentes.
   - Auditoria nativa de criação e desativação lógica (**Soft Delete**).

3. **Módulo Operacional (Ordens de Serviço - OSE/RMS):**
   - Grid dinâmico para controle de manutenções correntes.
   - Abas internas dedicadas para **Serviços/Reparos** e **Aquisição de Materiais/Peças**.
   - Atesto de recebimento de materiais com alteração de status imediata.

4. **Gestão de Notas Fiscais & Auditoria Fiscal:**
   - Lançamento de faturamentos com validações matemáticas e bloqueio preventivo de extrapolação financeira de saldos do Contrato ou da Adesão específica.
   - Validador estrito de vigência contratual (datas de execução da NF/OS).
   - **Faturamento Fracionado (Lote):** Opção de selecionar múltiplos itens pendentes de manutenção em uma OS e vinculá-los a uma nova Nota Fiscal de forma isolada.
