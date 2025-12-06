# 📋 TO-DO LIST PARA LANÇAMENTO NO MERCADO PORTUGUÊS

**Versão**: 1.0
**Data**: 6 de Dezembro de 2025
**App**: THRIV - Health & Fitness Tracker
**Target**: Mercado Português

---

## 🔴 **PRIORIDADE CRÍTICA** (Bloqueadores de Lançamento)

### Legal & Compliance (RGPD/GDPR)

#### Documentação Legal
- [ ] **Política de Privacidade em PT-PT**
  - Explicar que dados são recolhidos (email, nome, dados nutricionais, treinos)
  - Como são usados e armazenados (Firestore)
  - Direitos do utilizador (acesso, rectificação, eliminação)
  - Conformidade com RGPD
  - Link: `/privacy-policy`

- [ ] **Termos e Condições em PT-PT**
  - Responsabilidades da app vs utilizador
  - Disclaimers médicos/nutricionais
  - Cancelamento de subscrição
  - Limitação de responsabilidade
  - Link: `/terms-of-service`

#### Conformidade RGPD
- [ ] **Consentimento RGPD ao registar**
  - Checkbox obrigatório antes de criar conta
  - Link para política de privacidade
  - Opção de aceitar/rejeitar cookies e analytics
  - Guardar timestamp do consentimento

- [ ] **Funcionalidade "Eliminar Conta"**
  - Botão no ProfileScreen
  - Confirmação dupla (email + password)
  - Eliminar todos os dados do utilizador do Firestore
  - Conformidade com "direito ao esquecimento"
  - Email de confirmação após eliminação

- [ ] **Exportar Dados do Utilizador**
  - Funcionalidade para download de todos os dados (RGPD)
  - Formato JSON ou CSV
  - Incluir: meals, workouts, stats, profile, goals
  - Botão no ProfileScreen: "Exportar os meus dados"
  - Email com link de download (expira em 24h)

---

### Autenticação & Segurança

#### Recuperação de Conta
- [ ] **Password Reset funcional**
  - Implementar fluxo "Esqueci-me da password"
  - Email de recuperação
  - Link temporário (expira em 1h)
  - Validação de token

- [ ] **Validação de Email obrigatória**
  - Enviar email de verificação após registo
  - Bloquear funcionalidades críticas até verificar
  - Reenviar email de verificação
  - Badge "Email não verificado" na app

#### Segurança
- [ ] **Rate Limiting**
  - Limitar tentativas de login (5 tentativas / 15 min)
  - Prevenir brute force attacks
  - Limitar requests à API do OpenFoodFacts (30 req/min)
  - Captcha após X tentativas falhadas

- [ ] **Sanitização de Inputs**
  - Validar todos os inputs do utilizador
  - Prevenir XSS e injection attacks
  - Validação server-side (Firebase Rules)
  - Escape de caracteres especiais

- [ ] **Firebase Security Rules**
  - Users só podem ler/escrever seus próprios dados
  - Validação de schema no server
  - Rate limiting por utilizador
  - Revisar e testar todas as rules

---

### Pagamentos (se tiver Paywall)

#### Integração de Pagamentos
- [ ] **Integrar Stripe ou RevenueCat**
  - Configurar subscrições mensais/anuais
  - Preços em EUR (não USD)
  - Suporte para Multibanco/MB WAY (mercado PT)
  - Cartão de crédito/débito
  - Apple Pay / Google Pay

- [ ] **Planos de Subscrição**
  - **Free**: Features básicas
  - **Premium Mensal**: €4.99/mês
  - **Premium Anual**: €39.99/ano (save 33%)
  - Trial period (7 dias grátis)

#### Gestão de Subscrições
- [ ] **Funcionalidade de Cancelamento**
  - Permitir cancelar subscrição dentro da app
  - Acesso aos dados até fim do período pago
  - Confirmação por email
  - Reactivação fácil

- [ ] **Recibos e Facturas**
  - Enviar recibos por email automaticamente
  - NIF para facturas (obrigatório em Portugal)
  - Histórico de pagamentos na app
  - Download de facturas em PDF

---

## 🟠 **ALTA PRIORIDADE** (Essencial para Boa UX)

### Features Core em Falta

#### Gestão de Refeições
- [ ] **Editar Refeições**
  - Permitir editar meal depois de adicionar
  - Actualizar dailyStats quando editar
  - Histórico de edições (opcional)
  - Validação de dados

- [ ] **Eliminar Refeições com Actualização**
  - Ao eliminar, decrementar dailyStats
  - Confirmação antes de eliminar
  - Toast notification de sucesso

- [ ] **Pesquisa de Refeições Anteriores**
  - Histórico de alimentos frequentes
  - "Adicionar de novo" com 1 tap
  - Ordenar por frequência
  - Filtrar por tipo de refeição

- [ ] **Criar Refeições Personalizadas**
  - Adicionar alimento manual (não do OpenFoodFacts)
  - Input manual de macros
  - Guardar na biblioteca pessoal
  - Editar alimentos personalizados

- [ ] **Templates de Refeições**
  - Guardar refeições completas (ex: "Pequeno-almoço habitual")
  - Adicionar template completo de uma vez
  - Listar templates no AddFoodScreen
  - Editar/eliminar templates

- [ ] **Pesquisa Avançada de Alimentos**
  - Filtros (baixo em carbos, alto em proteína, etc)
  - Favoritos (star icon)
  - Recentes (últimos 20)
  - Cache local para performance

#### Scanner de Códigos de Barras
- [ ] **Barcode Scanner melhorado**
  - Feedback visual quando detecta código
  - Auto-focus e detecção rápida
  - Histórico de scans
  - Fallback para pesquisa manual se não encontrar
  - Suporte para EAN-13, UPC-A, QR codes

