import prisma from "../lib/prisma";

interface UpdateUserData {
  nomeCompleto?: string;
  numeroContato?: string;
  endereco?: string;
}

export class UsuarioService {
  /**
   * Atualiza os dados do usuário
   * Permite atualizar: nomeCompleto, numeroContato, endereco
   * @param userId - ID do usuário
   * @param data - Dados para atualizar
   * @returns Usuário atualizado (sem senha)
   */
  static async update(userId: number, data: UpdateUserData) {
    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se o usuário não está inativo (status 2)
    if (usuario.status === 2) {
      throw new Error("Não é possível atualizar um usuário inativo");
    }

    // Preparar dados para atualização (apenas campos permitidos)
    const updateData: any = {};

    if (data.nomeCompleto !== undefined) {
      updateData.nomeCompleto = data.nomeCompleto.trim() || null;
    }

    if (data.numeroContato !== undefined) {
      updateData.numeroContato = data.numeroContato.trim() || null;
    }

    if (data.endereco !== undefined) {
      updateData.endereco = data.endereco.trim() || null;
    }

    // Atualizar usuário
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        tipoUsuario: true,
        status: true,
        cpf: true,
        cnpj: true,
        endereco: true,
        numeroContato: true,
        latitude: true,
        longitude: true,
        criadoEm: true,
      },
    });

    return usuarioAtualizado;
  }

  /**
   * Exclui ou desativa um usuário
   * Se o usuário tiver denúncias: Soft Delete (status = 2)
   * Se não tiver denúncias: Hard Delete (remove do banco)
   * @param userId - ID do usuário
   * @returns Objeto com informação sobre o que foi feito
   */
  static async delete(userId: number) {
    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        denunciasCriadas: true,
      },
    });

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    // Verificar se o usuário tem denúncias
    const temDenuncias = usuario.denunciasCriadas.length > 0;

    if (temDenuncias) {
      // Soft Delete: Apenas alterar status para 2 (Inativo/Excluído Logicamente)
      await prisma.usuario.update({
        where: { id: userId },
        data: {
          status: 2, // Inativo/Excluído Logicamente
        },
      });

      return {
        deleted: false,
        message: "Usuário desativado. Seus dados foram mantidos para integridade do histórico devido às denúncias registradas.",
        denunciasCount: usuario.denunciasCriadas.length,
      };
    } else {
      // Hard Delete: Remover permanentemente do banco
      await prisma.usuario.delete({
        where: { id: userId },
      });

      return {
        deleted: true,
        message: "Conta excluída permanentemente. Todos os seus dados foram removidos.",
        denunciasCount: 0,
      };
    }
  }

  /**
   * Busca dados do usuário por ID
   * @param userId - ID do usuário
   * @returns Usuário (sem senha)
   */
  static async findById(userId: number) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nomeCompleto: true,
        email: true,
        tipoUsuario: true,
        status: true,
        cpf: true,
        cnpj: true,
        endereco: true,
        numeroContato: true,
        latitude: true,
        longitude: true,
        criadoEm: true,
      },
    });

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    return usuario;
  }
}
