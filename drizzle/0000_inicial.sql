CREATE TABLE `anuncios` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo` text(120) NOT NULL,
	`texto` text(255),
	`link` text(500) NOT NULL,
	`posicao` text NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `artigos_blog` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo` text(200) NOT NULL,
	`resumo` text(300),
	`conteudo` text NOT NULL,
	`categoria` text(60) DEFAULT 'Gestão' NOT NULL,
	`imagem_url` text(500),
	`destaque` integer DEFAULT false NOT NULL,
	`autor_id` text,
	`publicado` integer DEFAULT false NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`autor_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `avaliacoes` (
	`id` text PRIMARY KEY NOT NULL,
	`empresa_id` text NOT NULL,
	`usuario_id` text NOT NULL,
	`nota` integer NOT NULL,
	`comentario` text,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `categorias` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text(100) NOT NULL,
	`icone` text(100)
);
--> statement-breakpoint
CREATE TABLE `empresas` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`nome_empresa` text(150) NOT NULL,
	`descricao` text NOT NULL,
	`categoria_id` text NOT NULL,
	`telefone` text(20) NOT NULL,
	`whatsapp` text(20) NOT NULL,
	`email` text(255) NOT NULL,
	`endereco` text(255),
	`cidade` text(100) NOT NULL,
	`logo_url` text(500),
	`plano` text DEFAULT 'free' NOT NULL,
	`aprovado` integer DEFAULT false NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`empresa_id` text NOT NULL,
	`usuario_id` text,
	`nome_contato` text(100) NOT NULL,
	`email_contato` text(255) NOT NULL,
	`telefone_contato` text(20),
	`mensagem` text NOT NULL,
	`status` text DEFAULT 'novo' NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`empresa_id`) REFERENCES `empresas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `mensagens_chat` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`remetente_id` text NOT NULL,
	`mensagem` text NOT NULL,
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`remetente_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text(100) NOT NULL,
	`email` text(255) NOT NULL,
	`senha_hash` text(255) NOT NULL,
	`tipo` text NOT NULL,
	`telefone` text(20),
	`criado_em` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);