#### Gestão de Treinos
- [ ] **Editar Treinos**
  - Permitir editar workout depois de adicionar
  - Actualizar stats quando editar
  - Validação de duração

- [ ] **Eliminar Treinos**
  - Confirmação antes de eliminar
  - Toast notification

---

### Metas e Progresso

#### Definição de Metas
- [ ] **Definir Metas Personalizadas**
  - Wizard de onboarding para calcular metas
  - Input: peso, altura, idade, género, nível de actividade
  - Objectivo: perder peso, manter, ganhar massa
  - Cálculo automático de TDEE (Total Daily Energy Expenditure)
  - Fórmula: Harris-Benedict ou Mifflin-St Jeor

- [ ] **Editar Metas**
  - Permitir alterar caloriesGoal, proteinGoal, carbsGoal, fatGoal
  - No ProfileScreen com ícone de edição
  - Recalcular automaticamente ao mudar objectivo
  - Guardar histórico de metas (opcional)

#### Tracking de Peso
- [ ] **Adicionar Peso Diário/Semanal**
  - Input de peso com validação
  - Data picker para registos antigos
  - Unidade: kg ou lbs (preferência do utilizador)
  - Guardar em `users/{userId}/weightHistory`

- [ ] **Gráfico de Evolução de Peso**
  - No ProgressScreen tab "Peso"
  - Linha de tendência
  - Meta de peso (linha horizontal)
  - Período ajustável (7d, 30d, 90d, 1y)

#### Analytics de Progresso
- [ ] **Gráficos de Progresso melhorados**
  - Mais períodos (7 dias, 30 dias, 90 dias, ano)
  - Média móvel (7 dias)
  - Comparação com metas (linha horizontal)
  - Exportar gráficos como imagem

- [ ] **Estatísticas Avançadas**
  - Média de calorias/semana
  - Dias acima/abaixo da meta
  - Streak atual e recorde
  - Macro ratio (P/C/F percentagem)

---

### UX Improvements

#### Onboarding
- [ ] **Onboarding Tutorial**
  - 3-5 screens explicando features principais
  - Skip option (botão discreto)
  - Apenas no primeiro uso
  - Ilustrações simples e claras
  - CTA final: "Começar"

- [ ] **Setup Inicial de Metas**
  - Wizard step-by-step
  - Obrigatório no primeiro uso
  - Inputs: dados pessoais + objectivo
  - Explicação de cada campo
  - Preview das metas calculadas

#### Estados e Feedback
- [ ] **Empty States melhorados**
  - Mensagens mais friendly
  - Call-to-action claro e visível
  - Ilustrações ou ícones grandes
  - Exemplos:
    - "Ainda não adicionaste refeições hoje. Toca em + para começar!"
    - "Regista o teu primeiro treino e começa a acompanhar o progresso"

- [ ] **Loading States**
  - Skeleton screens em vez de spinners genéricos
  - Placeholder shimmer effect
  - Feedback visual em todas as operações longas (>500ms)
  - Progress indicators para uploads

- [ ] **Substituir Alert.alert() restantes**
  - ✅ AddFoodScreen: Já feito
  - ❌ NutritionScreen.deleteMeal → Modal customizado inline
  - ❌ WorkoutsScreen.deleteWorkout → Modal customizado inline
  - Estilo: Bottom sheet com animação smooth

#### Gestos e Interações
- [ ] **Swipe-to-Delete**
  - Em meals (NutritionScreen)
  - Em workouts (WorkoutsScreen)
  - Animação smooth (slide out)
  - Botão vermelho "Eliminar" ao swipe
  - Undo toast (opcional)

- [ ] **Haptic Feedback**
  - Ao adicionar refeição (light impact)
  - Ao completar meta diária (success notification)
  - Nos steppers de porção (selection feedback)
  - Ao swipe-to-delete (warning feedback)
  - iOS: UIImpactFeedbackGenerator
  - Android: Haptics API

- [ ] **Pull-to-Refresh**
  - HomeScreen ✅ (verificar)
  - NutritionScreen ✅ (já implementado)
  - WorkoutsScreen ✅ (já implementado)
  - ProgressScreen ✅ (já implementado)
  - ProfileScreen (adicionar)

---

### Notificações

#### Push Notifications (Recomendado)
- [ ] **Setup de Push Notifications**
  - Firebase Cloud Messaging (FCM)
  - Pedir permissão no momento certo (não no primeiro uso)
  - Explicar benefícios antes de pedir
  - Permitir disable nas settings

- [ ] **Tipos de Notificações**
  - **Lembrete de Refeição**: "Não te esqueças de registar o almoço!"
  - **Meta Atingida**: "🎉 Parabéns! Atingiste a tua meta de calorias hoje!"
  - **Streak Reminder**: "Estás há 7 dias seguidos a registar! Continua assim!"
  - **Treino Reminder**: "Hora de treinar! Tens planeado 30 min de cardio"
  - **Água Reminder**: "Já bebeste água suficiente hoje?"

#### Notificações Locais
- [ ] **Configuração de Lembretes**
  - Horários customizáveis
  - Toggle on/off por tipo
  - Quiet hours (não notificar de noite)
  - Settings no ProfileScreen

- [ ] **Lembretes Inteligentes**
  - Baseados em padrões do utilizador
  - Se normalmente almoça às 13h, lembrar às 13h15 se não registou
  - Adaptar horários automaticamente

---

## 🟡 **MÉDIA PRIORIDADE** (Nice to Have)

