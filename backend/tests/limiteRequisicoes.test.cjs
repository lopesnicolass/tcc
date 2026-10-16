const test = require('node:test');
const assert = require('node:assert/strict');
const { limitarRequisicoes } = require('../middleware/limiteRequisicoes');

test('limite bloqueia excesso de tentativas para mesma origem', () => {
    const middleware = limitarRequisicoes({ maximo: 2 });
    function enviar(ip) {
        let status = 200, prox = false;
        const req = { ip, body: {} };
        const res = { set() { return this; }, status(code) { status = code; return this; }, json() { return this; } };
        middleware(req, res, () => { prox = true; });
        return { status, prox };
    }
    assert.equal(enviar('1.2.3.4').prox, true);
    assert.equal(enviar('1.2.3.4').prox, true);
    assert.equal(enviar('1.2.3.4').status, 429);
    assert.equal(enviar('5.6.7.8').prox, true);
});
