## Sistema de Gestão de Contratos Administrativos e Manutenção de Aeronaves (GOA - CBMERJ)

Este documento estabelece as especificações arquiteturais, de banco de dados, autenticação e regras de negócio para a implementação imediata do sistema. Projetado para rodar em arquitetura Serverless/Cloud utilizando **Node.js** no backend e **Supabase** como BaaS (Backend as a Service), integrando PostgreSQL, Supabase Auth e Row Level Security (RLS).

---

## 1. Identidade Visual e Layout (Diretrizes CBMERJ)

O front-end do sistema deve refletir o prestígio e a identidade institucional do **Corpo de Bombeiros Militar do Estado do Rio de Janeiro (CBMERJ)**. A interface deve ser limpa, profissional (padrão Dashboard corporativo) e utilizar a seguinte paleta de cores institucional desaturada para garantir usabilidade (WCAG):

* **Cor Primária (Destaques e Branding):** Vermelho Bombeiro (`#B30000`) - Utilizado em botões de ação principal, barras de status críticas (AOG) e elementos de branding.
* **Cor Secundária (Acentuação e Ícones):** Ouro/Amarelo Militar (`#D4A373` ou `#E6A100`) - Utilizado para alertas moderados, prazos de garantia próximos e realces secundários.

* **Cores Neutras de Fundo e Interface:**
    * Fundo Escuro/Sidebars: Azul Noturno/Cinza Escuro (`#1E2229`)
    * Fundo do Painel Central: Branco Gelo (`#F8F9FA`)
    * Bordas e Linhas de Divisão: Cinza Claro (`#E9ECEF`)
* **Tipografia:** Família de fontes limpas e legíveis, preferencialmente *Inter* ou *Roboto*.

---

## 2. Arquitetura Tecnológica e Estrutura do Projeto

O sistema será composto por:
1.  **Banco de Dados & BaaS (Supabase):** Hospedagem de tabelas relacionais PostgreSQL, Autenticação de Usuários, Armazenamento de Documentos (Notas Fiscais em PDF) e Políticas de Segurança de Linha (RLS).
2.  **Serviço Backend (Node.js + Express):** API REST intermediária para orquestração de negócios complexos, auditoria pesada, integração com outros sistemas (se necessário) e processamento de arquivos.

### Estrutura de Pastas Sugerida para o Backend (Node.js)
Saída de código
Start.md gerado com sucesso!