### Features Adicionais

#### Integrações
- [ ] **Integração com Apple Health**
  - Sincronizar treinos
  - Sincronizar peso
  - Sincronizar passos (steps)
  - Sincronizar HealthKit workouts
  - Exportar dados da THRIV para Health

- [ ] **Integração com Google Fit**
  - Sincronizar treinos
  - Sincronizar peso
  - Sincronizar passos
  - Exportar dados da THRIV para Fit

#### Temas
- [ ] **Modo Escuro/Claro toggle**
  - Já está em dark mode
  - Adicionar light theme completo
  - Toggle no ProfileScreen
  - Seguir preferência do sistema (opcional)
  - Animação smooth na transição

- [ ] **Personalização de Cores**
  - Escolher cor primária (laranja, azul, verde, rosa)
  - Aplicar em toda a app
  - Preview antes de aplicar

#### Internacionalização
- [ ] **Múltiplas Línguas**
  - ✅ PT-PT (já está)
  - EN-US (inglês americano)
  - EN-GB (inglês britânico)
  - ES (espanhol)
  - FR (francês)
  - Usar i18next ou react-i18next
  - Detectar língua do dispositivo

#### Receitas
- [ ] **Database de Receitas**
  - 50+ receitas saudáveis portuguesas
  - Categorias: pequeno-almoço, almoço, jantar, snacks, sobremesas
  - Filtros: vegetariano, vegan, sem glúten, low-carb
  - Tempo de preparação
  - Dificuldade

- [ ] **Calcular Macros da Receita**
  - Ingredientes com quantidades
  - Calcular total de macros
  - Macros por porção
  - Adicionar receita completa como meal

- [ ] **Receitas Personalizadas**
  - Utilizador criar suas receitas
  - Guardar na biblioteca pessoal
  - Partilhar com comunidade (futuro)

#### Treinos Avançados
- [ ] **Planos de Treino**
  - Templates pré-definidos:
    - Push/Pull/Legs
    - Full Body
    - Upper/Lower Split
    - HIIT
    - Cardio
  - Seguir plano pré-definido
  - Progress tracking do plano

- [ ] **Exercícios Detalhados**
  - Database de 100+ exercícios
  - Descrição e instruções
  - Vídeos demonstrativos (opcional)
  - Músculo trabalhado
  - Equipamento necessário

#### Social Features (Futuro)
- [ ] **Partilhar Progresso**
  - Gerar imagem do progresso (Instagram/Stories format)
  - Partilhar streak
  - Partilhar achievement
  - Privacy: escolher o que partilhar

- [ ] **Leaderboards** (opcional)
  - Entre amigos
  - Por região
  - Semanal/mensal
  - Categorias: streak, calorias queimadas, treinos

- [ ] **Desafios entre Amigos**
  - Criar desafio personalizado
  - 7/30 dias
  - Objetivo: mais calorias queimadas, mais treinos, etc
  - Notificações de progresso

#### OCR (Futuro)
- [ ] **Scan de Etiquetas Nutricionais**
  - OCR para detectar tabela nutricional
  - Extrair macros automaticamente
  - Adicionar produto automaticamente
  - ML Kit (Firebase) ou Tesseract

---

### Analytics & Insights

#### Dashboard
- [ ] **Dashboard de Insights**
  - No ProgressScreen ou nova tab
  - Estatísticas semanais/mensais
  - Tendências (está a melhorar/piorar)
  - Comparação com metas
  - Gráficos visuais e coloridos

- [ ] **Insights Personalizados**
  - "Esta semana consumiste +15% de proteína"
  - "Tens treinado mais ao fim-de-semana"
  - "O teu dia mais consistente é terça-feira"
  - IA para identificar padrões (futuro)

#### Reports
- [ ] **Reports Automáticos**
  - Email semanal com resumo
  - PDF exportável
  - Gráficos incluídos
  - Opt-in (não enviar por padrão)

- [ ] **Resumo Mensal**
  - Total de calorias
  - Média diária
  - Dias acima/abaixo da meta
  - Treinos completados
  - Peso inicial vs final

#### Gamificação
- [ ] **Achievements/Badges**
  - Primeira meal registada
  - 7 dias de streak 🔥
  - 30 dias de streak 🔥🔥
  - 100 dias de streak 🔥🔥🔥
  - Meta atingida 10x
  - 50 treinos completados
  - Perder 5kg
  - Badge collection no ProfileScreen

---

### Performance & Optimização

#### Offline Support
- [ ] **Cache de Dados**
  - Cache de refeições recentes (últimos 7 dias)
  - Cache de alimentos frequentes
  - Cache de templates
  - Sincronizar quando voltar online

- [ ] **Indicador de Estado**
  - Badge "Offline" visível
  - Toast ao voltar online: "Sincronizando dados..."
  - Queue de operações pendentes
  - Retry automático

#### Imagens
- [ ] **Imagens Optimizadas**
  - Lazy loading de imagens do OpenFoodFacts
  - Placeholder blur enquanto carrega
  - Comprimir antes de upload (se tiver uploads)
  - Cache local com Expo Image
  - WebP format quando possível

#### Queries & Data
- [ ] **Query Optimisation**
  - Indexar Firestore correctamente
  - Composite indexes para queries complexas
  - Paginated queries (limit + offset)
  - Cache strategies (memory + disk)
  - Minimize reads (custo Firebase)

- [ ] **Bundle Size**
  - Code splitting por screen
  - Tree shaking de bibliotecas
  - Remove unused dependencies
  - Analyze bundle: `npx react-native bundle --analyze`
  - Target: <5MB para JS bundle

