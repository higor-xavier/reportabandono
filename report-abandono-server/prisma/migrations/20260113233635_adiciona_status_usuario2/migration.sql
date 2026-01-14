-- DropIndex
DROP INDEX `denuncia_fk_responsavel_id_fkey` ON `denuncia`;

-- DropIndex
DROP INDEX `denuncia_fk_usuario_id_fkey` ON `denuncia`;

-- DropIndex
DROP INDEX `historico_denuncia_fk_denuncia_id_denuncia_fkey` ON `historico_denuncia`;

-- DropIndex
DROP INDEX `midia_fk_denuncia_id_denuncia_fkey` ON `midia`;

-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `status_aprovacao` INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `denuncia` ADD CONSTRAINT `denuncia_fk_usuario_id_fkey` FOREIGN KEY (`fk_usuario_id`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `denuncia` ADD CONSTRAINT `denuncia_fk_responsavel_id_fkey` FOREIGN KEY (`fk_responsavel_id`) REFERENCES `usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_denuncia` ADD CONSTRAINT `historico_denuncia_fk_denuncia_id_denuncia_fkey` FOREIGN KEY (`fk_denuncia_id_denuncia`) REFERENCES `denuncia`(`id_denuncia`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `midia` ADD CONSTRAINT `midia_fk_denuncia_id_denuncia_fkey` FOREIGN KEY (`fk_denuncia_id_denuncia`) REFERENCES `denuncia`(`id_denuncia`) ON DELETE CASCADE ON UPDATE CASCADE;
