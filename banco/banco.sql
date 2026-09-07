-- ==========================================
-- BANCO DE DADOS
-- ==========================================

DROP DATABASE IF EXISTS vestibulinho;

CREATE DATABASE vestibulinho
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE vestibulinho;

-- ==========================================
-- TABELA DE USUÁRIOS
-- ==========================================

CREATE TABLE usuarios (

    id INT AUTO_INCREMENT PRIMARY KEY,

    nome VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    senha VARCHAR(255) NOT NULL,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
CREATE TABLE resultados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    acertos INT NOT NULL,
    erros INT NOT NULL,
    total_questoes INT NOT NULL,
    porcentagem DECIMAL(5,2) NOT NULL,
    data_realizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ==========================================
-- TESTE
-- ==========================================

SELECT * FROM usuarios;