#### Monitorização
- [ ] **Performance Monitoring**
  - App startup time (<2s ideal)
  - Screen transition time (<300ms)
  - API response time (<1s)
  - Firebase Performance Monitoring
  - Alertas se degradar

---

## 🟢 **BAIXA PRIORIDADE** (Pós-Lançamento)

### Advanced Features

#### IA e Machine Learning
- [ ] **AI Meal Suggestions**
  - Baseado em histórico do utilizador
  - Sugerir refeições para atingir metas do dia
  - "Faltam 30g de proteína, sugerimos..."
  - ML personalizado (TensorFlow Lite)

- [ ] **Computer Vision para Alimentos**
  - Tirar foto da comida
  - IA identifica o alimento
  - Estima quantidade e macros
  - Google Cloud Vision API ou Custom ML

#### Planeamento
- [ ] **Meal Prep Planner**
  - Planear semana de refeições
  - Drag & drop de refeições
  - Lista de compras automática
  - Notificações de meal prep

- [ ] **Lista de Compras Inteligente**
  - Baseada em receitas planeadas
  - Agrupar por categoria (frutas, proteínas, etc)
  - Sync com apps de supermercado (Continente, Pingo Doce)
  - Checkbox para marcar comprado

#### Integrações Avançadas
- [ ] **Integration com Restaurantes**
  - API de menus de restaurantes portugueses
  - Uber Eats / Glovo integration
  - Ver macros antes de pedir
  - Filtrar por macros

- [ ] **Integração com Wearables**
  - Apple Watch app
  - Wear OS app
  - Garmin Connect
  - Fitbit
  - Whoop

#### Comunidade
- [ ] **Comunidade In-App**
  - Forum/feed social
  - Partilha de receitas
  - Tips & motivação
  - Q&A com nutricionistas (moderado)
  - Reportar conteúdo inadequado

- [ ] **Expert Content**
  - Parcerias com nutricionistas portugueses
  - Artigos e guias
  - Planos premium personalizados
  - Consultas online (futuro)

---

### Marketing & Growth

#### Programa de Referral
- [ ] **Sistema de Convites**
  - Convidar amigos por link único
  - Ambos ganham bonus (7 dias premium grátis)
  - Tracker de convites no ProfileScreen
  - Leaderboard de referrals

- [ ] **Incentivos**
  - 3 amigos = 1 mês grátis
  - 10 amigos = 3 meses grátis
  - Top referrer mensal = 1 ano grátis

#### Conteúdo
- [ ] **Blog/Content**
  - Artigos sobre nutrição portuguesa
  - Receitas saudáveis portuguesas
  - Tips & tricks
  - Success stories de utilizadores
  - SEO optimizado

- [ ] **Newsletter**
  - Semanal com tips
  - Novas features
  - Estatísticas interessantes
  - Opt-in

#### Partnerships
- [ ] **Ginásios Portugueses**
  - Parcerias com cadeias (Fitness Hut, Solinca, etc)
  - Desconto para membros
  - Co-marketing

- [ ] **Nutricionistas**
  - Programa de afiliados
  - Nutricionista pode recomendar app
  - Dashboard para acompanhar clientes

- [ ] **Influencers Fitness PT**
  - Parcerias de conteúdo
  - Códigos promocionais
  - Reviews honestas
  - Instagram, TikTok, YouTube

---

## 🔧 **TÉCNICO & INFRA**

### Testing

#### Testes Automáticos
- [ ] **Unit Tests**
  - Testar funções puras (calculateNutrients, etc)
  - Testar utilities
  - Jest + React Native Testing Library
  - Cobertura mínima: 60%
  - CI/CD deve falhar se cobertura < 60%

- [ ] **Integration Tests**
  - Testar fluxos completos
  - Mocks de Firestore
  - Mocks de APIs externas
  - Scenarios: happy path + error cases

- [ ] **E2E Tests**
  - Detox (iOS + Android)
  - Testar em dispositivos reais
  - Scenarios críticos:
    - Registo + Login
    - Adicionar refeição
    - Adicionar treino
    - Ver progresso
  - Rodar antes de cada release

#### Beta Testing
- [ ] **Programa de Beta**
  - TestFlight (iOS)
  - Google Play Beta (Android)
  - 50-100 beta testers portugueses
  - Feedback loop estruturado
  - Survey após 1 semana de uso

- [ ] **Canais de Feedback**
  - In-app feedback button
  - Email: beta@thriv.app
  - Discord/Slack community
  - Issues no GitHub (privado)

---

### Monitoring & Error Tracking

#### Crash Reporting
- [ ] **Sentry ou Crashlytics**
  - Track crashes em tempo real
  - Stack traces completas
  - Device info
  - Priorizar por frequência
  - Alertas para crashes críticos

- [ ] **Error Reporting**
  - Capturar erros não-fatais
  - Network errors
  - API errors
  - Firestore errors
  - Context e breadcrumbs

#### Performance
- [ ] **Performance Monitoring**
  - Firebase Performance
  - App start time
  - Screen render time
  - Network requests duration
  - Custom traces para operações críticas

- [ ] **Alertas**
  - Crash rate > 1%
  - App start time > 3s
  - API response time > 2s
  - Notificação no Slack

#### Analytics
- [ ] **Firebase Analytics ou Mixpanel**
  - Track eventos importantes:
    - Screen views
    - Meal added
    - Workout logged
    - Goal reached
    - Subscription started
  - User properties (idade, género, objectivo)
  - Funnels de conversão

- [ ] **Métricas de Negócio**
  - DAU/MAU
  - Retention (D1, D7, D30)
  - ARPU (Average Revenue Per User)
  - Churn rate
  - LTV (Lifetime Value)

