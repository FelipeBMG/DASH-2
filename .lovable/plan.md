
1. **Desenhar o modelo de dados global + trilha de auditoria**
   - Criar tabelas centrais no seu Supabase:
     - `user_roles` (já usamos), `audit_log` (quem fez, o que, quando, em qual módulo).
     - Módulos: `flow_boards`, `flow_columns`, `flow_cards`, `flow_card_history`.
     - `crm_leads`, `crm_clients` (e opcionalmente `crm_activities`).
     - `financial_transactions` (com tipo, categoria, centro de custo, etc.).
     - `calendar_events`.
     - `team_members` (separado de auth.users, ligado via `user_id`).
     - `contracts` (cliente, valor, status, datas).
     - `app_settings` (configurações gerais, ex.: companyName, abertura de signup).
   - Definir RLS simples por enquanto (single-tenant): “todo usuário autenticado vê/edita tudo”, mantendo apenas `user_roles` e `user_profiles` com restrições mais fortes.

2. **Implementar trilha de auditoria genérica**
   - Criar tabela `audit_log` com colunas: `id`, `user_id`, `module`, `entity`, `entity_id`, `action` (`created/updated/deleted/moved/...`), `payload_before`, `payload_after`, `created_at`.
   - Criar um helper no front (ex.: `logAction({ module, entity, action, before, after })`) que insere nessa tabela via Supabase em todos os pontos importantes (criação/edição/exclusão de:
     - Cards do fluxo, leads/clientes, transações, eventos de calendário, membros/equipe, contratos, alterações de configurações, criação de novos usuários).

3. **Migrar a persistência por módulo (mantendo UX idêntica)**
   - **Fluxo de Operações (kanban)**:
     - Trocar o estado local dos cards/colunas para buscar e salvar em `flow_*` (load inicial, criar card, mover card, atualizar status, etc.).
     - Registrar cada ação em `audit_log`.
   - **Vendedor / CRM**:
     - Persistir criação/edição de leads, clientes e atividades no banco (`crm_*`).
     - Registrar em `audit_log` quem criou/atualizou.
   - **Financeiro**:
     - Gravar receitas/despesas/lancamentos em `financial_transactions` (com data, categoria, responsável).
     - Registrar cada alteração em `audit_log`.
   - **Calendário**:
     - Salvar eventos da agenda em `calendar_events` e logar alterações.
   - **Equipe, Contratos, Configurações**:
     - Persistir criação/edição de membros de equipe, contratos e configs em suas tabelas dedicadas, sempre logando no `audit_log`.

4. **Padronizar criação de usuários somente pelo admin**
   - Desligar (ou restringir) o `/signup` público.
   - Adicionar no painel de admin uma tela “Usuários”:
     - Admin informa email + nome + papel (`admin/seller/production`).
     - Front chama `supabase.auth.signUp` para criar o usuário com senha temporária.
     - Cria entrada correspondente em `user_roles` e opcionalmente em `user_profiles` / `team_members`.
     - Registrar tudo em `audit_log`.
   - Ajustar login para não depender mais de cadastro aberto.

5. **Refinar RLS por segurança**
   - Manter `user_profiles` e `user_roles` super restritos (cada um só vê seu próprio perfil; só admin gerencia roles).
   - Como é single-tenant, os módulos de negócio podem aceitar acesso total a autenticados (ou, se quiser mais pra frente, adicionamos colunas de “owner_user_id” para limitar por responsável).

