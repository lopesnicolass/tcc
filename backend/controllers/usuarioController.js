const bcrypt = require("bcrypt");

const {
    listarUsuarios,
    excluirUsuario,
    buscarUsuarioPorId,
    buscarSenhaPorId,
    buscarUsuarioPorEmail,
    atualizarPerfil,
    atualizarPerfilESenha,
    atualizarSenha,
    atualizarFoto
} = require("../models/usuarioModel");
const { encerrarOutrasSessoes } = require("../models/sessaoModel");


// =====================================================
// LISTAR TODOS OS USUÁRIOS
// =====================================================

function listarTodosUsuarios(req, res) {

    listarUsuarios((erro, usuarios) => {

        if (erro) {

            console.error(erro);

            return res.status(500).json({
                mensagem: "Erro ao consultar usuários."
            });
        }

        return res.status(200).json({
            usuarios
        });
    });
}


// =====================================================
// BUSCAR MEU PERFIL
// =====================================================

function buscarMeuPerfil(req, res) {

    const usuarioId = Number(req.usuario.id);

    buscarUsuarioPorId(
        usuarioId,
        (erro, usuario) => {

            if (erro) {

                console.error(
                    "❌ Erro ao buscar perfil:",
                    erro
                );

                return res.status(500).json({
                    mensagem: "Erro ao buscar perfil."
                });
            }

            if (!usuario) {

                return res.status(404).json({
                    mensagem: "Usuário não encontrado."
                });
            }

            return res.status(200).json({
                usuario
            });

        }
    );
}


// =====================================================
// ATUALIZAR PERFIL
// =====================================================

async function editarPerfil(req, res) {
    const usuarioId = Number(req.usuario.id);
    const { nome, email, senhaAtual, novaSenha } = req.body || {};
    const nomeNormalizado = String(nome || '').trim();
    const emailNormalizado = String(email || '').trim().toLowerCase();

    if (nomeNormalizado.length < 2) return res.status(400).json({ mensagem: 'O nome deve possuir pelo menos 2 caracteres.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) return res.status(400).json({ mensagem: 'Informe um e-mail válido.' });
    if (novaSenha && (!senhaAtual || String(novaSenha).length < 6)) {
        return res.status(400).json({ mensagem: 'Informe sua senha atual e uma nova senha com pelo menos 6 caracteres.' });
    }

    const promisificar = (funcao, ...args) => new Promise((resolve, reject) => {
        funcao(...args, (erro, dado) => erro ? reject(erro) : resolve(dado));
    });
    try {
        const usuario = await promisificar(buscarUsuarioPorId, usuarioId);
        if (!usuario) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
        const outroUsuario = await promisificar(buscarUsuarioPorEmail, emailNormalizado);
        if (outroUsuario && Number(outroUsuario.id) !== usuarioId) {
            return res.status(409).json({ mensagem: 'Este e-mail já está sendo utilizado.' });
        }

        if (novaSenha) {
            const senhaSalva = await promisificar(buscarSenhaPorId, usuarioId);
            if (!senhaSalva || !await bcrypt.compare(String(senhaAtual), senhaSalva.senha)) {
                return res.status(401).json({ mensagem: 'A senha atual está incorreta.' });
            }
            const hash = await bcrypt.hash(String(novaSenha), 10);
            // Nome, e-mail e senha são gravados juntos; não há sucesso parcial.
            await promisificar(atualizarPerfilESenha, usuarioId, nomeNormalizado, emailNormalizado, hash);
            // A sessão atual permanece; dispositivos anteriores são desconectados.
            await promisificar(encerrarOutrasSessoes, usuarioId, req.sessaoId);
        } else {
            await promisificar(atualizarPerfil, usuarioId, nomeNormalizado, emailNormalizado);
        }
        const usuarioAtualizado = await promisificar(buscarUsuarioPorId, usuarioId);
        return res.status(200).json({ mensagem: 'Perfil atualizado com sucesso!', usuario: usuarioAtualizado });
    } catch (erro) {
        console.error('Erro ao atualizar perfil:', erro);
        return res.status(500).json({ mensagem: 'Não foi possível concluir a atualização do perfil.' });
    }
}


// =====================================================
// ATUALIZAR FOTO
// =====================================================
function editarFoto(req, res) {

    const usuarioId =
        Number(req.usuario.id);

    if (!req.file) {
        return res.status(400).json({
            mensagem:
                "Nenhuma imagem foi enviada."
        });
    }

    atualizarFoto(
        usuarioId,
        req.file.buffer,
        req.file.mimetype,
        (erro, alterados) => {

            if (erro) {
                console.error(
                    "Erro ao atualizar foto:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao salvar foto."
                });
            }

            if (alterados === 0) {
                return res.status(404).json({
                    mensagem:
                        "Usuário não encontrado."
                });
            }

            return res.status(200).json({
                mensagem:
                    "Foto atualizada com sucesso!"
            });
        }
    );
}

// =====================================================
// EXCLUIR USUÁRIO
// =====================================================

function excluir(req, res) {

    const usuarioId =
        Number(req.params.id);


    if (!usuarioId) {

        return res.status(400).json({
            mensagem: "Usuário inválido."
        });

    }


    if (req.usuario.id === usuarioId) {

        return res.status(400).json({
            mensagem:
                "O administrador não pode excluir a própria conta."
        });

    }


    excluirUsuario(
        usuarioId,
        (erro, alterados) => {

            if (erro) {

                console.error(
                    "❌ Erro ao excluir usuário:",
                    erro
                );

                return res.status(500).json({
                    mensagem:
                        "Erro ao excluir usuário."
                });

            }


            if (alterados === 0) {

                return res.status(404).json({
                    mensagem:
                        "Usuário não encontrado."
                });

            }


            return res.status(200).json({
                mensagem:
                    "Usuário excluído com sucesso."
            });

        }
    );
}


// =====================================================
// EXPORTAR
// =====================================================

module.exports = {

    listarTodosUsuarios,
    buscarMeuPerfil,
    editarPerfil,
    editarFoto,
    excluir

};