#### Logs
- [ ] **Logs Estruturados**
  - Winston ou Bunyan
  - Log levels: error, warn, info, debug
  - Enviar para servidor (Loggly, Papertrail)
  - Não logar dados sensíveis
  - Rotation e retention (30 dias)

---

### DevOps

#### CI/CD
- [ ] **Pipeline Automático**
  - GitHub Actions ou Bitrise
  - Triggers:
    - Push para `main`: build + test
    - Pull Request: build + test + lint
    - Tag `v*`: release para stores
  - Slack notifications

- [ ] **Build Automation**
  - Auto-increment build number
  - Generate release notes
  - Upload para TestFlight/Play Console
  - Não fazer deploy manual

#### Ambientes
- [ ] **Environment Management**
  - **Dev**: Firebase project dev
  - **Staging**: Firebase project staging
  - **Production**: Firebase project prod
  - Environment variables via `.env`
  - Nunca commitar `.env` para git

- [ ] **Config por Ambiente**
  - API keys diferentes
  - Analytics diferentes
  - Debug mode on/off
  - Feature flags

#### Backup & Recovery
- [ ] **Backup Strategy**
  - Backup diário do Firestore
  - Retenção: 30 dias
  - Teste de restore mensal
  - Firestore export para Cloud Storage

- [ ] **Disaster Recovery**
  - Plano documentado
  - Restore time < 4h
  - RTO (Recovery Time Objective): 4h
  - RPO (Recovery Point Objective): 24h

---

## 📱 **APP STORE READINESS**

### iOS (Apple App Store)

#### Assets Visuais
- [ ] **Ícone da App**
  - 1024x1024 px
  - PNG sem transparência
  - Design profissional
  - Versões: iOS, iPadOS
  - Seguir Human Interface Guidelines

- [ ] **Screenshots**
  - **6.7" (iPhone 15 Pro Max)**: 3-10 screenshots
  - **6.5" (iPhone 14 Pro Max)**: 3-10 screenshots
  - **5.5" (iPhone 8 Plus)**: 3-10 screenshots
  - Português de Portugal
  - Mostrar features principais
  - Text overlay explicativo
  - Consistent branding

- [ ] **App Preview Video** (Opcional mas Recomendado)
  - 15-30 segundos
  - Landscape ou portrait
  - Mostrar fluxo principal
  - Sem som ou com música livre de direitos
  - Formato: .mov ou .mp4

#### Metadata
- [ ] **Textos da App Store**
  - **Nome**: THRIV - Fitness & Nutrição (30 chars max)
  - **Subtítulo**: Acompanha calorias e treinos (30 chars max)
  - **Descrição Curta**: Para Preview Card
  - **Descrição Completa**: 4000 chars
    - O que faz
    - Features principais
    - Benefícios
    - Call-to-action

- [ ] **Keywords**
  - 100 chars max
  - Separados por vírgula
  - Sugestões: fitness,nutrição,calorias,treino,saúde,dieta,peso,macros,proteína
  - Não repetir palavras do nome
  - Research: App Store Connect keywords tool

- [ ] **Categoria**
  - Primary: Health & Fitness
  - Secondary: Food & Drink (opcional)

- [ ] **Age Rating**
  - Responder questionário
  - Provavelmente: 4+ (sem conteúdo sensível)
  - Se tiver comunidade: 12+ ou 17+

#### Legal
- [ ] **URLs Obrigatórias**
  - Privacy Policy URL
  - Terms of Use URL
  - Support URL
  - Marketing URL (website)

- [ ] **App Privacy**
  - Preencher questionário de privacidade
  - Que dados recolhes
  - Como são usados
  - Se partilhas com terceiros
  - Linked to user ou not

---

### Android (Google Play)

#### Assets Visuais
- [ ] **Ícone da App**
  - 512x512 px
  - PNG com transparência
  - Adaptive Icon:
    - Foreground layer (432x432 safe zone)
    - Background layer (full 512x512)
  - Seguir Material Design

- [ ] **Screenshots**
  - Mínimo: 2
  - Máximo: 8
  - Formatos:
    - Phone: 1080x1920
    - Tablet 7": 1200x1920
    - Tablet 10": 1600x2560
  - Português de Portugal

- [ ] **Feature Graphic**
  - 1024x500 px
  - Banner da app
  - Usado no topo da listing
  - Design profissional

- [ ] **Promo Video** (Opcional)
  - YouTube link
  - Aparece no topo da listing
  - 30s-2min

#### Metadata
- [ ] **Textos da Google Play**
  - **Título**: THRIV - Fitness & Nutrição (30 chars max)
  - **Descrição Curta**: 80 chars
    - "Acompanha calorias, macros e treinos. Atinge as tuas metas de fitness."
  - **Descrição Completa**: 4000 chars
    - Formatação: HTML tags permitidas
    - Bullets para features
    - Call-to-action

- [ ] **Categoria e Tags**
  - Categoria: Health & Fitness
  - Tags: fitness, nutrition, calories, workout
  - Content Rating: PEGI 3 ou Everyone

- [ ] **Contact Details**
  - Email: support@thriv.app
  - Telefone (opcional)
  - Website
  - Endereço físico (se empresa)

#### Legal e Compliance
- [ ] **Data Safety Form**
  - Similar ao App Privacy da Apple
  - Que dados recolhes
  - Como são usados e partilhados
  - Segurança e encriptação

- [ ] **Content Rating**
  - Preencher questionário IARC
  - Obter rating: PEGI (Europa), ESRB (US), etc
  - Provavelmente: Everyone ou PEGI 3

