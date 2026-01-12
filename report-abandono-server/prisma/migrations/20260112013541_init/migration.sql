-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_completo` VARCHAR(255) NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(255) NULL,
    `tipo_usuario` VARCHAR(50) NULL,
    `cpf` VARCHAR(20) NULL,
    `cnpj` VARCHAR(20) NULL,
    `endereco` VARCHAR(255) NULL,
    `numero_contato` VARCHAR(20) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(10, 8) NULL,
    `criado_em` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `token_esqueceu_senha` BOOLEAN NULL DEFAULT false,

    UNIQUE INDEX `usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `denuncia` (
    `id_denuncia` INTEGER NOT NULL AUTO_INCREMENT,
    `descricao` VARCHAR(255) NULL,
    `tipo_registro` VARCHAR(255) NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `data_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `localizacao` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(10, 8) NULL,
    `fk_usuario_id` INTEGER NULL,
    `fk_responsavel_id` INTEGER NULL,

    PRIMARY KEY (`id_denuncia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historico_denuncia` (
    `id_historico` INTEGER NOT NULL AUTO_INCREMENT,
    `status_anterior` INTEGER NULL,
    `status_novo` INTEGER NULL,
    `data_alteracao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacao` VARCHAR(255) NULL,
    `fk_denuncia_id_denuncia` INTEGER NOT NULL,

    PRIMARY KEY (`id_historico`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `midia` (
    `id_midia` INTEGER NOT NULL AUTO_INCREMENT,
    `caminho_arquivo` VARCHAR(255) NULL,
    `tipo_midia` VARCHAR(50) NULL,
    `data_envio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fk_denuncia_id_denuncia` INTEGER NOT NULL,

    PRIMARY KEY (`id_midia`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `denuncia` ADD CONSTRAINT `denuncia_fk_usuario_id_fkey` FOREIGN KEY (`fk_usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `denuncia` ADD CONSTRAINT `denuncia_fk_responsavel_id_fkey` FOREIGN KEY (`fk_responsavel_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_denuncia` ADD CONSTRAINT `historico_denuncia_fk_denuncia_id_denuncia_fkey` FOREIGN KEY (`fk_denuncia_id_denuncia`) REFERENCES `denuncia`(`id_denuncia`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `midia` ADD CONSTRAINT `midia_fk_denuncia_id_denuncia_fkey` FOREIGN KEY (`fk_denuncia_id_denuncia`) REFERENCES `denuncia`(`id_denuncia`) ON DELETE CASCADE ON UPDATE CASCADE;
