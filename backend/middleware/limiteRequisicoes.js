const crypto = require('crypto');
function limitarRequisicoes({ janelaMs = 15 * 60 * 1000, maximo = 10, maximoIP = maximo, usarEmail = false } = {}) {
    const tentativas = new Map();
    return function limite(req, res, next) {
        const agora = Date.now();
        if (tentativas.size > 20000) {
            for (const [chave, entrada] of tentativas) if (entrada.expira <= agora) tentativas.delete(chave);
        }
        const ip = req.ip || req.socket?.remoteAddress || 'desconhecido';
        const email = String(req.body?.email || '').trim().toLowerCase();
        const chaveEmail = usarEmail && email ? 'email:' + crypto.createHash('sha256').update(email).digest('hex') : '';
        const limites = [[ip, maximoIP], ...(chaveEmail ? [[chaveEmail, maximo]] : [])];
        if (limites.some(([chave, limite]) => {
            const info = tentativas.get(chave);
            return info && info.expira > agora && info.contagem >= limite;
        })) {
            res.set('Retry-After', String(Math.ceil(janelaMs / 1000)));
            return res.status(429).json({ mensagem: 'Muitas tentativas. Tente novamente mais tarde.' });
        }
        for (const [chave] of limites) {
            const anterior = tentativas.get(chave);
            if (!anterior || anterior.expira <= agora) tentativas.set(chave, { contagem: 1, expira: agora + janelaMs });
            else anterior.contagem++;
        }
        next();
    };
}
module.exports = { limitarRequisicoes };