---

## 🎨 **BRANDING & DESIGN**

### Identidade Visual

#### Logo
- [ ] **Logo Final da App**
  - Versão cor (full color)
  - Versão branco (white on transparent)
  - Versão preto (black on transparent)
  - Formatos: SVG, PNG, PDF
  - Variações: horizontal, vertical, icon only

- [ ] **Brand Guidelines**
  - Cores oficiais:
    - Primary: #FF6B35 (laranja)
    - Success: #4CAF50 (verde)
    - Info: #2196F3 (azul)
    - Warning: #FFC107 (amarelo)
    - Error: #F44336 (vermelho)
    - Background: #000000 (preto)
  - Tipografia: System fonts (SF Pro, Roboto)
  - Espaçamentos (8px grid)
  - Tom de voz: Motivacional, amigável, português PT

---

### Presença Online

#### Website
- [ ] **Landing Page**
  - Domain: thriv.pt ou thriv.app
  - Sections:
    - Hero: "A tua app de fitness em português"
    - Features: Grid com principais features
    - Screenshots: Carousel
    - Pricing: Se tiver plans
    - Testimonials: Reviews de beta testers
    - Download: Badges App Store + Play Store
    - Footer: Links, Política de Privacidade, Termos
  - Tech: Next.js, Vercel hosting
  - SEO optimizado

- [ ] **Páginas Legais**
  - `/privacy-policy`: Política de Privacidade (PT)
  - `/terms-of-service`: Termos e Condições (PT)
  - `/support`: FAQs e contacto
  - `/about`: Sobre a THRIV

- [ ] **Blog** (Opcional)
  - Artigos sobre fitness e nutrição
  - SEO para atrair tráfego orgânico
  - 1-2 artigos por semana
  - Categorias: Nutrição, Treino, Receitas, Motivação

#### Redes Sociais
- [ ] **Instagram @thriv_pt**
  - Setup de conta business
  - Bio com link para website
  - 10-20 posts iniciais:
    - Screenshots da app
    - Features highlight
    - Tips de nutrição
    - Success stories
    - Behind the scenes
  - Stories diários
  - Reels semanais

- [ ] **Facebook Page**
  - Setup de página
  - Mesmas posts que Instagram
  - Eventos para lançamento
  - Ads preparados

- [ ] **TikTok** (Opcional)
  - Conteúdo rápido e viral
  - Tips de 15-30s
  - Demos da app
  - Challenges

- [ ] **YouTube** (Futuro)
  - Tutorials
  - Success stories
  - Nutrition tips
  - Workout videos

#### Conteúdo Inicial
- [ ] **Content Calendar**
  - Planear 30 dias de conteúdo
  - Mix de posts:
    - Educational (50%)
    - Promotional (30%)
    - Community (20%)
  - Scheduling: Buffer ou Later

---

## ✅ **CHECKLIST FINAL PRÉ-LANÇAMENTO**

### 2 Semanas Antes

#### Técnico
- [ ] Todos os unit tests passam (100%)
- [ ] Todos os integration tests passam (100%)
- [ ] Todos os E2E tests passam (100%)
- [ ] Zero crashes reportados no beta testing (últimos 7 dias)
- [ ] Performance aceitável:
  - App startup time < 3s
  - Screen transitions < 300ms
  - API responses < 1s
  - FPS > 30
- [ ] Todos os textos revistos (sem typos)
- [ ] Todas as traduções correctas (PT-PT)
- [ ] Firebase Security Rules testadas
- [ ] Rate limiting testado
- [ ] Offline mode testado

#### Legal
- [ ] Política de privacidade publicada no site
- [ ] Termos e condições publicados no site
- [ ] RGPD compliance verificado por legal (se possível)
- [ ] Consentimento de cookies implementado
- [ ] Eliminar conta funcional e testado
- [ ] Exportar dados funcional e testado

#### App Stores
- [ ] App Store submission feita (pode demorar 1-7 dias)
- [ ] Play Store submission feita (pode demorar 1-3 dias)
- [ ] Screenshots finalizados (iOS + Android)
- [ ] Descrições finalizadas (PT)
- [ ] Vídeos de preview carregados (opcional)
- [ ] Privacy questionnaires completos
- [ ] Content ratings obtidos

#### Infraestrutura
- [ ] Sentry configurado e testado
- [ ] Firebase Analytics configurado
- [ ] Crashlytics configurado
- [ ] Performance monitoring activo
- [ ] Backups automáticos configurados
- [ ] Alertas configurados (Slack/email)
- [ ] CI/CD pipeline testado

---

### 1 Semana Antes

#### Negócio
- [ ] Preços definidos (se premium):
  - Premium Mensal: €4.99
  - Premium Anual: €39.99
- [ ] Stripe/RevenueCat configurado e testado
- [ ] Métodos de pagamento testados (Multibanco, MB WAY, cartão)
- [ ] Recibos automáticos testados
- [ ] Cancelamento de subscrição testado

#### Marketing
- [ ] Website landing page publicado (thriv.pt)
- [ ] Instagram account criado e com 10+ posts
- [ ] Facebook page criada
- [ ] Press kit preparado:
  - Logo em alta resolução
  - Screenshots
  - Descrição da app
  - Founder bio (se aplicável)
  - Contact info
- [ ] Email list para beta testers preparada

#### Suporte
- [ ] Email de suporte configurado: support@thriv.app
- [ ] Auto-responder configurado
- [ ] FAQs escritas
- [ ] Templates de respostas comuns preparados
- [ ] Sistema de tickets (Zendesk, Freshdesk) ou simplesmente email

---

### 3 Dias Antes