```text
📦 sistema-contratos-goa
 ┣ 📂 src
 ┃ ┣ 📂 config
 ┃ ┃ ┗ 📜 supabaseClient.js
 ┃ ┣ 📂 controllers
 ┃ ┃ ┣ 📜 authController.js
 ┃ ┃ ┣ 📜 contratoController.js
 ┃ ┃ ┗ 📜 osController.js
 ┃ ┣ 📂 middlewares
 ┃ ┃ ┣ 📜 authMiddleware.js
 ┃ ┃ ┗ 📜 auditMiddleware.js
 ┃ ┣ 📂 routes
 ┃ ┃ ┣ 📜 authRoutes.js
 ┃ ┃ ┣ 📜 contratoRoutes.js
 ┃ ┃ ┗ 📜 osRoutes.js
 ┃ ┗ 📜 app.js
 ┣ 📜 .env
 ┣ 📜 package.json
 ┗ 📜 Start.md

 3. Modelagem Física do Banco de Dados (SQL DDL para Supabase)
Execute o script abaixo diretamente no SQL Editor do painel do Supabase. Ele configura a extensão de UUIDs automáticos, cria as tabelas com integridade referencial estrita, habilita os campos de auditoria e implementa a lógica automatizada para o campo updated_at.
SQL
-- Habilitar extensão para geração de UUIDs se não estiver ativa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 3.1. TABELAS DE DOMÍNIO (APOIO)
-- =====================================================================

CREATE TABLE public.empresa (
    id_empresa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.aeronave (
    id_aeronave UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prefixo VARCHAR(10) NOT NULL UNIQUE, -- Ex: PP-OBM
    modelo VARCHAR(100) NOT NULL,        -- Ex: AS 350, AW 169
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================================
-- 3.2. MÓDULO DE CONTRATOS
-- =====================================================================

CREATE TABLE public.contrato (
    id_contrato UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID REFERENCES public.empresa(id_empresa) ON DELETE RESTRICT,
    numero_contrato VARCHAR(50) NOT NULL, -- Ex: CTT 176/24
    processo_sei VARCHAR(100),
    objeto TEXT,
    doerj DATE, -- Data de publicação no Diário Oficial
    pncp VARCHAR(255),
    data_inicio DATE NOT NULL,
    data_fim_calculado DATE NOT NULL,
    valor_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.adesao (
    id_adesao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_contrato UUID REFERENCES public.contrato(id_contrato) ON DELETE CASCADE,
    numero_adesao VARCHAR(50) NOT NULL, -- Ex: 1º TA, 2º TA
    processo_sei VARCHAR(100),
    pncp VARCHAR(255),
    data_inicio DATE NOT NULL,
    data_fim_calculado DATE NOT NULL,
    valor_aditivado DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================================
-- 3.3. MÓDULO FINANCEIRO
-- =====================================================================

CREATE TABLE public.nota_fiscal (
    id_nota_fiscal UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_contrato UUID REFERENCES public.contrato(id_contrato) ON DELETE RESTRICT,
    id_adesao UUID REFERENCES public.adesao(id_adesao) ON DELETE RESTRICT, -- Pode ser nulo se for do contrato mãe
    numero_nf VARCHAR(50) NOT NULL,
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    valor_nf DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    fonte_pagadora VARCHAR(100), -- Ex: SEDEC, Seguradora
    processo_dgaf VARCHAR(100), -- Processo SEI de pagamento
    situacao_atual VARCHAR(30) NOT NULL DEFAULT 'PENDENTE', -- PENDENTE, PAGO, CANCELADO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_nf_vinculo CHECK (id_contrato IS NOT NULL OR id_adesao IS NOT NULL)
);

-- =====================================================================
-- 3.4. MÓDULO OPERACIONAL
-- =====================================================================

CREATE TABLE public.ordem_servico (
    id_ordem_servico UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_contrato UUID REFERENCES public.contrato(id_contrato) ON DELETE RESTRICT,
    id_aeronave UUID REFERENCES public.aeronave(id_aeronave) ON DELETE RESTRICT,
    codigo_os VARCHAR(50) NOT NULL UNIQUE, -- Ex: OSE 01/25, RMS 04/24
    data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_entrega_ultimo_item DATE,
    aog BOOLEAN NOT NULL DEFAULT FALSE, -- Aircraft on Ground
    prazo_conclusao_dias INTEGER,
    processo_sei VARCHAR(100),
    concluido BOOLEAN NOT NULL DEFAULT FALSE,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.os_servico_reparo (
    id_servico_reparo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_ordem_servico UUID REFERENCES public.ordem_servico(id_ordem_servico) ON DELETE CASCADE,
    id_nota_fiscal UUID REFERENCES public.nota_fiscal(id_nota_fiscal) ON DELETE SET NULL, -- Faturamento parcial
    cotacao VARCHAR(100),
    componente_descricao VARCHAR(255) NOT NULL,
    pn VARCHAR(100), -- Part Number
    sn VARCHAR(100), -- Serial Number
    valor_reparo DECIMAL(15,2) DEFAULT 0.00,
    valor_item_novo DECIMAL(15,2) DEFAULT 0.00,
    frete DECIMAL(15,2) DEFAULT 0.00,
    coleta_individual VARCHAR(100),
    situacao_atual VARCHAR(100), -- Ex: Aguardando Orçamento, Em Reparo
    status_goa VARCHAR(100),
    data_fim_garantia DATE,
    core_retornado BOOLEAN NOT NULL DEFAULT FALSE, -- Logística reversa do casco avariado
    awb_rastreio VARCHAR(100),                    -- Rastreamento internacional/nacional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.os_material_aquisicao (
    id_material_aquisicao UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_ordem_servico UUID REFERENCES public.ordem_servico(id_ordem_servico) ON DELETE CASCADE,
    id_nota_fiscal UUID REFERENCES public.nota_fiscal(id_nota_fiscal) ON DELETE SET NULL, -- Faturamento parcial
    orcamento VARCHAR(100),
    item_descricao VARCHAR(255) NOT NULL,
    pn VARCHAR(100),
    equivalencia_evo VARCHAR(50), -- EQU / EVO
    quantidade INTEGER NOT NULL DEFAULT 1,
    data_previsao DATE,
    recebido BOOLEAN NOT NULL DEFAULT FALSE,
    data_fim_garantia DATE,
    core_retornado BOOLEAN NOT NULL DEFAULT FALSE, -- Exigência de troca padrão (Standard Exchange)
    awb_rastreio VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================================
-- 3.5. TRIGGERS AUTOMÁTICOS (UPDATED_AT)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a trigger de timestamp para todas as tabelas
CREATE TRIGGER set_timestamp_empresa BEFORE UPDATE ON public.empresa FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER set_timestamp_aeronave BEFORE UPDATE ON public.aeronave FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER set_timestamp_contrato BEFORE UPDATE ON public.contrato FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER set_timestamp_adesao BEFORE UPDATE ON public.adesao FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER set_timestamp_nota_fiscal BEFORE UPDATE ON public.nota_fiscal FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER set_timestamp_ordem_servico BEFORE UPDATE ON public.ordem_servico FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER set_timestamp_os_servico_reparo BEFORE UPDATE ON public.os_servico_reparo FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER set_timestamp_os_material_aquisicao BEFORE UPDATE ON public.os_material_aquisicao FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

4. Autenticação, Níveis de Acesso e Segurança (Supabase Auth & RLS)
O controle de usuários será gerenciado nativamente pelo Supabase Auth. Cada usuário registrado possuirá uma Role customizada atribuída em seus metadados (ou via tabela complementar de perfis).

Perfis de Usuário definidos para o GOA:

ADMIN: Acesso total ao sistema, exclusão lógica de registros, parametrização e cadastro de contratos mãe.

FISCAL_CONTRATO: Responsável por gerenciar empenhos, termos aditivos (Adesão) e validar as Notas Fiscais vinculadas às ordens de serviço e as funções do Operador_Manuntencao.

OPERADOR_MANUTENCAO (Mecânico/Logística): Abre Ordens de Serviço (OSE/RMS), insere peças necessárias, atualiza códigos de rastreio AWB e sinaliza retorno do Casco (Core Return). Não altera dados financeiros nem deleta contratos.

Ativação de Row Level Security (RLS) no PostgreSQL

Para blindar o banco de dados contra requisições diretas maliciosas do front-end, habilitamos o RLS. Abaixo está o exemplo padrão a ser executado para a tabela de Contratos:
SQL
ALTER TABLE public.contrato ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer usuário autenticado pode visualizar os contratos
CREATE POLICY "Permitir leitura para autenticados" ON public.contrato
    FOR SELECT TO authenticated USING (deleted_at IS NULL);

-- Política: Apenas perfis ADMIN e FISCAL podem inserir/modificar contratos
CREATE POLICY "Permitir escrita para Admin e Fiscal" ON public.contrato
    FOR ALL TO authenticated 
    USING (
        auth.jwt() -> 'user_metadata' ->> 'role' IN ('ADMIN', 'FISCAL_CONTRATO')
    );

5. Implementação da API Backend (Node.js)
O backend em Node.js servirá como validador de regras de negócio complexas. Abaixo estão os arquivos estruturais e trechos de código cruciais para que o agente implemente a solução.

5.1. Instalação de Dependências Básicas (package.json)
JSON
{
  "name": "backend-goa-cbmerj",
  "version": "1.0.0",
  "main": "src/app.js",
  "type": "module",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2"
  }
}

5.2. Arquivo .env (Configuração)
Snippet de código
PORT=3000
SUPABASE_URL=[https://seu-projeto-supabase.supabase.co](https://seu-projeto-supabase.supabase.co)
SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-secreta-service-role

5.3. Inicialização do Cliente Supabase (src/config/supabaseClient.js)
JavaScript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usado no backend para bypass seguro controlado

export const supabase = createClient(supabaseUrl, supabaseKey);

5.4. Middleware de Autenticação e Perfil (src/middlewares/authMiddleware.js)
JavaScript
import { supabase } from '../config/supabaseClient.js';

export async function verificarAcesso(rolesPermitidas = []) {
    return async (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(411).json({ error: 'Token de autenticação não fornecido.' });
        }

        // Valida o token JWT diretamente com o Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
        }

        const userRole = user.user_metadata?.role;

        // Se roles específicas foram passadas, verifica se o usuário possui permissão
        if (rolesPermitidas.length > 0 && !rolesPermitidas.includes(userRole)) {
            return res.status(403).json({ error: 'Acesso negado. Perfil insuficiente para esta operação.' });
        }

        // Injeta o ID do usuário e a Role na requisição para uso posterior (Ex: Auditoria)
        req.user = { id: user.id, role: userRole };
        next();
    };
}

5.5. Exemplo de Rota e Controller Operacional com Soft Delete (src/controllers/osController.js)
JavaScript
import { supabase } from '../config/supabaseClient.js';

export const criarOrdemServico = async (req, res) => {
    try {
        const { id_contrato, id_aeronave, codigo_os, aog, prazo_conclusao_dias, processo_sei, observacao } = req.body;
        
        const { data, error } = await supabase
            .from('ordem_servico')
            .insert([{
                id_contrato,
                id_aeronave,
                codigo_os,
                aog,
                prazo_conclusao_dias,
                processo_sei,
                observacao,
                created_by: req.user.id // Resgatado do token no middleware
            }])
            .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

export const deletarOrdemServicoLogico = async (req, res) => {
    try {
        const { id } = req.params;

        // Implementação estrita de SOFT DELETE (Conforme Regra de Auditoria #4)
        const { data, error } = await supabase
            .from('ordem_servico')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id_ordem_servico', id)
            .select();

        if (error) throw error;
        return res.status(200).json({ message: 'Registro desativado logicamente com sucesso.', data });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
};

6. Lógica de Negócio Obrigatória (Faturamento Parcial e Rastreamento)
O Agente de desenvolvimento deve programar as telas e validações levando em consideração os seguintes fluxos operacionais consolidados das planilhas históricas:

O controle financeiro NÃO é global. O sistema deve gerenciar e validar saldos de forma isolada por Contrato Mãe e por cada Termo Aditivo (Adesão):

Limites Financeiros: Ao atestar uma Nota Fiscal vinculada diretamente a um Termo Aditivo, o somatório das NFs pagas para aquele id_adesao específico não pode ultrapassar o seu valor_aditivado. Se a NF for lançada no contrato original (id_contrato), ela consome apenas do valor_total original.

Validação de Vigência (Prazos): O backend deve bloquear o lançamento de Notas Fiscais ou o cadastro de Ordens de Serviço cujas datas de execução estejam fora do período de vigência estrito (data_inicio até data_fim_calculado) daquele Contrato ou Termo Aditivo específico selecionado pelo usuário.

Rastreabilidade Logística Mandatória: Se o tipo de item cadastrado em OS_SERVICO_REPARO for do tipo rotativo e exigir troca baseada em reparo, o campo core_retornado deve disparar alertas visuais no painel inicial do sistema até que seja alterado para VERDADEIRO e o awb_rastreio seja inserido, evitando multas contratuais junto às empresas Helibras, Safran e Leonardo.

Faturamento Fracionado: O front-end e as consultas SQL devem permitir que o usuário selecione múltiplos itens pendentes de faturamento de uma OSE ou RMS e vincule-os a uma nova id_nota_fiscal criada, alterando instantaneamente o status daqueles itens específicos sem travar ou exigir a conclusão financeira total da Ordem de Serviço de uma vez só.

Faturamento Parcial Desvinculado: O desenvolvedor deve permitir na interface que o usuário abra uma Ordem de Serviço, insira 10 materiais comprados e fature apenas 3 através de uma Nota Fiscal emitida (vinculando o id_nota_fiscal diretamente na linha do material na tabela os_material_aquisicao). O status dos outros 7 materiais deve continuar como "Aguardando Faturamento".

Gargalo de Logística Reversa (Core Return): Caso um serviço ou peça exija devolução de casco avariado (marcado como core_retornado = false), o sistema deve exibir um indicador visual amarelo na tela inicial até que o operador insira o respectivo código awb_rastreio de envio, mitigando o risco de multas contratuais aplicadas por fornecedores como Helibras, Safran e Leonardo.

Auditoria Nativa: Toda operação de inserção insere o ID do usuário em created_by. Nenhuma operação de DELETE físico deve ser exposta nas rotas normais; todas as exclusões de interface disparam comandos UPDATE preenchendo o campo deleted_at.

7. Diretrizes de Implementação Automatizada para o Agente de IA
Para construir o sistema agora, siga o plano de passos ordenados abaixo:

Passo 1: Conecte-se à instância vazia do Supabase e execute o DDL contido na Seção 3 deste arquivo no Editor de Queries.

Passo 2: Crie o projeto Node.js estruturado com o package.json fornecido na Seção 5.1 e 
configure as variáveis de ambiente.

Passo 3: Implemente os middlewares de segurança e validação de token do Supabase Auth (authMiddleware.js).

Passo 4: Desenvolva as rotas e os controllers CRUD respeitando as regras de injeção de Auditoria (created_by) e a exclusão lógica via deleted_at para todas as tabelas.

Passo 5: Construa a interface de usuário priorizando a paleta de cores institucional CBMERJ (#B30000 primário) com tabelas claras, paginação eficiente e centro de alertas para aeronaves em status AOG e pendências de Core Return.