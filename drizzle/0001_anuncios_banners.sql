ALTER TABLE `anuncios` ADD `formato` text DEFAULT 'horizontal' NOT NULL;--> statement-breakpoint
ALTER TABLE `anuncios` ADD `categoria_id` text REFERENCES categorias(id);--> statement-breakpoint
ALTER TABLE `anuncios` ADD `anunciante` text(100);--> statement-breakpoint
ALTER TABLE `anuncios` ADD `cta` text(40);--> statement-breakpoint
ALTER TABLE `anuncios` ADD `preco` text(40);--> statement-breakpoint
ALTER TABLE `anuncios` ADD `imagem_url` text(500);--> statement-breakpoint
ALTER TABLE `anuncios` ADD `icone` text(40);--> statement-breakpoint
ALTER TABLE `anuncios` ADD `tema` text DEFAULT 'marca' NOT NULL;--> statement-breakpoint
ALTER TABLE `anuncios` ADD `cliques` integer DEFAULT 0 NOT NULL;