#### Final Checks
- [ ] Fazer release candidate build
- [ ] Testar em 5+ dispositivos diferentes:
  - iPhone novo (14/15)
  - iPhone antigo (8/SE)
  - Android novo (Samsung S23, Pixel 7)
  - Android antigo (Android 10)
  - Tablet (iPad, Android tablet)
- [ ] Testar com dados reais (não teste)
- [ ] Testar todos os fluxos críticos:
  - Registo completo
  - Login
  - Adicionar 10 meals
  - Adicionar 5 workouts
  - Ver todos os graphs
  - Editar perfil
  - Mudar metas
  - Eliminar conta (num ambiente de teste!)
- [ ] Verificar analytics tracking
- [ ] Verificar crashes (zero)

#### Comunicação
- [ ] Email para beta testers informando data de lançamento
- [ ] Posts nas redes sociais schedulados
- [ ] Press release preparado (opcional)
- [ ] Influencers contactados (se aplicável)

---

### Dia do Lançamento 🚀

#### Manhã (8h-10h)
- [ ] ☕ Café (importante!)
- [ ] Verificar status nas App Stores
  - iOS: App Store Connect → "Ready for Sale"?
  - Android: Play Console → "Published"?
- [ ] Se ainda "In Review", esperar aprovação
- [ ] Se "Rejected", corrigir issues ASAP

#### Aprovado → Launch (10h-12h)
- [ ] ✅ Aprovar release no App Store Connect
- [ ] ✅ Aprovar release no Play Console
- [ ] Verificar app aparece nas stores (pode demorar 2-24h)
- [ ] Download nos próprios dispositivos e testar

#### Divulgação (12h-14h)
- [ ] 📱 Post no Instagram: "Hoje é o dia! THRIV já está disponível 🎉"
- [ ] 📘 Post no Facebook
- [ ] 📧 Email para beta testers: "Obrigado por nos ajudarem! App já está live"
- [ ] 🐦 Tweet (se tiver Twitter)
- [ ] Update website: Banner "Já disponível!"

#### Monitoring (14h-24h)
- [ ] 👀 Monitorizar Sentry (crashes)
- [ ] 📊 Monitorizar Firebase Analytics (downloads, registos)
- [ ] ⭐ Monitorizar reviews nas stores
- [ ] 💬 Responder a primeiras reviews
- [ ] 📈 Verificar KPIs:
  - Downloads primeiras 24h
  - Registos
  - Crashes
  - Retention D0
- [ ] 🆘 Estar disponível para hotfixes se necessário

---

### Primeiro Week Post-Launch

#### Monitoring Diário
- [ ] Check Sentry (crashes/erros)
- [ ] Check Firebase Analytics:
  - DAU
  - Registos
  - Retention D1
  - Principais screens visitados
- [ ] Check reviews (App Store + Play Store)
- [ ] Responder a TODAS as reviews (positivas e negativas)
- [ ] Check emails de suporte

#### Comunicação
- [ ] Post diário nas redes sociais
- [ ] Partilhar screenshots de reviews positivas
- [ ] Agradecer aos primeiros utilizadores
- [ ] Stories no Instagram com user-generated content

#### Hotfixes
- [ ] Se crash rate > 1%: release hotfix ASAP
- [ ] Se bug crítico reportado: fix em 24h
- [ ] Se feature não funciona: comunicar e fix

#### Análise
- [ ] Reunião fim de semana 1:
  - KPIs vs objetivos
  - Principais issues
  - Feedback dos utilizadores
  - Decisões: o que corrigir primeiro?

---

## 📊 **MÉTRICAS DE SUCESSO**

### First Week KPIs

| Métrica | Objetivo | Como medir |
|---------|----------|------------|
| **Downloads** | 1000+ | App Store Connect + Play Console |
| **Registos** | 500+ (50% conversion) | Firebase Analytics |
| **DAU** (Daily Active) | 300+ | Firebase Analytics |
| **Retention D1** | >40% | Firebase Analytics |
| **Retention D7** | >20% | Firebase Analytics |
| **Crash-free rate** | >99% | Crashlytics |
| **Rating** | >4.0 ⭐ | App Store + Play Store |
| **Support tickets** | <50 | Email + sistema tickets |

### First Month KPIs

| Métrica | Objetivo | Como medir |
|---------|----------|------------|
| **Downloads** | 5000+ | Stores |
| **Registos** | 2500+ | Analytics |
| **MAU** (Monthly Active) | 2000+ | Analytics |
| **Retention D30** | >10% | Analytics |
| **Paid conversions** | >2% (se freemium) | RevenueCat |
| **NPS** (Net Promoter Score) | >50 | In-app survey |
| **Avg session time** | >5 min | Analytics |
| **Reviews** | 100+ | Stores |

### Health Metrics (Sempre)

| Métrica | Target | Alerta se |
|---------|--------|-----------|
| **Crash rate** | <0.5% | >1% |
| **ANR rate** (Android) | <0.1% | >0.5% |
| **App startup time** | <2s | >3s |
| **API response time** | <1s | >2s |
| **Support response time** | <24h | >48h |
| **App Store rating** | >4.5 ⭐ | <4.0 ⭐ |

---

## 🚨 **ESTIMATIVA DE TEMPO & RECURSOS**

### Breakdown por Prioridade

| Prioridade | Tarefas | Tempo Est. | Recursos |
|------------|---------|------------|----------|
| 🔴 **Crítica** | Legal, Auth, Payments | 8-12 dias | 1 dev + 1 legal consultant |
| 🟠 **Alta** | Features Core, UX | 15-20 dias | 1-2 devs |
| 🟡 **Média** | Features Extra, Performance | 10-15 dias | 1 dev |
| 🟢 **Baixa** | Advanced, Marketing | 10-20 dias | 1 dev + 1 designer |
| 🔧 **Técnico** | Testing, DevOps | 7-10 dias | 1 dev |
| 📱 **App Store** | Prep, Assets | 5-7 dias | 1 designer + 1 marketer |
| 🎨 **Branding** | Website, Social | 5-10 dias | 1 designer + 1 content creator |

### Total Estimado

**Desenvolvimento**: 6-10 semanas (1.5-2.5 meses)
**Design & Marketing**: 2-3 semanas
**Testing & QA**: 1-2 semanas
**Buffer**: 1 semana

**TOTAL**: **10-16 semanas** (2.5-4 meses) com 1-2 pessoas a tempo inteiro

### Modelo Optimizado (MVP)

Se queres lançar mais rápido, foca apenas em:
- 🔴 Crítica (obrigatório)
- 🟠 Alta (essencial para UX)
- Mínimo de 📱 App Store

**Timeline MVP**: **6-8 semanas**

---

## 💡 **RECOMENDAÇÃO DE PRIORIZAÇÃO**

### Phase 1: Legal Foundation (Semana 1-2)
**Objetivo**: Estar legal e compliant
- ✅ Política de Privacidade & Termos
- ✅ RGPD compliance (eliminar conta, exportar dados)
- ✅ Password reset
- ✅ Email verification
- ✅ Firebase Security Rules

**Output**: App legalmente compliant para EU

---

### Phase 2: Core Features (Semana 3-5)
**Objetivo**: Features essenciais para UX
- ✅ Editar/eliminar refeições e treinos
- ✅ Definir e editar metas personalizadas
- ✅ Pesquisa de refeições anteriores
- ✅ Onboarding tutorial
- ✅ Tracking de peso

**Output**: App totalmente funcional

---

### Phase 3: Polish & Quality (Semana 6-7)
**Objetivo**: App polida e sem bugs
- ✅ Substituir Alert.alert() restantes
- ✅ Swipe-to-delete
- ✅ Haptic feedback
- ✅ Unit + Integration tests
- ✅ Performance optimisations
- ✅ Beta testing com 50+ users

**Output**: App production-ready

---

### Phase 4: Store Preparation (Semana 8-9)
**Objetivo**: Preparar para stores
- ✅ Screenshots & descrições (iOS + Android)
- ✅ Website landing page
- ✅ Redes sociais setup
- ✅ Press kit
- ✅ Monitoring & analytics setup
- ✅ Final QA em múltiplos dispositivos

**Output**: Tudo pronto para submeter

---

### Phase 5: Launch & Iterate (Semana 10+)
**Objetivo**: Lançar e melhorar
- ✅ Submit para App Store & Play Store
- ✅ Soft launch (Portugal apenas)
- ✅ Monitorizar métricas e feedback
- ✅ Hotfixes para bugs urgentes
- ✅ Iterar baseado em feedback
- ✅ Preparar features da Phase 2 (Média Prioridade)

**Output**: App live e crescendo

---

## 🎯 **NEXT STEPS IMEDIATOS**

### Esta Semana
1. ☑️ Decidir modelo de negócio:
   - Freemium? (Free + Premium)
   - Paid upfront?
   - Free com ads?
   - **Recomendação**: Freemium com 7 dias trial

2. ☑️ Contratar/encontrar:
   - Legal consultant para RGPD (ou usar templates)
   - Designer para assets da store (ou fazer tu)

3. ☑️ Setup inicial:
   - Domain: thriv.pt ou thriv.app
   - Email: support@thriv.app
   - Redes sociais: @thriv_pt

4. ☑️ Começar Phase 1:
   - Escrever Política de Privacidade
   - Implementar "Eliminar Conta"

### Próxima Semana
- Continuar Phase 1
- Planear Phase 2
- Recruit beta testers (aim: 50 pessoas)

---

## 📞 **RECURSOS & AJUDA**

### Templates & Tools
- **Política de Privacidade**: Termly, iubenda (generators)
- **Termos & Condições**: TermsFeed
- **Email Marketing**: Mailchimp (grátis <2000 subs)
- **Landing Page**: Webflow, Framer (no-code)
- **Analytics**: Firebase (grátis), Mixpanel (grátis)
- **Design**: Figma (grátis), Canva Pro

### Comunidades PT
- **Startup Portugal**: Slack community
- **Portugal Startups**: Facebook group
- **Landing.jobs**: Tech community
- **UPTEC/StartUP Braga**: Incubators

### Apoios & Funding
- **Portugal 2030**: Subsídios para inovação
- **IAPMEI**: Apoio a PMEs
- **Web Summit ALPHA**: Startup competition
- **Caixa Empreender**: Funding

---

## ✅ **CONCLUSÃO**

Esta to-do list é **extensa** mas **realista**. Foca primeiro nas **prioridades críticas** (🔴) e **altas** (🟠).

**Não tentes fazer tudo de uma vez.** Launch um MVP funcional e polido, e depois itera baseado em feedback real dos utilizadores portugueses.

**Lembra-te**:
- ✨ Qualidade > Quantidade de features
- 🚀 Done > Perfect
- 📊 Data-driven decisions
- 💙 Foco no utilizador

---

**Boa sorte com o lançamento! 🇵🇹🚀**

Se precisares de ajuda em alguma destas tarefas, estou aqui! 💪

---

**Documento criado**: 6 Dezembro 2025
**Versão**: 1.0
**Autor**: Claude Code Agent
**Para**: Equipa THRIV
